-- Seed initial platform admin for pilot delivery.
--
-- Email:    admin@silkroadhub.kz
-- Password: Admin123!SRH
--
-- IMPORTANT: change the password immediately in production by either
--   (a) updating the row via PUT /api/auth/profile after first login, or
--   (b) setting SRH_ADMIN_INIT_PASSWORD and regenerating the hash via
--       go run ./cmd/seedhash <new-password> and replacing the value below.
--
-- Hash generated with golang.org/x/crypto/bcrypt cost=10.
INSERT INTO users (
    id, email, password_hash, display_name, role,
    verified, email_verified, verification_status
) VALUES (
    gen_random_uuid(),
    'admin@silkroadhub.kz',
    '$2a$10$vaywP2Wfb6e6SE.kSObLdearzQeD5pTj2hv7LGIe6U9.JfY31IIjq',
    'Platform Admin',
    'admin',
    TRUE,
    TRUE,
    'verified'
) ON CONFLICT (email) DO NOTHING;
