package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sync"
	"time"

	"github.com/evllin559/loginapp/internal/license"
	"github.com/evllin559/loginapp/web"
)

const defaultSecret = "loginapp-troque-este-segredo-em-producao"

type session struct {
	Key       string    `json:"key"`
	IssuedAt  time.Time `json:"issuedAt"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type server struct {
	mgr      *license.Manager
	mu       sync.Mutex
	session  *session
	storePath string
}

func main() {
	secret := os.Getenv("LOGINAPP_SECRET")
	if secret == "" {
		secret = defaultSecret
	}

	s := &server{
		mgr:       license.New(secret),
		storePath: sessionPath(),
	}
	s.loadSession()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/status", s.handleStatus)
	mux.HandleFunc("/api/login", s.handleLogin)
	mux.HandleFunc("/api/logout", s.handleLogout)
	mux.HandleFunc("/api/generate", s.handleGenerate)

	static, err := fs.Sub(web.Files, ".")
	if err != nil {
		log.Fatalf("embed: %v", err)
	}
	mux.Handle("/", http.FileServer(http.FS(static)))

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatalf("listen: %v", err)
	}
	addr := listener.Addr().String()
	url := "http://" + addr + "/"

	fmt.Println("LoginApp iniciado")
	fmt.Println("Chaves válidas por 1 hora")
	fmt.Println("Abra no navegador:", url)
	fmt.Println("Pressione Ctrl+C para encerrar")

	go openBrowser(url)

	if err := http.Serve(listener, mux); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}

func (s *server) handleStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked()
	if s.session == nil {
		writeJSON(w, http.StatusOK, map[string]any{"active": false})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"active":  true,
		"session": s.session,
	})
}

func (s *server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		Key string `json:"key"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}

	info, err := s.mgr.Validate(body.Key)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": humanError(err)})
		return
	}

	sess := &session{
		Key:       info.Key,
		IssuedAt:  info.IssuedAt,
		ExpiresAt: info.ExpiresAt,
	}

	s.mu.Lock()
	s.session = sess
	_ = s.saveSessionLocked()
	s.mu.Unlock()

	writeJSON(w, http.StatusOK, map[string]any{"session": sess})
}

func (s *server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	s.mu.Lock()
	s.session = nil
	_ = os.Remove(s.storePath)
	s.mu.Unlock()
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *server) handleGenerate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	key, issued, expires, err := s.mgr.Generate()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "falha ao gerar chave"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"key":       key,
		"issuedAt":  issued,
		"expiresAt": expires,
		"validity":  "1h",
	})
}

func (s *server) pruneLocked() {
	if s.session == nil {
		return
	}
	if time.Now().UTC().Before(s.session.ExpiresAt) {
		return
	}
	s.session = nil
	_ = os.Remove(s.storePath)
}

func (s *server) loadSession() {
	data, err := os.ReadFile(s.storePath)
	if err != nil {
		return
	}
	var sess session
	if err := json.Unmarshal(data, &sess); err != nil {
		return
	}
	if _, err := s.mgr.Validate(sess.Key); err != nil {
		_ = os.Remove(s.storePath)
		return
	}
	s.session = &sess
}

func (s *server) saveSessionLocked() error {
	if err := os.MkdirAll(filepath.Dir(s.storePath), 0o755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(s.session, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.storePath, data, 0o600)
}

func sessionPath() string {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir = "."
	}
	return filepath.Join(dir, "LoginApp", "session.json")
}

func humanError(err error) string {
	switch {
	case errors.Is(err, license.ErrExpired):
		return "Esta chave já expirou (validade de 1 hora)."
	case errors.Is(err, license.ErrBadSignature):
		return "Chave inválida."
	case errors.Is(err, license.ErrInvalidFormat):
		return "Formato de chave inválido."
	case errors.Is(err, license.ErrNotYetValid):
		return "Esta chave ainda não é válida."
	default:
		return "Não foi possível validar a chave."
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	_ = cmd.Start()
}
