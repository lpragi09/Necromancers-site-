// Regra dos torneios: 28 por semana e só entra no sorteio quem tiver pelo menos 30% de presença.
export const TOURNAMENTS_PER_WEEK = 28;
export const TOURNAMENT_WEEKS = 4;
export const MIN_PRESENCE_PERCENT = 30;
// 30% de 28 é 8,4: a liderança arredonda para 8 torneios na semana
export const MIN_WEEK_PRESENCES = Math.floor((TOURNAMENTS_PER_WEEK * MIN_PRESENCE_PERCENT) / 100);
export const inTournamentDraw = (count: number) => count >= MIN_WEEK_PRESENCES;

export type FrequencyPrize = { name: string; count: number; passedFrom: string | null };
type FrequencyScore = { week: number; player_name: string; count: number; updated_at: string };
const nameKey = (name: string) => name.trim().toLowerCase();

/**
 * Prêmio de frequência de cada semana: vai para quem mais foi, com o mínimo de presenças.
 * Quem ganhou na semana anterior passa o prêmio para o próximo da lista. Empate: quem chegou primeiro ao número.
 * prior é quem ganhou na semana anterior a este mês; last é quem ganhou na última semana (vale para o mês seguinte).
 */
export function monthFrequency(scores: FrequencyScore[], prior: string | null) {
  const prizes: Record<number, FrequencyPrize | null> = {};
  let previous = prior;
  for (let week = 1; week <= TOURNAMENT_WEEKS; week++) {
    const ranked = scores
      .filter((s) => s.week === week && inTournamentDraw(s.count))
      .sort((a, b) => b.count - a.count || a.updated_at.localeCompare(b.updated_at));
    const blocked = previous;
    const pick = ranked.find((s) => !blocked || nameKey(s.player_name) !== nameKey(blocked));
    const top = ranked[0];
    prizes[week] = pick ? { name: pick.player_name.trim(), count: pick.count, passedFrom: pick === top ? null : top.player_name.trim() } : null;
    previous = pick ? pick.player_name : null;
  }
  return { prizes, last: previous };
}
