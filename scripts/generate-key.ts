/**
 * Gera uma chave de acesso Windows válida por 1 hora.
 * Uso: npx tsx scripts/generate-key.ts
 */
import fs from "fs";
import path from "path";
import { generateLicenseKey } from "../src/lib/license";

const license = generateLicenseKey(1);
const outDir = path.join(process.cwd(), "windows");
fs.mkdirSync(outDir, { recursive: true });

const keyFile = path.join(outDir, "CHAVE-1HORA.txt");
const content = [
  "============================================",
  "  PROSPECÇÃO WHATSAPP — CHAVE WINDOWS",
  "  Validade: 1 HORA a partir da geração",
  "============================================",
  "",
  `Gerada em : ${new Date().toLocaleString("pt-BR")}`,
  `Expira em : ${license.expiresAt.toLocaleString("pt-BR")}`,
  `Expira ISO: ${license.expiresAtIso}`,
  "",
  "CHAVE (copie e cole na tela de ativação):",
  "",
  license.key,
  "",
  "--------------------------------------------",
  "Instruções:",
  "1. Execute INICIAR.bat",
  "2. Abra http://localhost:3000",
  "3. Cole a chave acima na tela de ativação",
  "4. Após 1 hora a chave expira e o acesso é bloqueado",
  "============================================",
  "",
].join("\n");

fs.writeFileSync(keyFile, content, "utf8");
fs.writeFileSync(path.join(outDir, "license.key"), license.key + "\n", "utf8");

console.log("");
console.log("✓ Chave de 1 hora gerada!");
console.log("");
console.log("CHAVE:");
console.log(license.key);
console.log("");
console.log(`Expira em: ${license.expiresAt.toLocaleString("pt-BR")}`);
console.log(`Arquivo  : ${keyFile}`);
console.log("");
