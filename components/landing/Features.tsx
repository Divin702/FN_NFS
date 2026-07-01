import {
  FolderOpen,
  Users,
  Fingerprint,
  FileText,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { Container } from "@/components/ui/Container";

const features = [
  {
    icon: FolderOpen,
    title: "Dossier Management",
    description:
      "Create, track, and manage notarial dossiers from start to finish. Assign parties, set fees, and monitor status in real time.",
  },
  {
    icon: Users,
    title: "Client Registry",
    description:
      "Register clients with photo and national ID. Every client profile is linked to their full dossier history for quick access.",
  },
  {
    icon: Fingerprint,
    title: "Biometric Identification",
    description:
      "Instantly identify clients by fingerprint scan using the ARATEK A600 scanner — no typing needed at the counter.",
  },
  {
    icon: FileText,
    title: "Document Templates",
    description:
      "Generate notarial documents from pre-built templates. Client data auto-fills the fields — attach files and store everything digitally.",
  },
  {
    icon: ClipboardList,
    title: "Full Audit Trail",
    description:
      "Every action is logged — who created, modified, or certified a dossier — giving you a complete and tamper-proof history.",
  },
  {
    icon: ShieldCheck,
    title: "Invitation-Only Access",
    description:
      "Staff are onboarded through secure admin invitations. No public registration, no unauthorised access to your platform.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="py-24 bg-[#103060] border-t border-white/10"
    >
      <Container>
        <div className="text-center mb-16">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 mb-5 tracking-wide uppercase">
            Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Everything your notarial workflow needs
          </h2>
          <p className="mt-4 text-white/50 max-w-lg mx-auto text-base">
            Built for Rwanda&apos;s legal ecosystem fast, secure, and designed
            for notarial professionals.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
