"use client";
import { forwardRef, ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-xs",
        secondary:
          "bg-secondary text-white hover:bg-secondary-600 active:bg-secondary-700 shadow-xs",
        outline:
          "border border-border bg-white text-gray-700 hover:bg-muted hover:border-gray-300 active:bg-gray-100",
        ghost:
          "text-gray-600 hover:bg-muted hover:text-gray-900 active:bg-gray-100",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-xs",
        accent:
          "bg-accent text-primary hover:bg-accent-400 active:bg-accent-500",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded",
        sm: "h-8 px-3 text-sm rounded",
        md: "h-9 px-4 text-sm rounded-md",
        lg: "h-10 px-5 text-sm rounded-lg",
        xl: "h-11 px-6 text-base rounded-lg",
        icon: "h-9 w-9 rounded-md",
        "icon-sm": "h-7 w-7 rounded",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  )
);

Button.displayName = "Button";

export { Button, buttonVariants };
