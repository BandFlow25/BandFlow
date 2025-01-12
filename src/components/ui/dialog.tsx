"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
 children: React.ReactNode
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
 ({ className, children, ...props }, ref) => (
   <DialogPortal>
     <DialogPrimitive.Content
       ref={ref}
       className={"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg " + className}
       {...props}
     >
       {children}
     </DialogPrimitive.Content>
   </DialogPortal>
 )
)
DialogContent.displayName = "DialogContent"

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogHeader = ({ className, ...props }: DialogHeaderProps) => (
 <div className={"flex flex-col space-y-1.5 text-center sm:text-left " + className} {...props} />
)

interface DialogTitleProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
 ({ className, ...props }, ref) => (
   <DialogPrimitive.Title
     ref={ref}
     className={"text-lg font-semibold leading-none tracking-tight " + className}
     {...props}
   />
 )
)
DialogTitle.displayName = "DialogTitle"

export {
 Dialog,
 DialogTrigger,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogClose,
}