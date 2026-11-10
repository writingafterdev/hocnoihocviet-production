import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 font-ui text-xs font-semibold whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-ink bg-ink text-white",
        secondary: "border-line bg-paper-2 text-ink-soft",
        outline: "border-ink bg-card text-ink",
        destructive: "border-transparent bg-tomato-soft text-tomato-deep",
        tomato: "border-transparent bg-tomato-soft text-tomato-deep",
        blue: "border-transparent bg-blue-soft text-blue-deep",
        leaf: "border-transparent bg-leaf-soft text-leaf",
        sun: "border-transparent bg-sun-soft text-[#7A5200]",
        blush: "border-transparent bg-blush-soft text-[#9C2F57]",
        ghost: "border-transparent text-ink-soft",
        link: "text-blue-deep underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
