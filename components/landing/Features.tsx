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
      "Instantly identify clients by fingerprint scan using the ARATEK A600 scanner no typing needed at the counter.",
  },
  {
    icon: FileText,
    title: "Document Templates",
    description:
      "Generate notarial documents from pre-built templates. Fill in the fields, attach files, and store everything digitally.",
  },
  {
    icon: ClipboardList,
    title: "Full Audit Trail",
    description:
      "Every action is logged who created, modified, or certified a dossier giving you a complete and tamper-proof history.",
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
    <section id="features" className="py-20 bg-surface">
      <Container>
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Everything your notarial workflow needs
          </h2>
          <p className="mt-3 text-muted max-w-lg mx-auto text-base">
            Built for Rwanda&apos;s legal ecosystem fast, secure, and designed
            for notarial professionals.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group bg-white rounded-2xl border border-border p-6 hover:border-brand-200 hover:shadow-md transition-all duration-200"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 group-hover:bg-brand-100 transition-colors">
                <Icon size={21} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
