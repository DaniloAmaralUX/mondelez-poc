"use client";

import * as React from "react";

import { createPortal } from "react-dom";

import { ChecklistPaper } from "./checklist-paper";
import type { ChecklistPaperProps } from "./checklist-preview";

export function PrintChecklist(props: ChecklistPaperProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div data-print-root>
      <ChecklistPaper {...props} />
    </div>,
    document.body,
  );
}
