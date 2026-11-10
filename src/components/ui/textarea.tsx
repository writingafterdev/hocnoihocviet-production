import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 py-3 leading-[1.6] aria-invalid:border-destructive w-full min-w-0 rounded-[12px] border-[1.5px] border-line bg-card px-3.5 font-ui text-[15px] text-ink transition-[border-color,box-shadow] outline-none placeholder:text-ink-soft/70 hover:border-ink/40 focus-visible:border-ink focus-visible:shadow-ink-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
