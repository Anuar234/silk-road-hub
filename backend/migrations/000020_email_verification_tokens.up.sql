-- Email verification tokens (ТЗ §5.1: подтверждение email).
-- Tokens are issued at registration and on demand via "resend"; each token has
-- a 24-hour TTL and may be used at most once. The pilot does not ship an SMTP
-- integration: the token is logged at INFO level so an operator can deliver it
-- by other means until SMTP is wired in.
CREATE TABLE email_verification_tokens (
    token        VARCHAR(64) PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ NOT NULL,
    consumed_at  TIMESTAMPTZ
);

CREATE INDEX idx_email_verification_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);
