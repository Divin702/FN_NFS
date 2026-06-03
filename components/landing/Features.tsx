import { FolderOpen, Users, Fingerprint, FileText, ShieldCheck, ClipboardList } from "lucide-react";
import { Container } from "@/components/ui/Container";

const features = [
  {
    icon: FolderOpen,
    title: "Dossier Management",
    description: "Create, track, and manage notarial dossiers from start to finish. Assign parties, set fees, and monitor status in real time.",
    iconBg: "bg-brand-500",
  },
  {
    icon: Users,
    title: "Client Registry",
    description: "Register clients with photo and national ID. Every client profile is linked to their full dossier history for quick access.",
    iconBg: "bg-violet-600",
  },
  {
    icon: Fingerprint,
    title: "Biometric Identification",
    description: "Instantly identify clients by fingerprint scan using the ARATEK A600 scanner — no typing needed at the counter.",
    iconBg: "bg-emerald-600",
  },
  {
    icon: FileText,
    title: "Document Templates",
    description: "Generate notarial documents from pre-built templates. Client data auto-fills the fields — attach files and store everything digitally.",
    iconBg: "bg-amber-600",
  },
  {
    icon: ClipboardList,
    title: "Full Audit Trail",
    description: "Every action is logged — who created, modified, or certified a dossier — giving you a complete and tamper-proof history.",
    iconBg: "bg-rose-600",
  },
  {
    icon: ShieldCheck,
    title: "Invitation-Only Access",
    description: "Staff are onboarded through secure admin invitations. No public registration, no unauthorised access to your platform.",
    iconBg: "bg-cyan-600",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-slate-950 border-t border-white/8">
      <Container>
        <div className="text-center mb-16">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-400 mb-5 tracking-wide">
            Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Everything your notarial workflow needs
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg mx-auto text-base">
            Built for Rwanda&apos;s legal ecosystem — fast, secure, and designed
            for notarial professionals.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description, iconBg }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/8 bg-slate-900 p-6 hover:border-white/15 hover:bg-slate-800/80 transition-all duration-200"
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
