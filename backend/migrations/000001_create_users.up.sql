CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    display_name        VARCHAR(255) NOT NULL,
    role                user_role NOT NULL,
    verified            BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    company_name        VARCHAR(255) NOT NULL DEFAULT '',
    bin                 VARCHAR(20) NOT NULL DEFAULT '',
    position            VARCHAR(255) NOT NULL DEFAULT '',
    phone               VARCHAR(50) NOT NULL DEFAULT '',
    verification_status verification_status NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
