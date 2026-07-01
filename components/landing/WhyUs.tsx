import { Clock, BookOpen, Scale, Globe, ShieldCheck, Layers } from "lucide-react";
import { Container } from "@/components/ui/Container";

const reasons = [
  {
    icon: Clock,
    number: "01",
    title: "Experience You Can Trust",
    description:
      "Founded and led by professionals with nearly two decades of experience built through direct engagement with public institutions, local governments, and international development organizations.",
  },
  {
    icon: BookOpen,
    number: "02",
    title: "Deep Knowledge of Land Systems",
    description:
      "Hands-on expertise in land registration, boundary correction, land information systems, valuation, conveyancing, and dispute resolution — saving clients time and cost.",
  },
  {
    icon: Scale,
    number: "03",
    title: "Legal Precision & Practical Solutions",
    description:
      "We combine strong legal expertise with a problem-solving approach, delivering clear, lawful, and workable solutions tailored to each client's specific needs.",
  },
  {
    icon: Globe,
    number: "04",
    title: "Trusted by Diaspora & Foreign Clients",
    description:
      "Our transparent processes, regular reporting, and strict due diligence standards ensure peace of mind and accountability — even when clients are not physically present.",
  },
  {
    icon: ShieldCheck,
    number: "05",
    title: "Integrity, Transparency & Accountability",
    description:
      "Guided by the highest ethical standards in every assignment. We prioritize transparency, accuracy, and client protection, ensuring land and property rights are legally sound.",
  },
  {
    icon: Layers,
    number: "06",
    title: "One-Stop Land & Legal Services",
    description:
      "Land services, legal advisory, notary, mediation, valuation, and property management under one roof — comprehensive, coordinated solutions from first registration to long-term management.",
  },
];

export function WhyUs() {
  return (
    <section
      id="why-us"
      className="py-24 border-t border-white/10"
      style={{ background: "linear-gradient(to bottom, #0d2750, #051e3e)" }}
    >
      <Container>
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 mb-5 tracking-wide uppercase">
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Our Expertise
          </h2>
          <p className="mt-4 text-white/50 max-w-lg mx-auto text-base">
            The combination of institutional knowledge, legal precision, and client-first values that sets us apart.
          </p>
        </div>

        {/* Numbered cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map(({ icon: Icon, number, title, description }) => (
            <div
              key={number}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-sm font-bold text-white/25 font-mono tracking-wider">
                  {number}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
