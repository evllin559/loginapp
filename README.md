# LoginApp

Sistema de acesso por chave temporária com validade de **1 hora**, empacotado como executável Windows (`.exe`).

## O que faz

- Gera chaves assinadas (`LOGIN-XXXX-...`) válidas por exatamente 60 minutos
- Ativa o acesso ao colar a chave
- Mostra contagem regressiva até o bloqueio automático
- Persiste a sessão localmente até expirar

## Executável Windows

O arquivo gerado fica em:

```text
dist/LoginApp.exe
```

### Gerar o `.exe` (neste repositório)

```bash
bash scripts/build-windows.sh
```

Requisitos: Go 1.22+.

No Windows, também é possível compilar assim:

```bat
set GOOS=windows
set GOARCH=amd64
set CGO_ENABLED=0
go build -ldflags="-s -w" -o dist\LoginApp.exe .\cmd\loginapp
```

## Como usar

1. Execute `LoginApp.exe`
2. O navegador abre a interface local
3. Em **Gerar chave (admin)**, clique em **Gerar agora**
4. Copie a chave e use em **Entrar com sua chave**
5. Após 1 hora (a partir da geração), a chave e a sessão expiram

## Rodar em modo desenvolvimento

```bash
go run ./cmd/loginapp
```

## Segurança

As chaves são assinadas com HMAC-SHA256. Em produção, defina um segredo próprio:

```bat
set LOGINAPP_SECRET=seu-segredo-forte
LoginApp.exe
```

Sem essa variável, o app usa um segredo padrão apenas para demonstração.
