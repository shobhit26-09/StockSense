import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-3xl border px-4 py-2 text-sm font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-primary text-primary-foreground hover:shadow-[var(--shadow-button)] hover:scale-105",
        secondary:
          "glass-effect border-border/30 text-secondary-foreground hover:bg-secondary/20 hover:scale-105",
        destructive:
          "glass-effect border-destructive/30 text-destructive hover:bg-destructive/20 hover:scale-105",
        outline: "glass-effect text-foreground border-border/30 hover:bg-accent/10 hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
