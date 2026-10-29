import Link from "next/link";
import { ArrowRight, Gem, Gift, Mountain, Store, Swords, Trophy, type LucideIcon } from "lucide-react";
import Coin from "@/components/Coin";
import MyDrops from "@/components/MyDrops";
import InventoryGiveaways, { InventoryOrders, InventoryRuns } from "@/components/InventoryGiveaways";
import type { Inventory } from "@/lib/data";

function Box({ icon: Icon, title, href, link, children, className = "" }: { icon: LucideIcon; title: string; href: string; link: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`crypt-card p-5 sm:p-6 flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-title text-lg flex items-center gap-2"><Icon className="w-5 h-5 text-spirit" /> {title}</h2>
        <Link href={href} className="shrink-0 inline-flex items-center gap-1 text-[11px] font-black italic uppercase tracking-widest text-spirit hover:text-ecto">{link} <ArrowRight className="w-3.5 h-3.5" /></Link>
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

/** Tudo do membro num lugar só. Servidor: recebe os dados prontos de getInventory. */
export default function InventoryView({ inv }: { inv: Inventory }) {
  const activeEntries = inv.giveaways.filter((g) => !g.rejected && g.status !== "drawn").length;
  const wins = inv.giveaways.filter((g) => g.won).length;

  const stats: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; tone: string }[] = [
    {
      href: "/loja", icon: ({ className }) => <Coin className={`${className} scale-150`} />, label: "Evaldocoins", value: inv.coins.balance.toLocaleString("pt-BR"),
      sub: inv.coins.pending ? `+${inv.coins.pending} esperando aprovação` : "prontas para gastar", tone: "text-amber-300 border-amber-300/30 bg-amber-400/10",
    },
    {
      href: "/ranking", icon: Trophy, label: "Ranking de drops", value: inv.rank ? `${inv.rank.position}º` : "—",
      sub: inv.rank ? `${inv.rank.points.toLocaleString("pt-BR")} pts · ${inv.rank.total} no ranking` : inv.season ? "sem pontos ainda" : "nenhuma temporada aberta", tone: "text-spirit border-spirit/30 bg-spirit/10",
    },
    {
      href: "/torneios", icon: Swords, label: "Torneios", value: String(inv.tournament?.total ?? 0),
      sub: inv.tournament ? `idas em ${inv.tournament.month}` : "nenhum mês aberto", tone: "text-sky-300 border-sky-300/30 bg-sky-400/10",
    },
    {
      href: "/sorteios", icon: Gift, label: "Sorteios", value: String(activeEntries),
      sub: wins ? `inscrições ativas · ${wins} ${wins === 1 ? "vitória" : "vitórias"}` : "inscrições ativas", tone: "text-emerald-300 border-emerald-300/30 bg-emerald-400/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="crypt-card crypt-card-hover p-4 sm:p-5">
            <span className={`inline-flex w-10 h-10 rounded-xl items-center justify-center border ${s.tone}`}><s.icon className="w-5 h-5" /></span>
            <p className="mt-3 text-[10px] font-black italic uppercase tracking-widest text-bone/45">{s.label}</p>
            <p className="font-title text-3xl tabular-nums leading-tight">{s.value}</p>
            <p className="text-[11px] text-bone/45 leading-snug">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Box icon={Gift} title="Meus sorteios" href="/sorteios" link="Sorteios">
          <InventoryGiveaways list={inv.giveaways} />
        </Box>

        <Box icon={Store} title="Lojinha" href="/loja" link="Ir à loja">
          <div className="flex items-end gap-3">
            <Coin className="w-12 h-12 drop-shadow-[0_0_12px_rgba(251,191,36,0.55)]" />
            <span className="font-title text-5xl text-amber-200 tabular-nums leading-none">{inv.coins.balance.toLocaleString("pt-BR")}</span>
            <span className="pb-1 text-xs italic text-bone/45">Evaldocoins</span>
          </div>
          {inv.coins.pending > 0 && <p className="mt-2 text-xs italic text-amber-200/70">+{inv.coins.pending} Evaldocoins esperando a liderança aprovar.</p>}
          <p className="mt-5 label">Itens para receber</p>
          <InventoryOrders list={inv.coins.toReceive} />
        </Box>

        <Box icon={Swords} title={inv.tournament ? `Torneios · ${inv.tournament.month}` : "Torneios"} href="/torneios" link="Ranking">
          {inv.tournament ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                {inv.tournament.weeks.map((n, i) => (
                  <div key={i} className={`rounded-lg border px-2 py-3 text-center ${n ? "border-spirit/40 bg-spirit/10" : "border-white/5 bg-white/[0.02]"}`}>
                    <p className="text-[10px] font-black italic uppercase tracking-widest text-bone/45">Sem. {i + 1}</p>
                    <p className={`font-title text-2xl tabular-nums ${n ? "text-bone" : "text-bone/30"}`}>{n}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-bone/65">
                {inv.tournament.total
                  ? <>Você foi a <b className="text-bone">{inv.tournament.total}</b> {inv.tournament.total === 1 ? "torneio" : "torneios"} este mês{inv.tournament.position ? <> e está em <b className="text-spirit">{inv.tournament.position}º</b> de {inv.tournament.players}</> : null}. São <b className="text-bone">{inv.tournament.total}</b> {inv.tournament.total === 1 ? "chance" : "chances"} no sorteio do torneio.</>
                  : "Você ainda não foi a nenhum torneio este mês. Cada ida vale 1 chance no sorteio!"}
              </p>
            </>
          ) : <p className="text-sm italic text-bone/45">A liderança ainda não abriu um mês de torneios.</p>}
        </Box>

        <Box icon={Mountain} title="Minhas dungeons" href="/dungeons" link="Dungeons">
          <InventoryRuns list={inv.runs} />
        </Box>
      </div>

      <Box icon={Gem} title="Meus drops" href="/ranking" link="Ranking">
        {inv.rank && (
          <p className="mb-3 text-sm text-bone/65">
            Você está em <b className="text-spirit">{inv.rank.position}º</b> de {inv.rank.total} no ranking, com <b className="text-bone">{inv.rank.drops}</b> {inv.rank.drops === 1 ? "drop aprovado" : "drops aprovados"}.
          </p>
        )}
        <MyDrops drops={inv.drops} seasonName={inv.season?.name} />
      </Box>
    </div>
  );
}
