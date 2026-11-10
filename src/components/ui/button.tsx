import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[12px] font-ui text-sm font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Brand: ink lines like the illustrations. The main action has a hard ink shadow and lifts on hover.
        default: "border-[1.5px] border-ink bg-ink text-white hover:-translate-y-px hover:bg-ink/90 active:translate-y-0",
        tomato: "border-[1.5px] border-ink bg-tomato text-ink shadow-ink-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-ink active:translate-x-0 active:translate-y-0 active:shadow-none",
        blue: "border-[1.5px] border-ink bg-blue text-ink shadow-ink-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-ink active:translate-x-0 active:translate-y-0 active:shadow-none",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline: "border-[1.5px] border-ink bg-card text-ink hover:bg-paper-2",
        secondary: "bg-paper-2 text-ink hover:bg-line/60",
        ghost: "text-ink-soft hover:bg-paper-2 hover:text-ink",
        link: "text-blue-deep underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 has-[>svg]:px-4",
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3.5 has-[>svg]:px-3",
        lg: "h-12 rounded-xl px-7 text-[15px] has-[>svg]:px-5",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
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
