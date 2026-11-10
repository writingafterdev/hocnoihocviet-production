import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-ui text-sm font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Clean and minimal: a filled primary with a 1px darker ring, quiet secondaries with a hairline ring.
        default: "bg-primary text-white shadow-[0_0_0_1px_#2453AE,0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#2856B3]",
        tomato: "bg-tomato text-white shadow-[0_0_0_1px_#D2401B,0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#F04E26]",
        blue: "bg-blue-soft text-blue-deep hover:bg-[#E2EBFA]",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "bg-white text-ink shadow-ring hover:bg-paper-2",
        secondary: "bg-paper-2 text-ink hover:bg-[#EDEDED]",
        ghost: "text-ink-soft hover:bg-paper-2 hover:text-ink",
        link: "text-blue-deep underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-[13px] has-[>svg]:px-2.5",
        lg: "h-10 px-4 has-[>svg]:px-3.5",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
