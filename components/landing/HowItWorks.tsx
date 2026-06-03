import { MailOpen, FolderOpen, CheckCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";

const steps = [
  {
    icon: MailOpen,
    step: "01",
    title: "Receive Your Invitation",
    description: "The administrator sends you a secure invitation by email. Click the link, set your password, and your account is ready — no public sign-up required.",
  },
  {
    icon: FolderOpen,
    step: "02",
    title: "Open a Dossier",
    description: "Register or scan the client by fingerprint, select the notarial service, add all parties, set fees, and attach the required documents.",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Certify & Archive",
    description: "Review the dossier, mark it as completed, and the record is permanently stored — fully audited and retrievable at any time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-900 border-t border-white/8">
      <Container>
        <div className="text-center mb-16">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-400 mb-5 tracking-wide">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Three steps from login to a certified dossier
          </h2>
          <p className="mt-4 text-slate-400 text-base max-w-lg mx-auto">
            Simple, guided, and fast — designed for busy notarial offices.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* connector line */}
          <div aria-hidden className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-white/10" />

          {steps.map(({ icon: Icon, step, title, description }) => (
            <div key={step} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 mb-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800 border border-white/10">
                  <Icon size={28} className="text-brand-400" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold">
                  {step}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
