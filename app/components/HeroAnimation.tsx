const STEPS = ["Filed", "Committee", "Debate", "Final vote", "Law"];

/**
 * Decorative: a bill card that slowly steps through the path to law, with
 * two cards drifting behind it. CSS only (see globals.css, .hero-anim),
 * paused for people who prefer reduced motion. Hidden from screen readers.
 */
export function HeroAnimation() {
  return (
    <div className="hero-anim relative h-[210px] w-[260px]" aria-hidden>
      <div className="hero-anim-back absolute left-10 top-0 h-36 w-52 rounded-2xl bg-white/5 ring-1 ring-white/10" />
      <div className="hero-anim-mid absolute left-5 top-5 h-36 w-52 rounded-2xl bg-white/[0.07] ring-1 ring-white/10" />
      <div className="hero-anim-front absolute left-0 top-11 w-60 rounded-2xl bg-[#2B4796] p-4 shadow-xl ring-1 ring-white/15">
        <div className="flex items-center gap-2">
          <span className="rounded bg-white/15 px-1.5 py-0.5 font-display text-[11px] font-semibold text-white">SB</span>
          <span className="h-2 w-16 rounded-full bg-white/20" />
        </div>
        <span className="mt-3 block h-2.5 w-full rounded-full bg-white/25" />
        <span className="mt-2 block h-2.5 w-3/4 rounded-full bg-white/15" />

        {/* Status pill: one label visible at a time, in step with the track. */}
        <div className="relative mt-4 h-6">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className="hero-anim-label absolute left-0 top-0 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white"
              style={{ animationDelay: `${i * 2.4}s` }}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${i === STEPS.length - 1 ? "bg-emerald-300" : "bg-amber-300"}`} />
              {s}
            </span>
          ))}
        </div>

        {/* Track: five stops, the fill advances one stop at a time. */}
        <div className="relative mt-3 h-1.5 rounded-full bg-white/10">
          <span className="hero-anim-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/50 to-red-300" />
        </div>
        <div className="mt-1.5 flex justify-between">
          {STEPS.map((s) => (
            <span key={s} className="h-1 w-1 rounded-full bg-white/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
