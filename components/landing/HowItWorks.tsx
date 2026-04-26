import { UserPlus, Send, CheckCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    description:
      "Citizens sign up instantly with their name, email, National ID, and phone number. Staff receive a secure invitation from an administrator.",
  },
  {
    icon: Send,
    step: "02",
    title: "Submit Documents",
    description:
      "Upload and submit your documents digitally. Track the status of each submission in real time from your dashboard.",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Get Certified",
    description:
      "A Notary Public reviews and certifies your documents. You receive a notification the moment your file is ready.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            How it works
          </h2>
          <p className="mt-3 text-muted text-base max-w-lg mx-auto">
            Three simple steps from registration to a certified document.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* connector line on desktop */}
          <div
            aria-hidden
            className="hidden md:block absolute top-10 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-brand-100"
          />

          {steps.map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 border-4 border-white shadow-sm mb-5">
                <Icon size={28} className="text-brand-500" />
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold">
                  {step}
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed max-w-xs">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
