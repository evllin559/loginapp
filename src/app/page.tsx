"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Building2,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import type { Prospect, ProspectStatus } from "@/lib/db";

const ProspectMap = dynamic(() => import("@/components/ProspectMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-slate-100 text-slate-500">
      Carregando mapa...
    </div>
  ),
});

const STATUS_LABELS: Record<ProspectStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  interessado: "Interessado",
  negociando: "Negociando",
  fechado: "Fechado",
  descartado: "Descartado",
};

const STATUS_COLORS: Record<ProspectStatus, string> = {
  novo: "bg-blue-100 text-blue-800",
  contatado: "bg-yellow-100 text-yellow-800",
  interessado: "bg-purple-100 text-purple-800",
  negociando: "bg-orange-100 text-orange-800",
  fechado: "bg-green-100 text-green-800",
  descartado: "bg-slate-100 text-slate-600",
};

const EMPTY_FORM = {
  nome: "",
  empresa: "",
  telefone: "",
  email: "",
  endereco: "",
  cidade: "",
  estado: "",
  segmento: "",
  observacoes: "",
};

export default function HomePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState("apresentacao");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const loadProspects = async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/prospects?${params}`);
    const data = await res.json();
    setProspects(data);
    setLoading(false);
  };

  const checkWhatsApp = async () => {
    const res = await fetch("/api/whatsapp/send");
    const data = await res.json();
    setWhatsappConfigured(data.configured);
  };

  useEffect(() => {
    loadProspects();
    checkWhatsApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const filtered = prospects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.nome.toLowerCase().includes(q) ||
      p.empresa.toLowerCase().includes(q) ||
      p.cidade.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, geocode: true }),
    });

    if (res.ok) {
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadProspects();
      showToast("success", "Prospect cadastrado com sucesso!");
    } else {
      const err = await res.json();
      showToast("error", err.error || "Erro ao cadastrar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este prospect?")) return;
    await fetch(`/api/prospects?id=${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    loadProspects();
    showToast("success", "Prospect removido");
  };

  const handleStatusChange = async (id: number, status: ProspectStatus) => {
    await fetch("/api/prospects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadProspects();
    if (selected?.id === id) {
      setSelected((s) => (s ? { ...s, status } : null));
    }
  };

  const handleSendWhatsApp = async () => {
    if (!selected) return;
    setSending(true);
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prospectId: selected.id,
        mensagem: message || undefined,
        template: message ? undefined : template,
      }),
    });
    const data = await res.json();
    setSending(false);

    if (data.success) {
      showToast("success", "Mensagem enviada via WhatsApp!");
      setShowWhatsApp(false);
      setMessage("");
      loadProspects();
    } else {
      showToast("error", data.error || "Falha ao enviar");
    }
  };

  const openWhatsAppLink = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    const formatted = digits.startsWith("55") ? digits : `55${digits}`;
    window.open(`https://wa.me/${formatted}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Prospecção WhatsApp</h1>
              <p className="text-xs text-slate-500">
                Encontre clientes por geolocalização e envie mensagens
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                whatsappConfigured
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              WhatsApp API: {whatsappConfigured ? "Conectado" : "Modo manual"}
            </span>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Novo Prospect
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-4 md:grid-cols-4">
        {[
          { label: "Total", value: prospects.length, icon: Users },
          {
            label: "Novos",
            value: prospects.filter((p) => p.status === "novo").length,
            icon: Building2,
          },
          {
            label: "Contatados",
            value: prospects.filter((p) => p.status === "contatado").length,
            icon: MessageCircle,
          },
          {
            label: "No mapa",
            value: prospects.filter((p) => p.latitude && p.longitude).length,
            icon: MapPin,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <Icon className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <main className="mx-auto grid max-w-7xl gap-4 px-4 pb-8 lg:grid-cols-5">
        {/* List */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, empresa ou cidade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Todos os status</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-[520px] overflow-y-auto">
              {loading ? (
                <p className="p-4 text-center text-sm text-slate-500">Carregando...</p>
              ) : filtered.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">
                  Nenhum prospect encontrado. Cadastre o primeiro!
                </p>
              ) : (
                filtered.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`cursor-pointer border-b border-slate-50 p-4 transition hover:bg-slate-50 ${
                      selected?.id === p.id ? "bg-brand-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{p.empresa}</p>
                        <p className="text-sm text-slate-600">{p.nome}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {p.cidade}, {p.estado}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status]}`}
                      >
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Map + Detail */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="h-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <ProspectMap
              prospects={filtered}
              selected={selected}
              onSelect={setSelected}
              userLocation={userLocation}
              radiusKm={radiusKm}
            />
          </div>

          {userLocation && (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2">
              <span className="text-sm text-slate-600">Raio de prospecção:</span>
              <input
                type="range"
                min={1}
                max={50}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-slate-900">{radiusKm} km</span>
            </div>
          )}

          {selected && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selected.empresa}</h2>
                  <p className="text-slate-600">{selected.nome}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowWhatsApp(true)}
                    className="flex items-center gap-1 rounded-lg bg-whatsapp px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                    Enviar
                  </button>
                  <button
                    onClick={() => openWhatsAppLink(selected.telefone)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    Abrir WA
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="rounded-lg border border-red-200 px-2 py-1.5 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <p>
                  <span className="text-slate-500">Telefone:</span> {selected.telefone}
                </p>
                {selected.email && (
                  <p>
                    <span className="text-slate-500">Email:</span> {selected.email}
                  </p>
                )}
                <p className="md:col-span-2">
                  <span className="text-slate-500">Endereço:</span> {selected.endereco},{" "}
                  {selected.cidade} - {selected.estado}
                </p>
                {selected.segmento && (
                  <p>
                    <span className="text-slate-500">Segmento:</span> {selected.segmento}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <label className="text-sm text-slate-500">Status</label>
                <select
                  value={selected.status}
                  onChange={(e) =>
                    handleStatusChange(selected.id, e.target.value as ProspectStatus)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Novo Prospect</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {[
                { key: "nome", label: "Nome do contato", required: true },
                { key: "empresa", label: "Empresa", required: true },
                { key: "telefone", label: "Telefone (WhatsApp)", required: true },
                { key: "email", label: "Email", required: false },
                { key: "endereco", label: "Endereço", required: true },
                { key: "cidade", label: "Cidade", required: true },
                { key: "estado", label: "Estado (UF)", required: true },
                { key: "segmento", label: "Segmento", required: false },
              ].map(({ key, label, required }) => (
                <div key={key}>
                  <label className="text-sm text-slate-600">{label}</label>
                  <input
                    required={required}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="text-sm text-slate-600">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsApp && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Enviar via WhatsApp</h2>
            <p className="mt-1 text-sm text-slate-500">
              Para: {selected.nome} — {selected.telefone}
            </p>

            {!whatsappConfigured && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                API não configurada. Use &quot;Abrir WA&quot; para envio manual, ou configure as
                variáveis de ambiente.
              </div>
            )}

            <div className="mt-4">
              <label className="text-sm text-slate-600">Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="apresentacao">Apresentação</option>
                <option value="followup">Follow-up</option>
                <option value="proposta">Proposta</option>
              </select>
            </div>

            <div className="mt-3">
              <label className="text-sm text-slate-600">
                Mensagem personalizada (opcional — sobrescreve template)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Deixe vazio para usar o template selecionado..."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowWhatsApp(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendWhatsApp}
                disabled={sending || !whatsappConfigured}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-whatsapp py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
