"use client";

import { useEffect, useState } from "react";
import { KeyRound, Clock, ShieldAlert } from "lucide-react";

const STORAGE_KEY = "pw_license_key";

interface LicenseGateProps {
  children: React.ReactNode;
}

export default function LicenseGate({ children }: LicenseGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remainingLabel, setRemainingLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = async (licenseKey: string): Promise<boolean> => {
    const res = await fetch("/api/license/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: licenseKey }),
    });
    const data = await res.json();

    if (data.valid) {
      localStorage.setItem(STORAGE_KEY, licenseKey);
      setUnlocked(true);
      setExpiresAt(data.expiresAt);
      setRemainingLabel(data.remainingLabel);
      setError("");
      return true;
    }

    localStorage.removeItem(STORAGE_KEY);
    setUnlocked(false);
    setError(data.reason || "Chave inválida");
    return false;
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setChecking(false);
      return;
    }
    validate(saved).finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!unlocked || !expiresAt) return;

    const tick = () => {
      const rem = new Date(expiresAt).getTime() - Date.now();
      if (rem <= 0) {
        localStorage.removeItem(STORAGE_KEY);
        setUnlocked(false);
        setError("Chave expirada (válida por 1 hora)");
        setRemainingLabel("00:00:00");
        return;
      }
      const totalSec = Math.floor(rem / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setRemainingLabel(
        [h, m, s].map((n) => String(n).padStart(2, "0")).join(":")
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [unlocked, expiresAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    await validate(key.trim());
    setSubmitting(false);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Verificando chave de acesso...
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
        <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ativação Windows</h1>
              <p className="text-sm text-slate-400">Chave válida por 1 hora</p>
            </div>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-slate-300">
            Cole a chave gerada no arquivo{" "}
            <span className="font-mono text-emerald-400">CHAVE-1HORA.txt</span>{" "}
            para liberar o sistema nesta máquina.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-sm text-slate-400">Chave de acesso</label>
            <textarea
              value={key}
              onChange={(e) => setKey(e.target.value)}
              rows={3}
              placeholder="PW1H.xxxxx.yyyyy"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
              required
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-300">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !key.trim()}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {submitting ? "Validando..." : "Ativar por 1 hora"}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Após expirar, gere uma nova chave com: npm run key:generate
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full border border-emerald-700/40 bg-slate-900/90 px-3 py-1.5 text-xs text-emerald-300 shadow-lg backdrop-blur">
        <Clock className="h-3.5 w-3.5" />
        Trial: {remainingLabel}
      </div>
      {children}
    </>
  );
}

export function getStoredLicenseKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}
