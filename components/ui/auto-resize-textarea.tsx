"use client"

import * as React from "react"
import { Textarea, type TextareaProps } from "@/components/ui/textarea" // Keep this import
import { cn } from "@/lib/utils"

export interface AutoResizeTextareaProps extends TextareaProps {}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ className, value, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Combine the forwarded ref with our internal ref
    const combinedRef = (el: HTMLTextAreaElement) => {
      // @ts-ignore
      textareaRef.current = el
      if (typeof ref === "function") {
        ref(el)
      } else if (ref) {
        ref.current = el
      }
    }

    React.useLayoutEffect(() => {
      const textarea = textareaRef.current
      if (textarea) {
        // Reset height to 'auto' to get the correct scrollHeight
        textarea.style.height = "auto"
        // Set the new height based on the content
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [value]) // Re-run this effect when the textarea value changes

    return (
      <Textarea className={cn("resize-none overflow-hidden", className)} ref={combinedRef} value={value} {...props} />
    )
  },
)
AutoResizeTextarea.displayName = "AutoResizeTextarea"

export { AutoResizeTextarea, Textarea } // Added Textarea to named exports
