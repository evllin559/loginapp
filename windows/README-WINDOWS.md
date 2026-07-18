# Prospecção WhatsApp — Pacote Windows

## Executável (recomendado)

Gere no projeto:

```bash
npm run build:windows
```

Arquivos gerados em `dist/`:

| Arquivo | Função |
|---------|--------|
| `ProspeccaoWhatsApp-Windows.zip` | Pacote completo para Windows |
| `ProspeccaoWhatsApp.exe` | Atalho que inicia o sistema |
| `CHAVE-1HORA.txt` | Chave válida por **1 hora** |

### No Windows

1. Extraia o ZIP **inteiro**
2. Clique em `ProspeccaoWhatsApp.exe`
3. Cole a chave de `CHAVE-1HORA.txt`
4. Após 1 hora a chave expira

Não precisa instalar Node.js.

## Alternativa com Node instalado

1. `GERAR-CHAVE-1HORA.bat` — gera chave de 1 hora  
2. `INICIAR.bat` — sobe com `npm run dev`
