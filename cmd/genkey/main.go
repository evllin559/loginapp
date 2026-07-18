package main

import (
	"fmt"
	"os"
	"time"

	"github.com/evllin559/loginapp/internal/license"
)

const defaultSecret = "loginapp-troque-este-segredo-em-producao"

func main() {
	secret := os.Getenv("LOGINAPP_SECRET")
	if secret == "" {
		secret = defaultSecret
	}

	mgr := license.New(secret)
	key, issued, expires, err := mgr.Generate()
	if err != nil {
		fmt.Fprintf(os.Stderr, "erro ao gerar chave: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("============================================")
	fmt.Println("  LOGINAPP — CHAVE DE 50 MINUTOS")
	fmt.Println("============================================")
	fmt.Println()
	fmt.Printf("Gerada em : %s\n", issued.Local().Format("02/01/2006, 15:04:05"))
	fmt.Printf("Expira em : %s\n", expires.Local().Format("02/01/2006, 15:04:05"))
	fmt.Printf("Expira ISO: %s\n", expires.UTC().Format(time.RFC3339))
	fmt.Println()
	fmt.Println("CHAVE:")
	fmt.Println()
	fmt.Println(key)
	fmt.Println()
	fmt.Println("Validade: 50 minutos a partir da geração")
	fmt.Println("============================================")
}
