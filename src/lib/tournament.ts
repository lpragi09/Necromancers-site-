// Regra dos torneios: 28 por semana e só entra no sorteio quem tiver pelo menos 30% de presença.
export const TOURNAMENTS_PER_WEEK = 28;
export const TOURNAMENT_WEEKS = 4;
export const MIN_PRESENCE_PERCENT = 30;
// 30% de 28 é 8,4: a liderança arredonda para 8 torneios na semana
const MIN_PER_WEEK = Math.floor((TOURNAMENTS_PER_WEEK * MIN_PRESENCE_PERCENT) / 100);

/** Quantos torneios existem no período (uma semana ou o mês todo). */
export const tournamentsIn = (week: number | null) => (week ? TOURNAMENTS_PER_WEEK : TOURNAMENTS_PER_WEEK * TOURNAMENT_WEEKS);
/** Presenças mínimas: 8 na semana e 32 no mês (8 em cada semana). */
export const minPresences = (week: number | null) => (week ? MIN_PER_WEEK : MIN_PER_WEEK * TOURNAMENT_WEEKS);
export const inTournamentDraw = (count: number, week: number | null) => count >= minPresences(week);
