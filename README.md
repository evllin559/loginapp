# LoginApp

Sistema de acesso por chave temporária com validade de **50 minutos**, empacotado como executável Windows (`.exe`) único — sem instalar Node.

## O que faz

- Gera chaves assinadas (`LOGIN-XXXX-...`) válidas por **50 minutos**
- Ativa o acesso ao colar a chave na tela de login
- Mostra contagem regressiva até o bloqueio automático
- Persiste a sessão localmente até expirar

## Executável Windows

```text
dist/LoginApp.exe
```

### Gerar o `.exe`

```bash
bash scripts/build-windows.sh
```

Requisitos: Go 1.22+.

## Como usar

1. Execute `LoginApp.exe`
2. O navegador abre a interface local
3. Cole a chave de acesso (50 minutos)
4. Quando o tempo zerar, o sistema bloqueia automaticamente

## Gerar chave no terminal

```bash
go run ./cmd/genkey
```

## Rodar em desenvolvimento

```bash
go run ./cmd/loginapp
```

## Segurança

```bat
set LOGINAPP_SECRET=seu-segredo-forte
LoginApp.exe
```

Sem essa variável, o app usa um segredo padrão apenas para demonstração.
