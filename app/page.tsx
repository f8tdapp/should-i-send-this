export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 sm:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_100px_-50px_rgb(15,23,42,0.2)] backdrop-blur-xl sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Should I Send This?
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Before you hit send…
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Paste your message and find out how it actually sounds.
            </p>
          </div>

          <div className="mt-10 space-y-5">
            <label htmlFor="message" className="sr-only">
              Message input
            </label>
            <textarea
              id="message"
              rows={10}
              placeholder="Type or paste your message here..."
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Analyze
            </button>
          </div>

          <section className="mt-10 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Result preview
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  Nothing analyzed yet
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Once you paste a message and tap Analyze, this card will show how your writing sounds and where you might want to adjust the tone.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
