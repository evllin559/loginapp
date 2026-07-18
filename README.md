# Prospecção WhatsApp

Sistema de prospecção de clientes com **geolocalização de empresas** e **envio de mensagens via WhatsApp**.

## Funcionalidades

- Cadastro de prospects (empresa, contato, endereço, telefone)
- Geocodificação automática de endereços (OpenStreetMap/Nominatim)
- Mapa interativo com marcadores das empresas
- Filtro por raio a partir da sua localização
- Pipeline de status (novo → contatado → interessado → negociando → fechado)
- Envio de mensagens via WhatsApp Business Cloud API
- Templates de mensagem (apresentação, follow-up, proposta)
- Modo manual: abrir conversa no WhatsApp Web/App
- Histórico de mensagens enviadas

## Requisitos

- Node.js 18+
- Conta WhatsApp Business (opcional, para envio automático)

## Instalação

```bash
npm install
npm run db:seed   # dados de exemplo (opcional)
npm run key:generate   # gera chave Windows de 1 hora
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e cole a chave da pasta `windows/CHAVE-1HORA.txt`.

## Windows (trial 1 hora)

1. Rode `windows\GERAR-CHAVE-1HORA.bat` — gera **uma chave** válida por **1 hora**
2. Rode `windows\INICIAR.bat` — inicia o sistema
3. Cole a chave na tela de ativação

Após 1 hora a chave expira e o acesso é bloqueado. Gere outra com o mesmo bat ou `npm run key:generate`.

## Configuração WhatsApp Business API

Crie um arquivo `.env` na raiz:

```env
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_ACCESS_TOKEN=seu_access_token
WHATSAPP_API_VERSION=v21.0
```

Obtenha as credenciais em [Meta for Developers](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started).

Sem essas variáveis, o sistema funciona em **modo manual** — use o botão "Abrir WA" para iniciar conversas.

## Estrutura

```
src/
├── app/
│   ├── api/
│   │   ├── prospects/      # CRUD de prospects
│   │   ├── whatsapp/send/  # Envio via API
│   │   └── messages/       # Histórico
│   └── page.tsx            # Dashboard principal
├── components/
│   └── ProspectMap.tsx     # Mapa Leaflet
└── lib/
    ├── db.ts               # SQLite
    ├── geocoding.ts        # Nominatim
    └── whatsapp.ts         # Integração Meta API
```

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/prospects` | Listar prospects |
| GET | `/api/prospects?lat=&lng=&radius=` | Prospects próximos |
| POST | `/api/prospects` | Criar prospect |
| PATCH | `/api/prospects` | Atualizar prospect |
| DELETE | `/api/prospects?id=` | Remover prospect |
| POST | `/api/whatsapp/send` | Enviar mensagem |
| GET | `/api/messages` | Histórico de envios |

## Licença

MIT
