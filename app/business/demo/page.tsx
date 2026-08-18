import type { Metadata } from "next";
import Link from "next/link";

import EmbeddedDemo from "./embedded-demo";

export const metadata: Metadata = {
  title: "Embedded product demo | BetweenLines AI",
  description:
    "See how BetweenLines can surface communication risk inside the tools teams already use.",
};

export default function BusinessDemoPage() {
  return (
    <main className="min-h-screen bg-[#101722] text-[#172033]">
      <div className="mx-auto w-full max-w-[92rem] px-4 py-5 sm:px-7 sm:py-7 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-white/12 pb-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-black tracking-[-0.02em] text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#172033]">
                <span className="flex w-3.5 flex-col gap-0.5" aria-hidden="true">
                  <span className="h-0.5 w-3.5 rounded-full bg-current" />
                  <span className="ml-1 h-0.5 w-2.5 rounded-full bg-current" />
                  <span className="h-0.5 w-2 rounded-full bg-current" />
                </span>
              </span>
              BetweenLines AI™
            </Link>
            <p className="mt-1.5 text-xs font-medium text-white/60">
              Embedded communication-risk prototype
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/70">
            <span className="rounded-full border border-white/14 bg-white/6 px-3 py-1.5">
              No message history
            </span>
            <span className="rounded-full border border-white/14 bg-white/6 px-3 py-1.5">
              User-triggered check
            </span>
            <Link
              href="/"
              className="rounded-full border border-white/20 px-3 py-1.5 text-white transition hover:bg-white hover:text-[#172033]"
            >
              Public analyser
            </Link>
          </div>
        </header>

        <section className="py-7 sm:py-10">
          <div className="max-w-[52rem]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#AFC1F2]">
              Write where you already work
            </p>
            <h1 className="mt-3 text-[clamp(2rem,5vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-white [text-wrap:balance]">
              A quiet check before a message becomes a problem.
            </h1>
            <p className="mt-4 max-w-[45rem] text-sm font-medium leading-6 text-white/68 sm:text-base sm:leading-7">
              This prototype shows the commercial experience inside a familiar
              message composer. BetweenLines stays out of the way until the
              sender asks for a check, then explains the Perception Gap without
              replacing their voice.
            </p>
          </div>

          <EmbeddedDemo />
        </section>
      </div>
    </main>
  );
}
