# Cutover runbook: Flask v1.9.4 → v2

**Target window:** ~1 hour, low-traffic evening (20:00–21:00 CET).
**Actors:** one operator with SSH access to the NAS and docker registry push access.
**Rollback window:** 24 hours — legacy stack stays up on `airbnb-legacy.rlt.sk` and can be flipped back in <5 min.

## T-24h — Rehearsal

1. SSH to NAS, dump the live DB and uploads:
   ```bash
   docker exec guest_registration_db \
     pg_dump -U postgres guest_registration \
     > /volume1/homes/mjanci/backups/guest_registration_$(date -I).sql
   tar -C /volume1/docker/guest_registration_app/static/uploads \
       -cf /volume1/homes/mjanci/backups/uploads_$(date -I).tar .
   ```

2. Copy both files to a staging host with Docker + Node 22.

3. Stand up the v2 stack against a staging domain (`airbnb-v2-staging.rlt.sk`):
   ```bash
   cp deploy/.env.nas.example .env
   # edit .env — fill staging secrets, point DATABASE_URL at the staging DB
   export APP_IMAGE=registry.rlt.sk/guest-registration-v2:latest
   docker compose pull
   docker compose up -d db migrate
   # wait for `migrate` to exit 0
   docker compose logs -f migrate   # Ctrl-C once you see "Applying migration"
   tsx scripts/import-legacy.ts \
       --dump    /path/to/guest_registration_<date>.sql \
       --uploads /path/to/uploads_<date>.tar
   # Expect: {"discrepancies":[],"counts":{...},"uploaded":N}
   docker compose up -d app
   ```

4. Run the E2E suite against staging:
   ```bash
   E2E_BASE_URL=https://airbnb-v2-staging.rlt.sk npm run e2e
   ```

5. Manually smoke: login, open each admin tab, download one invoice PDF, complete one housekeeping task.

## T-0 — Cutover

1. **Announce maintenance** (optional) — post to the operations channel.
2. **Maintenance page**: toggle a 503 maintenance page for `airbnb.rlt.sk` in nginx-proxy (so the Flask app stops receiving writes).
3. **Final dump** on the NAS:
   ```bash
   docker exec guest_registration_db pg_dump -U postgres guest_registration > /tmp/guest_reg_cutover.sql
   tar -C /volume1/docker/guest_registration_app/static/uploads -cf /tmp/uploads_cutover.tar .
   ```
4. **SCP** both files to the app host.
5. **Run the importer** against the production v2 DB. Expected duration <2 min.
   ```bash
   tsx scripts/import-legacy.ts --dump /tmp/guest_reg_cutover.sql --uploads /tmp/uploads_cutover.tar
   ```
6. **Verify** the output ends with `"discrepancies":[]`. Any non-empty list → **abort**, jump to Rollback.
7. `docker compose up -d app`. Watch `docker logs -f guest_registration_v2_app`. Wait for `/api/health/readiness` to return 200:
   ```bash
   until curl -sf http://localhost:3000/api/health/readiness; do sleep 1; done
   ```
8. **Flip nginx-proxy** — the v2 container's `VIRTUAL_HOST=airbnb.rlt.sk` is already set; reload nginx-proxy so it picks up the new upstream:
   ```bash
   docker exec nginx-proxy nginx -s reload
   ```
9. **Re-point legacy** to `airbnb-legacy.rlt.sk`:
   ```bash
   # edit /volume1/homes/mjanci/airbnb/docker-compose.yml:
   #   VIRTUAL_HOST: airbnb-legacy.rlt.sk
   #   LETSENCRYPT_HOST: airbnb-legacy.rlt.sk
   cd /volume1/homes/mjanci/airbnb && docker compose up -d
   docker exec nginx-proxy nginx -s reload
   ```
10. **Live smoke test**:
    ```bash
    curl -sf https://airbnb.rlt.sk/api/health/liveness
    curl -sf https://airbnb.rlt.sk/api/health/readiness
    # log in as admin, open /admin/dashboard — every tab loads
    # visit /register/<a real trip confirm code> — form renders
    ```
11. **Hook up Synology Task Scheduler** for `/api/cron/sync-airbnb` — or leave the in-process node-cron scheduler running. Verify it's firing via `/admin/jobs`.

## Rollback

Triggered when: import discrepancies > 0, app won't start, smoke tests fail, or real users hit errors in the first minutes.

1. Flip nginx-proxy's `airbnb.rlt.sk` upstream back to the legacy `guest_registration_app` container (restore the legacy compose's `VIRTUAL_HOST=airbnb.rlt.sk`).
2. `docker exec nginx-proxy nginx -s reload`.
3. The legacy DB is **untouched** — writes during the v2 window are lost. Any registrations submitted in that window are captured in the admin-notification emails (manually re-enter if needed).
4. File a post-mortem; schedule a second rehearsal.

## T+24h — Post-cutover

1. Snapshot the v2 DB + MinIO uploads:
   ```bash
   docker exec guest_registration_v2_db pg_dump -U grv2 guest_registration_v2 > /volume1/homes/mjanci/backups/v2_postcutover.sql
   mc mirror minio/guest-registration /volume1/homes/mjanci/backups/v2_uploads_postcutover/
   ```
2. Archive the legacy image + DB volume to cold storage on Synology.
3. Keep `airbnb-legacy.rlt.sk` up for 30 days for reference.
4. After 30 days without incident: stop the legacy compose stack, retain the archive indefinitely.
5. Decommission `registry.rlt.sk/guest-registration-system:latest` → mark v1 images as archived-only.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `discrepancies: ["Invoice X: items sum != total"]` | VAT rounding drift in legacy data | Re-run with `--dry-run`, inspect; accept drift < 0.01 per invoice; abort if any drift > 0.10 — fix the mapper |
| `app` container restart-loops | `migrate` didn't finish before `app` started | `docker compose up -d db migrate` → wait for `migrate` exit 0 → `docker compose up -d app` |
| `/api/cron/sync-airbnb` → 401 | `CRON_SECRET` drift between Task Scheduler and `.env` | Update the `X-Cron-Secret` header in the Synology Task definition to match the current `.env` value |
| Airbnb sync empty | ics URL changed on the host property | Edit calendar in `/admin/calendars`, re-check the URL in the Airbnb host dashboard |
| `/admin/invoices/<id>/pdf` → 500 | `@react-pdf/renderer` needs fonts it can't find in the runner image | Ensure the base image has `fonts-dejavu-core` (already included in `node:22-bookworm-slim`); check logs for the actual missing font |
| Guest self-reg returns 500 on upload | MinIO bucket missing or `MINIO_*` env wrong | `mc alias set minio http://minio:9000 <key> <secret>` + `mc mb minio/guest-registration` |
| Scheduler not firing | `NODE_ENV !== 'production'` OR `DISABLE_SCHEDULER=1` | Inspect container env: `docker exec guest_registration_v2_app env | grep -E '(NODE_ENV|DISABLE_SCHEDULER)'` |

## Pre-flight checklist (print before T-0)

- [ ] Current v2 tag (`v0.1`) pushed to `registry.rlt.sk`
- [ ] `.env` on NAS filled in, including a fresh `CRON_SECRET`
- [ ] MinIO bucket `guest-registration` exists and is writable by the v2 app's credentials
- [ ] DNS for `airbnb-legacy.rlt.sk` resolves (needed before the legacy flip)
- [ ] Letsencrypt cert for `airbnb-legacy.rlt.sk` issued (nginx-proxy-acme-companion handles this on restart)
- [ ] Synology Task Scheduler task for `/api/cron/sync-airbnb` disabled during cutover window
- [ ] Operator has root shell on NAS and can reload nginx-proxy
- [ ] Rollback plan walked through mentally; legacy compose file is ready to flip back
