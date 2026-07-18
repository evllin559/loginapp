package license

import (
	"strings"
	"testing"
	"time"
)

func TestGenerateAndValidate(t *testing.T) {
	fixed := time.Date(2026, 7, 18, 12, 0, 0, 0, time.UTC)
	m := New("segredo-teste")
	m.now = func() time.Time { return fixed }

	key, issued, expires, err := m.Generate()
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	if !strings.HasPrefix(key, "LOGIN-") {
		t.Fatalf("unexpected key prefix: %s", key)
	}
	if !expires.Equal(issued.Add(time.Hour)) {
		t.Fatalf("expected 1h validity, got %v -> %v", issued, expires)
	}

	info, err := m.Validate(key)
	if err != nil {
		t.Fatalf("validate: %v", err)
	}
	if !info.Valid {
		t.Fatal("expected valid key")
	}
}

func TestExpiredKey(t *testing.T) {
	start := time.Date(2026, 7, 18, 12, 0, 0, 0, time.UTC)
	m := New("segredo-teste")
	m.now = func() time.Time { return start }

	key, _, _, err := m.Generate()
	if err != nil {
		t.Fatalf("generate: %v", err)
	}

	m.now = func() time.Time { return start.Add(time.Hour + time.Second) }
	_, err = m.Validate(key)
	if err != ErrExpired {
		t.Fatalf("expected ErrExpired, got %v", err)
	}
}

func TestTamperedKey(t *testing.T) {
	m := New("segredo-teste")
	key, _, _, err := m.Generate()
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	tampered := key[:len(key)-1] + "Z"
	_, err = m.Validate(tampered)
	if err != ErrBadSignature && err != ErrInvalidFormat {
		t.Fatalf("expected bad signature/format, got %v", err)
	}
}
