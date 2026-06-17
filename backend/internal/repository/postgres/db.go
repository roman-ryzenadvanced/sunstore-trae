// Package postgres is the concrete persistence layer of the hexagonal backend.
// db.go wires the pgxpool connection, applies pool-level settings, and exposes
// a thin DBTX interface that satisfies both *pgxpool.Pool and *pgx.Tx so
// repository methods can be reused inside transactions without code changes.
package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"sunstore/internal/config"
)

// DBTX is the minimal subset of methods repositories need from a pgx connection
// or transaction. Both *pgxpool.Pool and pgx.Tx satisfy it.
type DBTX interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

// ErrNotFound is returned when a query yields no rows.
var ErrNotFound = errors.New("not found")

// DB wraps the pgx connection pool and offers a Close() method.
type DB struct {
	Pool *pgxpool.Pool
}

// New opens a pgxpool to PostgreSQL using the supplied configuration. It
// performs an initial Ping with a bounded timeout so misconfiguration is
// surfaced at startup, not on the first request.
func New(ctx context.Context, cfg config.PostgresConfig) (*DB, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.DSN())
	if err != nil {
		return nil, fmt.Errorf("postgres: parse DSN: %w", err)
	}

	poolCfg.MaxConns = int32(cfg.MaxOpenConns)
	poolCfg.MinConns = int32(minInt(cfg.MaxIdleConns, cfg.MaxOpenConns))
	poolCfg.MaxConnLifetime = cfg.ConnMaxLifetime
	poolCfg.MaxConnIdleTime = cfg.ConnMaxLifetime / 2
	poolCfg.HealthCheckPeriod = 1 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("postgres: new pool: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("postgres: initial ping: %w", err)
	}

	return &DB{Pool: pool}, nil
}

// Close releases all pooled connections. Safe to call multiple times.
func (d *DB) Close() {
	if d == nil || d.Pool == nil {
		return
	}
	d.Pool.Close()
}

// Ping verifies that the pool can hand out a healthy connection.
func (d *DB) Ping(ctx context.Context) error {
	if d == nil || d.Pool == nil {
		return fmt.Errorf("postgres: nil pool")
	}
	return d.Pool.Ping(ctx)
}

// WithTx runs fn inside a serializable transaction. If fn returns an error
// or panics, the transaction is rolled back; otherwise it is committed.
func (d *DB) WithTx(ctx context.Context, fn func(pgx.Tx) error) error {
	tx, err := d.Pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	if err != nil {
		return fmt.Errorf("postgres: begin tx: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback(ctx)
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil && rbErr != pgx.ErrTxClosed {
			return fmt.Errorf("postgres: rollback after error %v: %w", err, rbErr)
		}
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("postgres: commit tx: %w", err)
	}
	return nil
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}
