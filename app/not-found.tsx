import Link from "next/link";
import { FileSearch, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <FileSearch size={40} />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <p className="text-6xl font-bold text-brand-500">404</p>
          <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
          <p className="text-sm text-muted leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md border border-border bg-white text-foreground text-sm font-medium hover:bg-surface transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
