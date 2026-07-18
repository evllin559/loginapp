import { getProspect } from "@/lib/db";
import {
  fillTemplate,
  isWhatsAppConfigured,
  MESSAGE_TEMPLATES,
  sendProspectMessage,
} from "@/lib/whatsapp";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prospectId, mensagem, template } = body;

    if (!prospectId) {
      return NextResponse.json({ error: "prospectId obrigatório" }, { status: 400 });
    }

    const prospect = getProspect(prospectId);
    if (!prospect) {
      return NextResponse.json({ error: "Prospect não encontrado" }, { status: 404 });
    }

    let finalMessage = mensagem;

    if (template && template in MESSAGE_TEMPLATES) {
      finalMessage = fillTemplate(
        MESSAGE_TEMPLATES[template as keyof typeof MESSAGE_TEMPLATES],
        {
          nome: prospect.nome,
          empresa: prospect.empresa,
          cidade: prospect.cidade,
        }
      );
    }

    if (!finalMessage) {
      return NextResponse.json(
        { error: "Informe mensagem ou template válido" },
        { status: 400 }
      );
    }

    const result = await sendProspectMessage(
      prospect.id,
      prospect.telefone,
      finalMessage
    );

    return NextResponse.json({
      ...result,
      configured: isWhatsAppConfigured(),
      mensagem: finalMessage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao enviar" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    configured: isWhatsAppConfigured(),
    templates: Object.keys(MESSAGE_TEMPLATES),
  });
}
