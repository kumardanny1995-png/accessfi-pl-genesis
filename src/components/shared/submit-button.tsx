"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/shared/button";

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary"
}: {
  children: ReactNode;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" fullWidth variant={variant} disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
