import { getViewer, isActiveMember } from "@/lib/viewer";
import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { DEMO_MESSAGE, fail, ok } from "@/lib/http";

// Salas de games: entrar e sair. Só membros ativos.
export async function POST(request: Request) {
  if (!hasSupabase()) return fail(DEMO_MESSAGE, 503);
  const viewer = await getViewer();
  if (!viewer) return fail("Entre com o Discord primeiro.", 401);
  if (!isActiveMember(viewer)) return fail("Só membros aprovados do clã entram nas salas.", 403);

  const body = await request.json().catch(() => null);
  const roomId = typeof body?.roomId === "string" ? body.roomId : "";
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
    default:
      return fail("Ação desconhecida.");
  }
}
