import { Container } from "@/components/ui/Container";

const stats = [
  { value: "20+", label: "Years of Experience" },
  { value: "100%", label: "Legal Certainty" },
  { value: "3", label: "Client Categories" },
  { value: "7+", label: "Service Areas" },
];

export function About() {
  return (
    <section
      id="about"
      className="py-24 border-t border-white/10 overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #0d2750, #051e3e)" }}
    >
      <Container>
        {/* ── Top split: decorative year + heading ── */}
        <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16 mb-16">
          {/* Left: decorative "20" anchor */}
          <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-44 pt-2">
            <div className="relative flex items-center justify-center">
              {/* giant faded number behind */}
              <span
                aria-hidden
                className="select-none font-black text-white leading-none"
                style={{ fontSize: 160, opacity: 0.06, lineHeight: 1 }}
              >
                20
              </span>
              {/* readable stat on top */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white tracking-tight leading-none">
                  20+
                </span>
                <span className="text-[11px] font-semibold text-white/50 tracking-widest uppercase mt-2">
                  Years
                </span>
              </div>
            </div>
            {/* vertical divider */}
            <div className="mt-6 w-px h-16 bg-white/10" />
          </div>

          {/* Right: text content */}
          <div className="flex-1">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 mb-6 tracking-wide uppercase">
              About Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-snug max-w-2xl">
              Trusted experience in land administration, legal affairs, and land
              governance.
            </h2>
            <p className="mt-5 text-white/50 text-base leading-relaxed max-w-xl">
              We deliver secure, transparent, and legally sound land and
              property solutions for nationals, diaspora clients, and foreign
              investors — combining deep institutional knowledge with practical
              legal expertise.
            </p>

            {/* Tagline */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
              <div className="h-5 w-0.5 rounded-full bg-white/30 shrink-0" />
              <p className="text-white font-semibold text-sm italic">
                Your land. Your rights. Our expertise.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="text-center rounded-2xl border border-white/10 bg-white/5 px-6 py-8 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              <p className="text-4xl sm:text-5xl font-black text-white">
                {value}
              </p>
              <p className="text-[11px] font-medium text-white/50 mt-3 tracking-wide uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
