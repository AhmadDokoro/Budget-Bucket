"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MoneyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: string;
  onValueChange: (raw: string) => void;
  currency?: string;
}

/**
 * A text input constrained to a positive decimal money value, with the
 * currency symbol rendered as a prefix. Keeps the value as a string so partial
 * input (e.g. "12.") stays editable.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, currency, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow empty, digits, and a single decimal point with up to 2 decimals.
      if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) {
        onValueChange(raw);
      }
    };

    return (
      <div className="relative">
        {currency && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-muted-foreground">
            {currency}
          </span>
        )}
        <Input
          ref={ref}
          inputMode="decimal"
          type="text"
          value={value}
          onChange={handleChange}
          className={cn(
            "tabular text-lg font-semibold",
            currency && "pl-10",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
MoneyInput.displayName = "MoneyInput";
