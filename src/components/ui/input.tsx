import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 py-1 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium w-full min-w-0 rounded-[12px] border-[1.5px] border-line bg-card px-3.5 font-ui text-[15px] text-ink transition-[border-color,box-shadow] outline-none placeholder:text-ink-soft/70 hover:border-ink/40 focus-visible:border-ink focus-visible:shadow-ink-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
