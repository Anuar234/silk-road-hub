-- Audit log for user mutating actions (TЗ 9: "журналирование действий пользователей")
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    method      VARCHAR(8) NOT NULL,
    path        VARCHAR(512) NOT NULL,
    status_code INTEGER NOT NULL,
    ip_address  INET,
    user_agent  TEXT,
    duration_ms BIGINT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_method ON audit_log(method);
CREATE INDEX idx_audit_log_path ON audit_log(path);
