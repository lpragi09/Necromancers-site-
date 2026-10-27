import { getViewer, isActiveMember } from "@/lib/viewer";
import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { cleanText, DEMO_MESSAGE, fail, ok } from "@/lib/http";

const MAX_OPEN_PER_MEMBER = 3;
const MAX_DAYS_AHEAD = 30;

// Grupos de dungeon: criar, entrar, sair e cancelar. Só membros ativos.
export async function POST(request: Request) {
  if (!hasSupabase()) return fail(DEMO_MESSAGE, 503);
  const viewer = await getViewer();
  if (!viewer) return fail("Entre com o Discord primeiro.", 401);
  if (!isActiveMember(viewer)) return fail("Só membros aprovados do clã montam grupos de dungeon.", 403);

  const body = await request.json().catch(() => null);
  const db = supabaseAdmin;
  const me = viewer.member.id;
  const runId = typeof body?.runId === "string" ? body.runId : "";

  switch (body?.action) {
    case "create": {
      const slots = Math.floor(Number(body?.slots));
      if (slots < 1 || slots > 4) return fail("Escolha de 1 a 4 jogadores.");
      const startsAt = new Date(String(body?.startsAt ?? ""));
      if (Number.isNaN(startsAt.getTime())) return fail("Escolha o dia e a hora.");
      if (startsAt.getTime() < Date.now() - 5 * 60_000) return fail("O horário já passou.");
      if (startsAt.getTime() > Date.now() + MAX_DAYS_AHEAD * 86_400_000) return fail(`Marque para os próximos ${MAX_DAYS_AHEAD} dias.`);

      const [{ data: dungeon }, { count }] = await Promise.all([
        db.from("dungeons").select("id, name, active").eq("id", String(body?.dungeonId ?? "")).maybeSingle(),
        db.from("dungeon_runs").select("id", { count: "exact", head: true }).eq("creator_id", me).eq("status", "open").gte("starts_at", new Date().toISOString()),
      ]);
      if (!dungeon || !dungeon.active) return fail("Escolha uma dungeon da lista.");
      if ((count ?? 0) >= MAX_OPEN_PER_MEMBER) return fail(`Você já tem ${MAX_OPEN_PER_MEMBER} grupos marcados. Cancele um ou espere acontecer.`);

      const { data: run, error } = await db
        .from("dungeon_runs")
        .insert({ dungeon_id: dungeon.id, dungeon_name: dungeon.name, creator_id: me, slots, starts_at: startsAt.toISOString(), note: cleanText(body?.note, 120) || null })
        .select("id")
        .single();
      if (error || !run) return fail(error?.message ?? "Não foi possível criar o grupo.", 500);
      await db.from("dungeon_participants").insert({ run_id: run.id, member_id: me }); // quem cria já ocupa a 1ª vaga
      return ok({ id: run.id });
    }

    case "join": {
      const { data, error } = await db.rpc("dungeon_join", { p_run: runId, p_member: me });
      if (error) return fail(error.message, 500);
      if (data === "cheio") return fail("Esse grupo acabou de lotar.");
      if (data === "fechado") return fail("Esse grupo foi cancelado ou já aconteceu.");
      return ok();
    }

    case "leave": {
      const { data: run } = await db.from("dungeon_runs").select("creator_id").eq("id", runId).maybeSingle();
      if (!run) return fail("Grupo não encontrado.", 404);
      if (run.creator_id === me) return fail("Você criou esse grupo. Para sair, cancele o grupo.");
      await db.from("dungeon_participants").delete().eq("run_id", runId).eq("member_id", me);
      return ok();
    }

    case "cancel": {
      const { data: run } = await db.from("dungeon_runs").select("creator_id").eq("id", runId).maybeSingle();
      if (!run) return fail("Grupo não encontrado.", 404);
      if (run.creator_id !== me && !viewer.isAdmin) return fail("Só quem criou (ou a liderança) pode cancelar.", 403);
      const { error } = await db.from("dungeon_runs").update({ status: "cancelled" }).eq("id", runId);
      return error ? fail(error.message, 500) : ok();
    }

    default:
      return fail("Ação desconhecida.");
  }
}
