const panelLocked = document.getElementById("panel-locked");
const panelActive = document.getElementById("panel-active");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const keyInput = document.getElementById("key-input");
const countdownEl = document.getElementById("countdown");
const activeKey = document.getElementById("active-key");
const activeExpires = document.getElementById("active-expires");
const logoutBtn = document.getElementById("logout-btn");
const generateBtn = document.getElementById("generate-btn");
const generatedBox = document.getElementById("generated");
const generatedKey = document.getElementById("generated-key");
const generatedMeta = document.getElementById("generated-meta");
const copyBtn = document.getElementById("copy-btn");

let tickTimer = null;
let expiresAtMs = null;

function showError(message) {
  loginError.hidden = !message;
  loginError.textContent = message || "";
}

function formatCountdown(ms) {
  if (ms <= 0) return "00m 00s";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }
  return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function setActive(session) {
  panelLocked.hidden = true;
  panelActive.hidden = false;
  activeKey.textContent = session.key;
  activeExpires.textContent = new Date(session.expiresAt).toLocaleString("pt-BR");
  expiresAtMs = new Date(session.expiresAt).getTime();
  startTicker();
}

function setLocked() {
  panelLocked.hidden = false;
  panelActive.hidden = true;
  expiresAtMs = null;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

function startTicker() {
  if (tickTimer) clearInterval(tickTimer);
  const update = async () => {
    const remaining = expiresAtMs - Date.now();
    countdownEl.textContent = formatCountdown(remaining);
    if (remaining <= 0) {
      clearInterval(tickTimer);
      tickTimer = null;
      await fetch("/api/logout", { method: "POST" });
      setLocked();
      showError("A chave expirou. Gere ou use outra chave válida por 1 hora.");
    }
  };
  update();
  tickTimer = setInterval(update, 1000);
}

async function refreshStatus() {
  const res = await fetch("/api/status");
  const data = await res.json();
  if (data.active && data.session) {
    setActive(data.session);
  } else {
    setLocked();
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");
  const key = keyInput.value.trim();
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  const data = await res.json();
  if (!res.ok) {
    showError(data.error || "Não foi possível ativar a chave.");
    return;
  }
  keyInput.value = "";
  setActive(data.session);
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  setLocked();
});

generateBtn.addEventListener("click", async () => {
  const res = await fetch("/api/generate", { method: "POST" });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Falha ao gerar chave");
    return;
  }
  generatedBox.hidden = false;
  generatedKey.textContent = data.key;
  generatedMeta.textContent = `Válida de ${new Date(data.issuedAt).toLocaleString("pt-BR")} até ${new Date(data.expiresAt).toLocaleString("pt-BR")}`;
});

copyBtn.addEventListener("click", async () => {
  const text = generatedKey.textContent;
  if (!text) return;
  await navigator.clipboard.writeText(text);
  copyBtn.textContent = "Copiado!";
  setTimeout(() => {
    copyBtn.textContent = "Copiar";
  }, 1200);
});

refreshStatus();
