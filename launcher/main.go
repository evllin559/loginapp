package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

func main() {
	exePath, err := os.Executable()
	if err != nil {
		fmt.Println("Erro ao localizar o executavel:", err)
		waitExit(1)
		return
	}
	baseDir := filepath.Dir(exePath)

	nodePath := filepath.Join(baseDir, "runtime", "node.exe")
	appDir := filepath.Join(baseDir, "app")
	serverJS := filepath.Join(appDir, "server.js")

	if _, err := os.Stat(nodePath); err != nil {
		fmt.Println("ERRO: runtime\\node.exe nao encontrado.")
		fmt.Println("Extraia o pacote completo antes de executar.")
		waitExit(1)
		return
	}
	if _, err := os.Stat(serverJS); err != nil {
		fmt.Println("ERRO: app\\server.js nao encontrado.")
		fmt.Println("Pacote incompleto.")
		waitExit(1)
		return
	}

	fmt.Println("============================================")
	fmt.Println("  Prospeccao WhatsApp")
	fmt.Println("  Trial Windows - chave de 1 hora")
	fmt.Println("============================================")
	fmt.Println()
	fmt.Println("Iniciando em http://localhost:3000 ...")
	fmt.Println("Use a chave em CHAVE-1HORA.txt na tela de ativacao.")
	fmt.Println("Pressione Ctrl+C para encerrar.")
	fmt.Println()

	cmd := exec.Command(nodePath, "server.js")
	cmd.Dir = appDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Env = append(os.Environ(),
		"PORT=3000",
		"HOSTNAME=127.0.0.1",
		"NODE_ENV=production",
	)

	if err := cmd.Start(); err != nil {
		fmt.Println("Falha ao iniciar o servidor:", err)
		waitExit(1)
		return
	}

	go func() {
		time.Sleep(2500 * time.Millisecond)
		_ = exec.Command("cmd", "/C", "start", "", "http://localhost:3000").Start()
	}()

	err = cmd.Wait()
	if err != nil {
		fmt.Println("Servidor encerrado:", err)
		waitExit(1)
		return
	}
}

func waitExit(code int) {
	fmt.Println()
	fmt.Println("Pressione ENTER para fechar...")
	fmt.Scanln()
	os.Exit(code)
}
