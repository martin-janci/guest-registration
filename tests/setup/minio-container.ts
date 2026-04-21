import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';

export interface StartedMinio {
  container: StartedTestContainer;
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export async function startMinio(bucket = 'guest-registration'): Promise<StartedMinio> {
  const accessKey = 'testuser';
  const secretKey = 'testpass123';

  const container = await new GenericContainer('minio/minio:latest')
    .withCommand(['server', '/data'])
    .withEnvironment({
      MINIO_ROOT_USER: accessKey,
      MINIO_ROOT_PASSWORD: secretKey,
    })
    .withExposedPorts(9000)
    .withWaitStrategy(Wait.forHttp('/minio/health/live', 9000).forStatusCode(200))
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(9000);
  const endpoint = `http://${host}:${port}`;

  process.env.MINIO_ENDPOINT = endpoint;
  process.env.MINIO_ACCESS_KEY = accessKey;
  process.env.MINIO_SECRET_KEY = secretKey;
  process.env.MINIO_BUCKET = bucket;

  return { container, endpoint, accessKey, secretKey, bucket };
}
