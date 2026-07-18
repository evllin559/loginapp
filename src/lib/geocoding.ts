export interface GeocodeResult {
  latitude: number;
  longitude: number;
  display_name: string;
}

export async function geocodeAddress(
  endereco: string,
  cidade: string,
  estado: string
): Promise<GeocodeResult | null> {
  const query = `${endereco}, ${cidade}, ${estado}, Brasil`;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "ProspeccaoWhatsApp/1.0 (contato@prospeccao.local)",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    if (!data.length) return null;

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      display_name: data[0].display_name,
    };
  } catch {
    return null;
  }
}

export function formatPhoneBR(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  if (digits.length === 11 || digits.length === 10) return `55${digits}`;
  return digits;
}

export function normalizePhoneDisplay(phone: string): string {
  const digits = formatPhoneBR(phone);
  if (digits.length >= 12) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (rest.length === 9) {
      return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    }
    return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return phone;
}
