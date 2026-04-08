FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# --- Runtime ---
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app

COPY --from=builder /server .
COPY --from=builder /app/migrations ./migrations

RUN mkdir -p /app/storage/uploads

EXPOSE 8080

CMD ["./server"]
