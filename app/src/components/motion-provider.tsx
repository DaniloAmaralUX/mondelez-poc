"use client";

import type { ReactNode } from "react";

import { MotionConfig } from "motion/react";

/** Respeita "reduzir movimento" do sistema em todas as animações do motion. */
export function MotionProvider({ children }: { readonly children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
