"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock } from "lucide-react";

const STORAGE_KEY = "pw_license_key";

const PUBLIC_PATHS = ["/ativar"];

interface LicenseGateProps {
  children: React.ReactNode;
}

export default function LicenseGate({ children }: LicenseGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remainingLabel, setRemainingLabel] = useState("");

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname?.startsWith(`${p}/`)
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        if (!cancelled) {
          setUnlocked(false);
          setChecking(false);
          if (!isPublic) router.replace("/ativar");
        }
        return;
      }

      try {
        const res = await fetch("/api/license/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: saved }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (data.valid) {
          setUnlocked(true);
          setExpiresAt(data.expiresAt);
          setRemainingLabel(data.remainingLabel || "");
          if (isPublic) router.replace("/");
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setUnlocked(false);
          if (!isPublic) router.replace("/ativar");
        }
      } catch {
        if (!cancelled) {
          setUnlocked(false);
          if (!isPublic) router.replace("/ativar");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isPublic, pathname, router]);

  useEffect(() => {
    if (!unlocked || !expiresAt) return;

    const tick = () => {
      const rem = new Date(expiresAt).getTime() - Date.now();
      if (rem <= 0) {
        localStorage.removeItem(STORAGE_KEY);
        setUnlocked(false);
        setRemainingLabel("00:00:00");
        router.replace("/ativar");
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
  }, [unlocked, expiresAt, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (checking || !unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071410] text-emerald-100/80">
        Redirecionando para validação da chave...
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
