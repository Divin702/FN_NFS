"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecked(true);
    }
  }, [router]);

  if (!checked) return null;

  return <>{children}</>;
}
