import { Shield } from "lucide-react";
import AdminPanel from "@/components/admin/AdminPanel";
import LoginPrompt from "@/components/LoginPrompt";
import { PageHeader } from "@/components/ui";
import { getViewer } from "@/lib/viewer";
import { isDemo } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Painel da liderança", robots: { index: false } };

export default async function AdminPage() {
  const viewer = await getViewer();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Shield} eyebrow="Só liderança" title="Painel da" accent="liderança" />
      {!viewer ? (
        <div className="crypt-card p-6"><LoginPrompt text="Entre com o Discord para acessar o painel." /></div>
      ) : isDemo() ? (
        <p className="crypt-card p-6 text-sm text-bone/60">O painel funciona depois que o Supabase estiver configurado (veja o README).</p>
      ) : !viewer.isAdmin ? (
        <p className="crypt-card p-6 text-sm text-bone/60">Acesso só para líder e vice. Se você é da liderança, peça para colocarem seu ID do Discord em ADMIN_DISCORD_IDS.</p>
      ) : (
        <AdminPanel />
      )}
    </div>
  );
}
