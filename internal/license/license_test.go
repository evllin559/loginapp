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
	if !expires.Equal(issued.Add(50 * time.Minute)) {
		t.Fatalf("expected 50m validity, got %v -> %v", issued, expires)
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

	m.now = func() time.Time { return start.Add(50*time.Minute + time.Second) }
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
	// Inverte um caractere do meio da assinatura (após o prefixo LOGIN-)
	runes := []rune(key)
	mid := len(runes) / 2
	if runes[mid] == 'A' {
		runes[mid] = 'B'
	} else {
		runes[mid] = 'A'
	}
	tampered := string(runes)
	_, err = m.Validate(tampered)
	if err != ErrBadSignature && err != ErrInvalidFormat {
		t.Fatalf("expected bad signature/format, got %v", err)
	}
}
