import { MailOpen, Upload, CheckCircle, Lock, Zap } from "lucide-react";
import { Container } from "@/components/ui/Container";

const steps = [
  {
    icon: MailOpen,
    step: "01",
    title: "Secure Access",
    description:
      "Receive your secure invitation. Set up your account instantly — no public sign-ups. Admin-controlled access ensures your data stays protected.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Upload,
    step: "02",
    title: "Create Transaction",
    description:
      "Start a new dossier in seconds. Add parties, documents, and transaction details. Our smart forms guide you through each requirement seamlessly.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Zap,
    step: "03",
    title: "Auto-Verify & Review",
    description:
      "Our system instantly validates documents and flags missing requirements. Notaries review verified data with full confidence and speed.",
    color: "from-emerald-500 to-cyan-500",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Digital Certification",
    description:
      "Authenticate and certify with legally binding digital signatures. Every action is logged for complete audit trails and regulatory compliance.",
    color: "from-emerald-500 to-green-600",
  },
  {
    icon: Lock,
    step: "05",
    title: "Permanent Archive",
    description:
      "Dossiers are encrypted and stored permanently. Access records anytime, anywhere — diaspora clients included with real-time updates.",
    color: "from-indigo-500 to-purple-600",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 border-t border-white/10"
      style={{ background: "linear-gradient(to bottom, #0d2750, #051e3e)" }}
    >
      <Container>
        <div className="text-center mb-20">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 mb-5 tracking-wide uppercase">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6">
            From Transaction to Certification in Minutes
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Our streamlined workflow automates notary processes, reduces
            paperwork, and ensures every transaction is legally sound and fully
            audited.
          </p>
        </div>

        {/* Desktop: Vertical timeline with cards */}
        <div className="hidden lg:block">
          <div className="relative max-w-3xl mx-auto">
            {/* Vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-blue-500 via-emerald-500 to-purple-600 transform -translate-x-1/2" />

            {/* Steps */}
            <div className="space-y-12">
              {steps.map(
                ({ icon: Icon, step, title, description, color }, idx) => (
                  <div
                    key={step}
                    className={`relative flex items-center ${idx % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
                  >
                    {/* Card */}
                    <div
                      className={`w-5/12 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/10 transition-all ${idx % 2 === 0 ? "mr-auto pr-8" : "ml-auto pl-8"}`}
                    >
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {title}
                      </h3>
                      <p className="text-sm text-white/60 leading-relaxed">
                        {description}
                      </p>
                    </div>

                    {/* Center icon circle */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                      <div
                        className={`bg-linear-to-br ${color} p-4 rounded-full shadow-2xl`}
                      >
                        <Icon size={24} className="text-white" />
                      </div>
                      <span className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-900 text-xs font-bold font-mono">
                        {step}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Mobile: Stacked cards */}
        <div className="lg:hidden grid gap-4">
          {steps.map(({ icon: Icon, step, title, description, color }) => (
            <div
              key={step}
              className="relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-white/10 transition-all pl-20"
            >
              {/* Icon */}
              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
                <div className={`bg-linear-to-br ${color} p-3 rounded-full`}>
                  <Icon size={20} className="text-white" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-900 text-xs font-bold">
                  {step}
                </span>
              </div>

              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Benefits row */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "10x Faster",
              desc: "Complete transactions in minutes, not days",
            },
            {
              label: "Fully Secured",
              desc: "End-to-end encryption and audit trails",
            },
            {
              label: "Remote Ready",
              desc: "Diaspora clients track progress anytime",
            },
          ].map((benefit, idx) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-xl p-5 text-center hover:border-white/20 transition-all"
            >
              <p className="text-white font-semibold mb-1">{benefit.label}</p>
              <p className="text-xs text-white/60">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
