import Link from "next/link";
import type { ReactNode } from "react";

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="border-t border-[#E5DED3] pt-6 first:border-0 first:pt-0"><h2 className="text-lg font-semibold tracking-tight text-[#172033]">{title}</h2><div className="mt-2 space-y-3 text-sm leading-6 text-[#374151] sm:text-base sm:leading-7">{children}</div></section>;
}

export default function LegalPage({ eyebrow, title, summary, children }: { eyebrow: string; title: string; summary: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#7487B8] px-4 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto max-w-3xl rounded-[1.85rem] bg-[#FFFDF8] p-5 shadow-[0_46px_136px_-50px_rgba(17,24,39,0.62)] ring-1 ring-[#C7BDAF] sm:p-9 lg:p-12">
        <header>
          <Link href="/" className="inline-flex min-h-10 items-center text-sm font-semibold text-[#334155] underline decoration-[#C7BDAF] underline-offset-4 hover:text-[#111827] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#64748B]/18">← Back to BetweenLines AI</Link>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#374151] sm:text-lg sm:leading-8">{summary}</p>
          <p className="mt-4 rounded-2xl bg-[#F8F4EC] px-4 py-3 text-sm leading-6 text-[#64748B] ring-1 ring-[#E5DED3]">This is practical pre-launch information, not final lawyer-approved legal copy. It should be reviewed by a qualified solicitor or attorney before public release.</p>
        </header>
        <div className="mt-9 space-y-7">{children}</div>
        <footer className="mt-10 border-t border-[#D8D2C7] pt-6">
          <nav aria-label="Legal pages" className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-[#64748B]"><Link className="hover:text-[#172033]" href="/privacy">Privacy</Link><Link className="hover:text-[#172033]" href="/terms">Terms</Link><Link className="hover:text-[#172033]" href="/disclaimer">Disclaimer</Link></nav>
          <p className="mt-4 text-xs leading-5 text-[#6B7280]">BetweenLines AI provides communication guidance only. You are responsible for what you choose to send.</p>
        </footer>
      </main>
    </div>
  );
}
