package session

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const keyPrefix = "session:"

type Store struct {
	rdb *redis.Client
	ttl time.Duration
}

func NewStore(rdb *redis.Client, ttl time.Duration) *Store {
	return &Store{rdb: rdb, ttl: ttl}
}

func (s *Store) Create(ctx context.Context, data *Data) (string, error) {
	sid := uuid.NewString()
	data.CreatedAt = time.Now().UnixMilli()

	raw, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("session marshal: %w", err)
	}

	if err := s.rdb.Set(ctx, keyPrefix+sid, raw, s.ttl).Err(); err != nil {
		return "", fmt.Errorf("session set: %w", err)
	}
	return sid, nil
}

func (s *Store) Get(ctx context.Context, sid string) (*Data, error) {
	raw, err := s.rdb.Get(ctx, keyPrefix+sid).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, nil
		}
		return nil, fmt.Errorf("session get: %w", err)
	}

	var data Data
	if err := json.Unmarshal(raw, &data); err != nil {
		return nil, fmt.Errorf("session unmarshal: %w", err)
	}
	return &data, nil
}

func (s *Store) Delete(ctx context.Context, sid string) error {
	return s.rdb.Del(ctx, keyPrefix+sid).Err()
}

func (s *Store) Touch(ctx context.Context, sid string) error {
	return s.rdb.Expire(ctx, keyPrefix+sid, s.ttl).Err()
}
