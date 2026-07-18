"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  KeyRound,
  Loader2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

const STORAGE_KEY = "pw_license_key";

type ValidateResponse = {
  valid: boolean;
  reason?: string;
  expiresAt?: string;
  remainingLabel?: string;
};

export default function AtivarPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [expiresLabel, setExpiresLabel] = useState("");
  const [remainingLabel, setRemainingLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setChecking(false);
      return;
    }

    fetch("/api/license/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: saved }),
    })
      .then((res) => res.json())
      .then((data: ValidateResponse) => {
        if (data.valid) {
          router.replace("/");
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleValidate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = (await res.json()) as ValidateResponse;

      if (!data.valid) {
        setError(data.reason || "Chave inválida ou expirada");
        setSubmitting(false);
        return;
      }

      localStorage.setItem(STORAGE_KEY, key.trim());
      setSuccess(true);
      setExpiresLabel(
        data.expiresAt
          ? new Date(data.expiresAt).toLocaleString("pt-BR")
          : ""
      );
      setRemainingLabel(data.remainingLabel || "01:00:00");

      setTimeout(() => router.replace("/"), 1200);
    } catch {
      setError("Não foi possível validar a chave. Tente novamente.");
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <main className="activate-screen">
        <div className="activate-card activate-card--loading">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p>Verificando sessão...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="activate-screen">
      <div className="activate-glow" aria-hidden />
      <div className="activate-grid" aria-hidden />

      <section className="activate-shell">
        <header className="activate-brand">
          <div className="activate-logo">
            <MapPin className="h-7 w-7" />
          </div>
          <div>
            <p className="activate-eyebrow">Prospecção WhatsApp</p>
            <h1>Validar chave de acesso</h1>
            <p className="activate-lead">
              Informe a chave do arquivo <strong>CHAVE-1HORA.txt</strong> para
              liberar o sistema por 1 hora.
            </p>
          </div>
        </header>

        <form className="activate-card" onSubmit={handleValidate}>
          <div className="activate-field">
            <label htmlFor="license-key">
              <KeyRound className="h-4 w-4" />
              Chave de ativação
            </label>
            <textarea
              id="license-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              rows={4}
              spellCheck={false}
              autoFocus
              placeholder="PW1H.eyJleHAiOi...assinatura"
              required
            />
          </div>

          <div className="activate-meta">
            <span>
              <Clock3 className="h-4 w-4" />
              Validade: 1 hora
            </span>
            <span>
              <ShieldCheck className="h-4 w-4" />
              Validação no servidor
            </span>
          </div>

          {error && (
            <div className="activate-alert activate-alert--error" role="alert">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="activate-alert activate-alert--ok" role="status">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Chave válida! Restante: {remainingLabel}
                {expiresLabel ? ` · expira em ${expiresLabel}` : ""}. Abrindo o
                sistema...
              </span>
            </div>
          )}

          <button
            type="submit"
            className="activate-submit"
            disabled={submitting || success || !key.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando chave...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Acesso liberado
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Validar e entrar
              </>
            )}
          </button>
        </form>

        <p className="activate-help">
          Sem chave? Gere uma nova com{" "}
          <code>npm run key:generate</code> ou pelo arquivo{" "}
          <code>GERAR-CHAVE-1HORA.bat</code>.
        </p>
      </section>
    </main>
  );
}
