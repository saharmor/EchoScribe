import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-3xl border px-4 py-4 text-sm shadow-sm backdrop-blur-sm",
  {
    variants: {
      tone: {
        default: "border-border/80 bg-card/85 text-foreground",
        success: "border-success/20 bg-success/10 text-foreground",
        warning: "border-warning/25 bg-warning/10 text-foreground",
        destructive: "border-destructive/20 bg-destructive/10 text-foreground",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, tone, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  ),
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("font-medium leading-none", className)} {...props} />
  ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("mt-2 text-sm leading-6 text-muted-foreground", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription, AlertTitle }
