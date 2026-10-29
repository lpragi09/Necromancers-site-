/* eslint-disable @next/next/no-img-element */
import { Package, Send, Sparkles, Store } from "lucide-react";
import Coin from "@/components/Coin";
import MembersGate from "@/components/MembersGate";
import GhostIcon from "@/components/GhostIcon";
import { BuyButton, ClaimForm, ShopHistory } from "@/components/Shop";
import { Empty, PageHeader, SectionTitle } from "@/components/ui";
import PageNav, { pageFrom, slicePage } from "@/components/PageNav";
import { getShop } from "@/lib/data";
import { canSeeContent, getViewer, isActiveMember } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lojinha" };

const ITEMS_PAGE = 12;
const ACTIVITIES_PAGE = 8;

export default async function LojaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const viewer = await getViewer();
  if (!canSeeContent(viewer)) return <MembersGate viewer={viewer} />;
  const member = isActiveMember(viewer) ? viewer.member : null;
  const { balance, activities, items, claims, orders } = await getShop(member?.id ?? null);
  const pendingCoins = claims.filter((c) => c.status === "pending").reduce((s, c) => s + c.coins, 0);
  const itemsPage = slicePage(items, pageFrom(params), ITEMS_PAGE);
  const activitiesPage = slicePage(activities, pageFrom(params, "atividades"), ACTIVITIES_PAGE);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Store} eyebrow="Evaldocoins do clã" title="Lojinha" accent="do clã" text="Participe de torneios, castles e atividades do clã, mande o print e troque suas Evaldocoins por itens." />

      {/* Saldo e como ganhar */}
      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-5">
        <div className="relative overflow-hidden rounded-[0.9rem] border border-amber-300/30 bg-gradient-to-br from-amber-400/[0.12] via-crypt to-black p-6 sm:p-8">
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-amber-300/15 blur-[60px]" />
          <p className="relative text-[11px] font-black italic uppercase tracking-[0.25em] text-amber-200/80">Seu saldo</p>
          <p className="relative mt-2 flex items-center gap-3">
            <Coin className="w-16 h-16 drop-shadow-[0_0_14px_rgba(251,191,36,0.6)]" />
            <span className="font-title text-6xl text-amber-200 tabular-nums">{member ? balance.toLocaleString("pt-BR") : "—"}</span>
          </p>
          <p className="relative mt-3 text-sm italic text-bone/55">
            {member
              ? pendingCoins > 0 ? `+${pendingCoins} Evaldocoins esperando a liderança aprovar.` : "Evaldocoins aprovadas, prontas para gastar."
              : "Só membros do clã juntam Evaldocoins."}
          </p>
        </div>

        <div className="crypt-card p-5 sm:p-6">
          <p className="font-title text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-spirit" /> Como ganhar Evaldocoins</p>
          {activities.length ? (
            <div className="mt-4 grid sm:grid-cols-2 gap-2">
              {activitiesPage.items.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
                  <span className="font-bold truncate">{a.name}</span>
                  <span className="shrink-0 inline-flex items-center gap-1 font-black text-amber-300 tabular-nums"><Coin className="w-5 h-5" /> {a.coins}</span>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-sm italic text-bone/45">Nenhuma atividade cadastrada ainda.</p>}
          <PageNav page={activitiesPage.page} pageCount={activitiesPage.pageCount} path="/loja" params={params} param="atividades" />
          <p className="mt-4 text-xs italic text-bone/40">Mande o print mostrando o dia e a hora. A liderança confere e as Evaldocoins caem no seu saldo.</p>
        </div>
      </div>

      {/* Itens */}
      <section id="itens" className="mt-16 scroll-mt-24">
        <SectionTitle title="Itens da loja" icon={Package} />
        {items.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {itemsPage.items.map((it) => {
              const soldOut = it.stock !== null && it.stock <= 0;
              return (
                <div key={it.id} className={`crypt-card crypt-card-hover overflow-hidden flex flex-col ${soldOut ? "opacity-60" : ""}`}>
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#2a0f4a] via-[#120822] to-black">
                    {it.image_url ? (
                      <img src={it.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(251,191,36,0.25),transparent_60%)]" />
                        <GhostIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-20 text-[#e9e2ff] specter-glow" />
                      </>
                    )}
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg border border-amber-300/50 bg-black/70 backdrop-blur px-2.5 py-1 font-black text-amber-200 tabular-nums">
                      <Coin className="w-5 h-5 text-amber-300" /> {it.price.toLocaleString("pt-BR")}
                    </span>
                    {it.stock !== null && (
                      <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md border text-[10px] font-black italic uppercase tracking-widest backdrop-blur ${soldOut ? "text-rose-200 bg-rose-500/30 border-rose-400/50" : "text-bone/80 bg-black/60 border-white/15"}`}>
                        {soldOut ? "Esgotado" : `${it.stock} em estoque`}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-title text-lg">{it.name}</h3>
                    {it.description && <p className="mt-1.5 text-sm italic text-bone/55 line-clamp-2">{it.description}</p>}
                    <div className="mt-auto pt-5"><BuyButton item={it} balance={balance} canBuy={!!member} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty text="A loja ainda está vazia. Logo a liderança coloca os itens!" />
        )}
        <PageNav page={itemsPage.page} pageCount={itemsPage.pageCount} path="/loja" params={params} anchor="itens" />
      </section>

      {/* Ganhar Evaldocoins e histórico (só membro) */}
      {member && (
        <>
          <section id="ganhar" className="mt-16 scroll-mt-24">
            <SectionTitle title="Pedir Evaldocoins" icon={Send} />
            <div className="crypt-card p-5 sm:p-6"><ClaimForm activities={activities} /></div>
          </section>
          <section className="mt-10">
            <ShopHistory claims={claims} orders={orders} />
          </section>
        </>
      )}
    </div>
  );
}
