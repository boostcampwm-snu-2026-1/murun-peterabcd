import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-text font-normal tracking-[-0.374px] transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apple-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-apple-primary text-white",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-apple-primary bg-apple-canvas text-apple-primary",
        secondary:
          "border-[3px] border-apple-divider bg-apple-pearl text-apple-muted-80",
        ghost: "bg-transparent text-apple-primary",
        link: "h-auto rounded-none p-0 text-apple-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-[22px] py-[11px] text-[17px] leading-none",
        sm: "h-9 px-[15px] py-2 text-sm leading-[1.29] tracking-[-0.224px]",
        lg: "h-12 px-7 py-3.5 text-[18px] font-light leading-none tracking-normal",
        icon: "h-11 w-11 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
