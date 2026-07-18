# Prospecção WhatsApp — Pacote Windows

## Requisitos

- Windows 10/11
- [Node.js 18+](https://nodejs.org/) instalado

## Como usar

1. Clique duas vezes em **`GERAR-CHAVE-1HORA.bat`**  
   → gera **uma chave** válida por **1 hora**
2. Clique duas vezes em **`INICIAR.bat`**  
   → sobe o sistema e abre o navegador
3. Cole a chave da tela de ativação (arquivo `CHAVE-1HORA.txt`)
4. Após 1 hora a chave expira e o acesso é bloqueado

## Arquivos

| Arquivo | Função |
|---------|--------|
| `INICIAR.bat` | Inicia o sistema no Windows |
| `GERAR-CHAVE-1HORA.bat` | Gera uma chave de 1 hora |
| `CHAVE-1HORA.txt` | Contém a chave gerada |
| `license.key` | Só a chave (uma linha) |

## Observação

Cada execução de `GERAR-CHAVE-1HORA.bat` cria uma **nova** chave de 1 hora a partir do momento da geração.
