import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-semibold cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-action-ink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-action-button text-on-action hover:bg-action-button-hover",
        ai: "bg-action-button text-on-action hover:bg-action-button-hover",
        destructive: "bg-danger text-white hover:bg-danger/90",
        outline: "border-[1.5px] border-line bg-paper text-ink hover:bg-cloud",
        secondary: "bg-cloud text-ink hover:bg-cloud-2",
        child: "bg-child text-ink hover:brightness-95",
        ghost: "bg-transparent text-ink-2 hover:bg-cloud hover:text-ink",
        link: "text-ink underline underline-offset-4",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "size-11 p-0",
        "icon-sm": "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
