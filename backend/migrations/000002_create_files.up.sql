CREATE TABLE files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name   VARCHAR(512) NOT NULL,
    mime            VARCHAR(128) NOT NULL,
    size            BIGINT NOT NULL,
    ext             VARCHAR(16) NOT NULL,
    storage_path    VARCHAR(1024) NOT NULL,
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);

CREATE TABLE user_company_docs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id     UUID NOT NULL REFERENCES files(id),
    attached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_company_docs_user ON user_company_docs(user_id);
