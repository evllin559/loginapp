package license

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base32"
	"encoding/binary"
	"errors"
	"fmt"
	"strings"
	"time"
)

const (
	// Validity is how long a generated key remains usable.
	Validity = 50 * time.Minute
	// Prefix helps users recognize app keys.
	Prefix = "LOGIN"
)

var (
	ErrInvalidFormat = errors.New("formato de chave inválido")
	ErrBadSignature  = errors.New("chave inválida ou adulterada")
	ErrExpired       = errors.New("chave expirada")
	ErrNotYetValid   = errors.New("chave ainda não é válida")
)

// Manager creates and validates time-limited license keys.
type Manager struct {
	secret []byte
	now    func() time.Time
}

func New(secret string) *Manager {
	return &Manager{
		secret: []byte(secret),
		now:    time.Now,
	}
}

// Generate creates a key valid for Validity from now.
func (m *Manager) Generate() (key string, issuedAt, expiresAt time.Time, err error) {
	issuedAt = m.now().UTC().Truncate(time.Second)
	expiresAt = issuedAt.Add(Validity)

	payload := make([]byte, 8)
	binary.BigEndian.PutUint64(payload, uint64(issuedAt.Unix()))

	mac := hmac.New(sha256.New, m.secret)
	_, _ = mac.Write(payload)
	sig := mac.Sum(nil)[:10]

	raw := append(payload, sig...)
	encoded := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(raw)
	key = formatKey(encoded)
	return key, issuedAt, expiresAt, nil
}

// Info holds validation details for a key.
type Info struct {
	Key       string    `json:"key"`
	IssuedAt  time.Time `json:"issuedAt"`
	ExpiresAt time.Time `json:"expiresAt"`
	Remaining string    `json:"remaining"`
	Valid     bool      `json:"valid"`
}

// Validate checks signature and 50-minute window.
func (m *Manager) Validate(key string) (*Info, error) {
	normalized := strings.ToUpper(strings.ReplaceAll(strings.TrimSpace(key), "-", ""))
	normalized = strings.TrimPrefix(normalized, Prefix)

	raw, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(normalized)
	if err != nil || len(raw) != 18 {
		return nil, ErrInvalidFormat
	}

	payload := raw[:8]
	sig := raw[8:]

	mac := hmac.New(sha256.New, m.secret)
	_, _ = mac.Write(payload)
	expected := mac.Sum(nil)[:10]
	if !hmac.Equal(sig, expected) {
		return nil, ErrBadSignature
	}

	issuedUnix := int64(binary.BigEndian.Uint64(payload))
	issuedAt := time.Unix(issuedUnix, 0).UTC()
	expiresAt := issuedAt.Add(Validity)
	now := m.now().UTC()

	info := &Info{
		Key:       formatKey(normalized),
		IssuedAt:  issuedAt,
		ExpiresAt: expiresAt,
	}

	if now.Before(issuedAt) {
		return info, ErrNotYetValid
	}
	if !now.Before(expiresAt) {
		info.Remaining = "0s"
		return info, ErrExpired
	}

	info.Valid = true
	info.Remaining = formatDuration(expiresAt.Sub(now))
	return info, nil
}

func formatKey(encoded string) string {
	encoded = strings.ToUpper(strings.ReplaceAll(encoded, "-", ""))
	var parts []string
	parts = append(parts, Prefix)
	for i := 0; i < len(encoded); i += 4 {
		end := i + 4
		if end > len(encoded) {
			end = len(encoded)
		}
		parts = append(parts, encoded[i:end])
	}
	return strings.Join(parts, "-")
}

func formatDuration(d time.Duration) string {
	if d < 0 {
		d = 0
	}
	d = d.Round(time.Second)
	h := int(d.Hours())
	m := int(d.Minutes()) % 60
	s := int(d.Seconds()) % 60
	if h > 0 {
		return fmt.Sprintf("%dh %02dm %02ds", h, m, s)
	}
	return fmt.Sprintf("%02dm %02ds", m, s)
}
