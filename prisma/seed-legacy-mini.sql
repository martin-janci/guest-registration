-- Minimal legacy schema subset (just columns the importer reads).
-- Column names and types match the live production dump verbatim.

CREATE TABLE guest_reg_user (
  id SERIAL PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(120),
  role VARCHAR(20) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE guest_reg_amenity (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(255),
  admin_id INTEGER REFERENCES guest_reg_user(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE guest_reg_calendar (
  id SERIAL PRIMARY KEY,
  amenity_id INTEGER REFERENCES guest_reg_amenity(id),
  ics_url TEXT NOT NULL,
  sync_interval INTEGER DEFAULT 60,
  last_synced_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE guest_reg_trip (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amenity_id INTEGER REFERENCES guest_reg_amenity(id),
  admin_id INTEGER REFERENCES guest_reg_user(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  confirm_code VARCHAR(32) UNIQUE,
  source VARCHAR(16) DEFAULT 'MANUAL',
  external_reservation_id VARCHAR(64),
  external_confirm_code VARCHAR(64),
  external_guest_name VARCHAR(255),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE guest_reg_registration (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES guest_reg_trip(id),
  status VARCHAR(20) NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  gdpr_consent BOOLEAN DEFAULT FALSE
);

CREATE TABLE guest_reg_guest (
  id SERIAL PRIMARY KEY,
  registration_id INTEGER REFERENCES guest_reg_registration(id),
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  date_of_birth DATE,
  age_category VARCHAR(10) NOT NULL,
  document_type VARCHAR(20),
  document_number VARCHAR(64),
  document_image VARCHAR(255),
  nationality VARCHAR(2)
);

CREATE TABLE guest_reg_invoice (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES guest_reg_user(id),
  invoice_number VARCHAR(32) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_address TEXT,
  client_ico VARCHAR(32),
  client_dic VARCHAR(32),
  client_icdph VARCHAR(32),
  currency VARCHAR(3) DEFAULT 'EUR',
  issued_at DATE NOT NULL,
  due_date DATE,
  delivered_at DATE,
  status VARCHAR(16) NOT NULL,
  notes TEXT,
  total_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE guest_reg_invoice_item (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES guest_reg_invoice(id),
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(4,2) DEFAULT 0.0,
  total_with_vat NUMERIC(10,2) NOT NULL,
  position INTEGER DEFAULT 0
);

CREATE TABLE guest_reg_housekeeping (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES guest_reg_trip(id),
  amenity_id INTEGER REFERENCES guest_reg_amenity(id),
  housekeeper_id INTEGER REFERENCES guest_reg_user(id),
  service_date DATE NOT NULL,
  status VARCHAR(16) NOT NULL,
  pay_amount NUMERIC(10,2),
  paid BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT
);

CREATE TABLE guest_reg_housekeeping_photo (
  id SERIAL PRIMARY KEY,
  housekeeping_id INTEGER REFERENCES guest_reg_housekeeping(id),
  file_path VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- ------ DATA ------
INSERT INTO guest_reg_user (id, username, password_hash, email, role) VALUES
  (1, 'admin',   'pbkdf2:sha256:dummy', 'admin@example.com', 'admin'),
  (2, 'cleaner', 'pbkdf2:sha256:dummy', 'hk@example.com',    'housekeeper');

INSERT INTO guest_reg_amenity (id, name, address, admin_id, is_deleted) VALUES
  (1, 'Villa A', 'Street 1, Bratislava', 1, FALSE),
  (2, 'Villa B (archived)', 'Street 2', 1, TRUE);

INSERT INTO guest_reg_calendar (id, amenity_id, ics_url, sync_interval) VALUES
  (1, 1, 'https://www.airbnb.com/calendar/ical/xxxx.ics', 60),
  (2, 2, 'https://www.airbnb.com/calendar/ical/yyyy.ics', 120);

INSERT INTO guest_reg_trip (id, title, amenity_id, admin_id, start_date, end_date, confirm_code, source, external_reservation_id, external_guest_name, is_deleted) VALUES
  (1, 'May stay',       1, 1, '2026-05-01', '2026-05-05', 'ABC123',   'MANUAL',  NULL, NULL, FALSE),
  (2, 'Airbnb arrival', 1, 1, '2026-05-10', '2026-05-15', 'AIRBXYZ',  'AIRBNB', 'HMABCDEFGH', 'John Smith', FALSE),
  (3, 'Cancelled',      2, 1, '2026-04-01', '2026-04-02', 'CANC01',   'MANUAL',  NULL, NULL, TRUE);

INSERT INTO guest_reg_registration (id, trip_id, status, gdpr_consent) VALUES
  (1, 1, 'pending', TRUE),
  (2, 2, 'approved', TRUE);

INSERT INTO guest_reg_guest (id, registration_id, first_name, last_name, date_of_birth, age_category, document_type, document_number, document_image, nationality) VALUES
  (1, 1, 'Alice',   'Doe',   '1985-03-14', 'adult', 'passport', 'P1234567', 'registration_1_alice.jpg', 'SK'),
  (2, 2, 'Bob',     'Smith', '1990-06-22', 'adult', 'idcard',   'ID999888', 'registration_2_bob.jpg',   'CZ'),
  (3, 2, 'Charlie', 'Smith', '2020-01-01', 'child', NULL,       NULL,       NULL,                        'CZ');

INSERT INTO guest_reg_invoice (id, admin_id, invoice_number, client_name, client_address, currency, issued_at, due_date, status, total_amount) VALUES
  (1, 1, '2026-0001', 'ACME s.r.o.',  'Street 3, BA', 'EUR', '2026-04-10', '2026-04-24', 'DRAFT', 120.00),
  (2, 1, '2026-0002', 'Beta spol.',   'Street 4, KE', 'EUR', '2026-04-12', '2026-04-26', 'SENT',   96.00);

INSERT INTO guest_reg_invoice_item (id, invoice_id, description, quantity, unit_price, vat_rate, total_with_vat, position) VALUES
  (1, 1, 'Cleaning', 2, 50.00, 0.20, 120.00, 1),
  (2, 1, 'Linen',    0, 0.00,  0.00,   0.00, 2),
  (3, 2, 'Stay x4',  4, 20.00, 0.20,  96.00, 1),
  (4, 2, 'Extras',   0, 0.00,  0.00,   0.00, 2);

INSERT INTO guest_reg_housekeeping (id, trip_id, amenity_id, housekeeper_id, service_date, status, pay_amount, paid) VALUES
  (1, 1, 1, 2, '2026-05-05', 'COMPLETED', 25.00, TRUE),
  (2, 2, 1, 2, '2026-05-15', 'PENDING',   25.00, FALSE);

INSERT INTO guest_reg_housekeeping_photo (id, housekeeping_id, file_path) VALUES
  (1, 1, 'housekeeping_1_clean.jpg');

SELECT setval('guest_reg_user_id_seq', 2);
SELECT setval('guest_reg_amenity_id_seq', 2);
SELECT setval('guest_reg_calendar_id_seq', 2);
SELECT setval('guest_reg_trip_id_seq', 3);
SELECT setval('guest_reg_registration_id_seq', 2);
SELECT setval('guest_reg_guest_id_seq', 3);
SELECT setval('guest_reg_invoice_id_seq', 2);
SELECT setval('guest_reg_invoice_item_id_seq', 4);
SELECT setval('guest_reg_housekeeping_id_seq', 2);
SELECT setval('guest_reg_housekeeping_photo_id_seq', 1);
