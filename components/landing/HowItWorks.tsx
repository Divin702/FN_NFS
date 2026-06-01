import { MailOpen, FolderOpen, CheckCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";

const steps = [
  {
    icon: MailOpen,
    step: "01",
    title: "Receive Your Invitation",
    description:
      "The administrator sends you a secure invitation by email. Click the link, set your password, and your account is ready — no public sign-up required.",
  },
  {
    icon: FolderOpen,
    step: "02",
    title: "Open a Dossier",
    description:
      "Register or scan the client by fingerprint, select the notarial service, add all parties, set fees, and attach the required documents.",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Certify & Archive",
    description:
      "Review the dossier, mark it as completed, and the record is permanently stored — fully audited and retrievable at any time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <Container>
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">How it works</h2>
          <p className="mt-3 text-muted text-base max-w-lg mx-auto">
            Three steps from login to a certified, archived dossier.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* connector line */}
          <div aria-hidden
            className="hidden md:block absolute top-10 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-linear-to-r from-brand-200 via-brand-300 to-brand-200"
          />

          {steps.map(({ icon: Icon, step, title, description }) => (
            <div key={step} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 border-4 border-white shadow-md mb-5">
                <Icon size={28} className="text-brand-500" />
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold">
                  {step}
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed max-w-xs">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
