import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 py-1 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium w-full min-w-0 rounded-lg bg-white px-3 font-ui text-sm text-ink shadow-ring transition-shadow outline-none placeholder:text-ink-soft hover:shadow-ring-hover focus-visible:shadow-[0_0_0_1px_var(--brand-blue-deep),0_0_0_4px_rgba(47,98,196,0.15)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
