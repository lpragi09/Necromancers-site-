// IDs do Discord com acesso fixo ao painel admin (variável ADMIN_DISCORD_IDS, separados por vírgula).
// Além deles, quem estiver ativo no site como líder ou vice também é admin (ver lib/viewer.ts).
const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const ADMIN_ROLES = ["lider", "vice"];

export function isAdminId(discordId: string | null | undefined): boolean {
  return !!discordId && ADMIN_IDS.includes(discordId);
}
