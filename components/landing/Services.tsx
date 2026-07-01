import {
  Landmark,
  FileCheck,
  Scale,
  Briefcase,
  BarChart3,
  Gavel,
  Home,
  Globe,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Container } from "@/components/ui/Container";

const services = [
  {
    icon: Landmark,
    title: "Land & Property Services",
    description: "End-to-end services ensuring every transaction is lawful, transparent, and secure.",
    items: [
      "Buying and selling of land and property",
      "Property transfers through gift, exchange, or auction",
      "Subdivision and merging of land parcels",
      "Land title registration and first registration",
    ],
  },
  {
    icon: FileCheck,
    title: "Notary & Conveyancing",
    description: "Reliable, compliant notary and conveyancing services for property transactions.",
    items: [
      "Land-related notarial acts",
      "Authentication of contracts and agreements",
      "Conveyancing services for property transactions",
    ],
  },
  {
    icon: Scale,
    title: "Mediation & Dispute Resolution",
    description: "Resolve disputes quickly, fairly, and cost-effectively — no prolonged court proceedings.",
    items: [
      "Land and property disputes",
      "Business and contractual disputes",
      "Family and inheritance-related disputes",
    ],
  },
  {
    icon: Briefcase,
    title: "Legal & Commercial Services",
    description: "Practical, results-oriented legal solutions for individuals, entrepreneurs, and businesses.",
    items: [
      "Legal representation before courts",
      "Business and corporate legal advisory",
      "Contract drafting, reviewing, and negotiating",
      "Company registration and startup support",
    ],
  },
  {
    icon: BarChart3,
    title: "Land & Property Valuation",
    description: "Accurate, independent, and market-based valuations for informed decision-making.",
    items: [
      "Market valuation of land and property",
      "Valuation for buying, selling, and investment",
      "Valuation for taxation, loans, and compensation",
      "Valuations for legal and dispute matters",
    ],
  },
  {
    icon: Gavel,
    title: "Public Auction Support",
    description: "Full guidance through public auction processes from start to finish.",
    items: [
      "Advisory on public auction procedures",
      "Property checks and due diligence",
      "Representation during public auctions",
      "Ownership transfer and title registration after auction",
    ],
  },
];

const propertyClients = [
  {
    icon: Home,
    label: "For Nationals",
    color: "text-blue-300",
    bg: "bg-blue-500/15",
    items: [
      "Buying and selling residential apartments",
      "Acquisition of commercial properties",
      "Property management and tenancy advisory",
      "Due diligence prior to acquisition",
      "Ownership verification and property records",
    ],
  },
  {
    icon: Globe,
    label: "For Diaspora",
    color: "text-emerald-300",
    bg: "bg-emerald-500/15",
    items: [
      "Remote property acquisition and sale",
      "Management of residential and commercial properties",
      "Tenant management and rent administration",
      "Comprehensive due diligence before purchase",
      "Regular reporting on property status",
    ],
  },
  {
    icon: Building2,
    label: "For Foreign Clients",
    color: "text-violet-300",
    bg: "bg-violet-500/15",
    items: [
      "Legal advisory on property acquisition",
      "Purchase and sale of approved properties",
      "Property management and tenancy coordination",
      "Legal and technical due diligence",
      "Title verification and regulatory compliance",
    ],
  },
];

export function Services() {
  return (
    <section id="services" className="py-24 bg-[#103060] border-t border-white/10">
      <Container>
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 mb-5 tracking-wide uppercase">
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Land, Legal &amp; Property Solutions
          </h2>
          <p className="mt-4 text-white/50 max-w-lg mx-auto text-base">
            Comprehensive services under one roof — from first registration to dispute resolution and long-term property management.
          </p>
        </div>

        {/* 6 service cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, description, items }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1.5">{title}</h3>
              <p className="text-xs text-white/45 leading-relaxed mb-4">{description}</p>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-white/30 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Property Management — featured full-width card */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 hover:border-white/20 transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h3 className="font-semibold text-white text-lg">
                Property Management &amp; Acquisition
              </h3>
              <p className="text-sm text-white/45 mt-1 max-w-lg">
                Tailored property solutions supporting nationals, diaspora, and foreign clients throughout the entire ownership and investment cycle.
              </p>
            </div>
            <span className="inline-flex items-center self-start sm:self-auto rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/60 whitespace-nowrap shrink-0">
              3 client types
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {propertyClients.map(({ icon: Icon, label, color, bg, items }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                    <Icon size={15} className={color} />
                  </div>
                  <span className="text-sm font-semibold text-white">{label}</span>
                </div>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-white/55">
                      <CheckCircle2 size={11} className="text-emerald-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
