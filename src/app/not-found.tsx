import Link from "next/link";
import GhostIcon from "@/components/GhostIcon";

export default function NotFound() {
  return (
    <div className="pt-40 pb-20 text-center px-4">
      <GhostIcon className="w-20 h-24 mx-auto text-spirit/60 hover-haunt" />
      <h1 className="font-title text-5xl font-bold mt-6 ecto-text">404</h1>
      <p className="text-bone/60 mt-3">Essa página foi pro outro lado.</p>
      <Link href="/" className="btn-ecto mt-8">Voltar ao início</Link>
    </div>
  );
}
