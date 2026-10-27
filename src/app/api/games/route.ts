import { getViewer, isActiveMember } from "@/lib/viewer";
import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { DEMO_MESSAGE, fail, ok } from "@/lib/http";

// Salas de games: entrar e sair da sala, entrar e sair do banco, e aleatorizar o banco (liderança).
export async function POST(request: Request) {
  if (!hasSupabase()) return fail(DEMO_MESSAGE, 503);
  const viewer = await getViewer();
  if (!viewer) return fail("Entre com o Discord primeiro.", 401);
  if (!isActiveMember(viewer)) return fail("Só membros aprovados do clã entram nas salas.", 403);

  const body = await request.json().catch(() => null);
  const roomId = typeof body?.roomId === "string" ? body.roomId : "";
  const modeId = typeof body?.modeId === "string" ? body.modeId : "";
  const me = viewer.member.id;

  switch (body?.action) {
    case "join": {
      const { data, error } = await supabaseAdmin.rpc("game_join", { p_room: roomId, p_member: me });
      if (error) return fail(error.message, 500);
      if (data === "cheio") return fail("Essa sala acabou de lotar.");
      if (data === "fechado") return fail("Essa sala está fechada no momento.");
      return ok();
    }
    case "leave": {
      const { error } = await supabaseAdmin.from("game_room_players").delete().eq("room_id", roomId).eq("member_id", me);
      return error ? fail(error.message, 500) : ok();
    }
    case "bench": {
      // No banco a pessoa sai de qualquer sala e de qualquer outro banco
      const { data: mode } = await supabaseAdmin.from("game_modes").select("id, active").eq("id", modeId).maybeSingle();
      if (!mode?.active) return fail("Esse jogo está fechado no momento.");
      await Promise.all([
        supabaseAdmin.from("game_room_players").delete().eq("member_id", me),
        supabaseAdmin.from("game_bench").delete().eq("member_id", me),
      ]);
      const { error } = await supabaseAdmin.from("game_bench").insert({ mode_id: modeId, member_id: me });
      return error ? fail(error.message, 500) : ok();
    }
    case "unbench": {
      const { error } = await supabaseAdmin.from("game_bench").delete().eq("mode_id", modeId).eq("member_id", me);
      return error ? fail(error.message, 500) : ok();
    }
    case "shuffle": {
      if (!viewer.isAdmin) return fail("Só a liderança aleatoriza o banco.", 403);
      const { data, error } = await supabaseAdmin.rpc("game_shuffle", { p_mode: modeId });
      if (error) return fail(error.message, 500);
      return ok({ placed: Number(data ?? 0) });
    }
    default:
      return fail("Ação desconhecida.");
  }
}
