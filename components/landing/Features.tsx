import {
  FileText,
  Users,
  ShieldCheck,
  ClipboardList,
  Bell,
  Lock,
} from "lucide-react";
import { Container } from "@/components/ui/Container";

const features = [
  {
    icon: FileText,
    title: "Digital Document Management",
    description:
      "Submit, track, and retrieve notarial documents from anywhere no physical queues.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description:
      "Citizens, Legal Clerks, Notary Publics, and Administrators each have a tailored workspace.",
  },
  {
    icon: ShieldCheck,
    title: "End-to-End Security",
    description:
      "All data is encrypted in transit and at rest using industry-standard protocols.",
  },
  {
    icon: ClipboardList,
    title: "Full Audit Trail",
    description:
      "Every action is logged know exactly who reviewed, approved, or modified a document.",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    description:
      "Stay updated at every stage with instant notifications for status changes.",
  },
  {
    icon: Lock,
    title: "Invitation-Only Staff",
    description:
      "Clerks and notaries are onboarded via secure admin invitations no unauthorised access.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-surface">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Everything your notarial workflow needs
          </h2>
          <p className="mt-3 text-muted max-w-xl mx-auto text-base">
            Built for Rwanda&apos;s legal ecosystem — powerful for notaries and administrators.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group bg-white rounded-lg border border-border p-6 hover:border-brand-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-500 group-hover:bg-brand-100 transition-colors">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{title}</h3>
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
