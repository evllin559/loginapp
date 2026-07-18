"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

const DISMISS_KEY = "pw_ios_install_hint_dismissed";

export default function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua) ||
      // iPadOS 13+ se identifica como Mac com touch
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error propriedade específica do iOS
      window.navigator.standalone === true;

    if (isIOS && isSafari && !isStandalone) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-2xl border border-emerald-700/40 bg-slate-900/95 p-4 text-sm text-emerald-50 shadow-2xl backdrop-blur">
      <button
        onClick={dismiss}
        aria-label="Fechar"
        className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="font-semibold">Instalar no iPad</p>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-emerald-100/80">
        Toque em <Share className="inline h-4 w-4" /> <strong>Compartilhar</strong> e depois em
        <strong>&quot;Adicionar à Tela de Início&quot;</strong> para usar como app.
      </p>
    </div>
  );
}
