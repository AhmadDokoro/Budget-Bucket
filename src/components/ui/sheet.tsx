"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Hide the visible title row but keep it for screen readers. */
  hideHeader?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * A mobile bottom-sheet modal. Built on Radix Dialog (focus trap + a11y) with
 * Framer Motion for the slide-up / fade animation and a small drag-to-dismiss
 * affordance on the grab handle.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  hideHeader = false,
  children,
  className,
}: BottomSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className={cn(
                  "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] w-full max-w-[480px] flex-col rounded-t-3xl border-t border-border bg-card pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl focus:outline-none",
                  className
                )}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.4 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 120 || info.velocity.y > 600) {
                    onOpenChange(false);
                  }
                }}
              >
                <div className="flex justify-center pt-3">
                  <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                </div>

                {hideHeader ? (
                  <VisuallyHidden>
                    <Dialog.Title>{title}</Dialog.Title>
                  </VisuallyHidden>
                ) : (
                  <div className="px-6 pb-2 pt-4">
                    <Dialog.Title className="text-xl font-bold tracking-tight">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                )}

                <div className="overflow-y-auto px-6 pt-2">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
