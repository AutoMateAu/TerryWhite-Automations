import type React from "react"
import { cn } from "@/lib/utils"

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode
}

export function Code({ children, className, ...props }: CodeProps) {
  return (
    <pre
      className={cn("rounded-md bg-muted p-4 overflow-x-auto font-mono text-sm text-muted-foreground", className)}
      {...props}
    >
      <code>{children}</code>
    </pre>
  )
}
