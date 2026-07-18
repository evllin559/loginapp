import {
  createProspect,
  deleteProspect,
  findProspectsNearby,
  listProspects,
  updateProspect,
  type ProspectStatus,
} from "@/lib/db";
import { geocodeAddress } from "@/lib/geocoding";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ProspectStatus | null;
  const cidade = searchParams.get("cidade");
  const segmento = searchParams.get("segmento");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius");

  if (lat && lng && radius) {
    const nearby = findProspectsNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius)
    );
    return NextResponse.json(nearby);
  }

  const prospects = listProspects({
    status: status || undefined,
    cidade: cidade || undefined,
    segmento: segmento || undefined,
  });

  return NextResponse.json(prospects);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome,
      empresa,
      telefone,
      email,
      endereco,
      cidade,
      estado,
      segmento,
      observacoes,
      geocode = true,
    } = body;

    if (!nome || !empresa || !telefone || !endereco || !cidade || !estado) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, empresa, telefone, endereco, cidade, estado" },
        { status: 400 }
      );
    }

    let latitude: number | null = body.latitude ?? null;
    let longitude: number | null = body.longitude ?? null;

    if (geocode && (latitude == null || longitude == null)) {
      const coords = await geocodeAddress(endereco, cidade, estado);
      if (coords) {
        latitude = coords.latitude;
        longitude = coords.longitude;
      }
    }

    const prospect = createProspect({
      nome,
      empresa,
      telefone,
      email: email || null,
      endereco,
      cidade,
      estado,
      latitude,
      longitude,
      segmento: segmento || null,
      status: "novo",
      observacoes: observacoes || null,
    });

    return NextResponse.json(prospect, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar prospect" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  const deleted = deleteProspect(parseInt(id, 10));
  if (!deleted) {
    return NextResponse.json({ error: "Prospect não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    if (data.geocode && data.endereco && data.cidade && data.estado) {
      const coords = await geocodeAddress(data.endereco, data.cidade, data.estado);
      if (coords) {
        data.latitude = coords.latitude;
        data.longitude = coords.longitude;
      }
      delete data.geocode;
    }

    const updated = updateProspect(id, data);
    if (!updated) {
      return NextResponse.json({ error: "Prospect não encontrado" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao atualizar" },
      { status: 500 }
    );
  }
}