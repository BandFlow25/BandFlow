//src/components/ui/context-menu.tsx
import * as React from "react"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import {
  Portal
} from "@radix-ui/react-portal"
import { cn } from "@/lib/utils"

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-700 bg-gray-800 p-1 shadow-md",
        className
      )}
      {...props}
    />
  </Portal>
))
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

export { ContextMenuContent }