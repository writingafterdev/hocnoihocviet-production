import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 py-2 leading-[1.55] aria-invalid:border-destructive w-full min-w-0 rounded-lg bg-white px-3 font-ui text-sm text-ink shadow-ring transition-shadow outline-none placeholder:text-ink-soft hover:shadow-ring-hover focus-visible:shadow-[0_0_0_1px_var(--brand-blue-deep),0_0_0_4px_rgba(47,98,196,0.15)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
