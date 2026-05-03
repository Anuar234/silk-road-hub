-- ТЗ §5.3 — protected buyer↔seller messaging. Threads are scoped by
-- (buyer, seller, product); a buyer/seller pair can have one thread per product
-- and one product-less thread.

CREATE TABLE message_threads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    -- Mirrors deal_documents.deal_id pattern (see 000015): kept as VARCHAR so
    -- the pilot UI can attach threads to mock-seeded deals as well as real
    -- DB-backed deals. Etap 2 promotes this to a real FK.
    related_deal_id VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_threads_buyer ON message_threads(buyer_id, updated_at DESC);
CREATE INDEX idx_message_threads_seller ON message_threads(seller_id, updated_at DESC);

-- Two partial unique indexes implement the "one thread per pair+product, one
-- product-less thread per pair" rule that NULL semantics in a single UNIQUE
-- constraint cannot express.
CREATE UNIQUE INDEX idx_message_threads_unique_with_product
    ON message_threads(buyer_id, seller_id, product_id)
    WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX idx_message_threads_unique_no_product
    ON message_threads(buyer_id, seller_id)
    WHERE product_id IS NULL;

CREATE TABLE messages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id         UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    -- NULL for system messages (e.g. deal creation notices). Validated by the
    -- service layer; no FK on sender_role to avoid extra enum churn.
    sender_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_role       VARCHAR(16) NOT NULL,
    body              TEXT NOT NULL,
    is_system_message BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Read receipts: one row per (thread, user). Message is "read by user" when
-- last_read_at >= message.created_at.
CREATE TABLE thread_reads (
    thread_id     UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (thread_id, user_id)
);
