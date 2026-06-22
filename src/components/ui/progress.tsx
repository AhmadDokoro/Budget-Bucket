"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0..1 */
  value: number;
  indicatorClassName?: string;
  /** Disable the entry animation (e.g. for lists). */
  animate?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorClassName, animate = true, ...props }, ref) => {
    const pct = clamp(value, 0, 1) * 100;
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "relative h-2.5 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <motion.div
          className={cn("h-full rounded-full bg-primary", indicatorClassName)}
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
