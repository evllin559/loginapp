import { formatPhoneBR } from "./geocoding";
import { createMessageLog, updateProspect } from "./db";

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion?: string;
}

function getConfig(): WhatsAppConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) return null;

  return {
    phoneNumberId,
    accessToken,
    apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
  };
}

export function isWhatsAppConfigured(): boolean {
  return getConfig() !== null;
}

export async function sendWhatsAppText(
  to: string,
  message: string
): Promise<WhatsAppSendResult> {
  const config = getConfig();

  if (!config) {
    return {
      success: false,
      error:
        "WhatsApp não configurado. Defina WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN no .env",
    };
  }

  const phone = formatPhoneBR(to);
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    });

    const data = (await response.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message: string };
    };

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `Erro HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
}

export async function sendProspectMessage(
  prospectId: number,
  telefone: string,
  mensagem: string
): Promise<WhatsAppSendResult & { logId?: number }> {
  const result = await sendWhatsAppText(telefone, mensagem);

  const log = createMessageLog({
    prospect_id: prospectId,
    mensagem,
    status: result.success ? "enviado" : "erro",
    whatsapp_message_id: result.messageId ?? null,
    erro: result.error ?? null,
  });

  if (result.success) {
    updateProspect(prospectId, { status: "contatado" });
  }

  return { ...result, logId: log.id };
}

export const MESSAGE_TEMPLATES = {
  apresentacao: `Olá! Tudo bem? 👋

Sou da [SUA EMPRESA] e vi que a {empresa} atua em {cidade}.

Gostaria de apresentar nossos serviços e entender se faz sentido conversarmos.

Posso te enviar mais detalhes?`,

  followup: `Oi {nome}! Passando para saber se você teve chance de ver minha mensagem anterior.

Fico à disposição para qualquer dúvida!`,

  proposta: `Olá {nome}! Conforme conversamos, preparei uma proposta personalizada para a {empresa}.

Quando seria um bom momento para apresentarmos?`,
};

export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, "g"), value),
    template
  );
}
