"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { signUp } from "@/lib/auth"
import { useState, useEffect, useTransition } from "react" // Added useTransition
import Link from "next/link"
import { useActionState } from "react"
import { useRouter } from "next/navigation"

export default function SignupPage({ searchParams }: { searchParams: { message: string } }) {
  const [state, formAction] = useActionState(signUp, { success: false, message: "" })
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const router = useRouter()
  const [isPending, startTransition] = useTransition() // Initialize useTransition

  useEffect(() => {
    console.log("Current signup state:", state)
    if (state.success) {
      // Redirect to login page with a success message after successful signup
      router.push(`/login?message=${encodeURIComponent(state.message)}&success=true`)
    }
  }, [state, router])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.")
      return
    }
    setPasswordError(null)
    const formData = new FormData(event.currentTarget)
    // Wrap the formAction call in startTransition
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-gray-50">Sign Up</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {passwordError && <p className="mt-1 text-sm text-red-500">{passwordError}</p>}
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select name="role" required defaultValue="nurse">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {" "}
            {/* Disable button during transition */}
            {isPending ? "Signing Up..." : "Sign Up"}
          </Button>
          {/* Display messages from initial searchParams (e.g., if redirected here with a message) */}
          {searchParams?.message && <p className="mt-4 text-center text-sm text-red-500">{searchParams.message}</p>}
          {/* Display messages from the server action state (e.g., validation errors) */}
          {state?.message &&
            !state.success && ( // Only show if not successful (success triggers redirect)
              <p className={`mt-4 text-center text-sm text-red-500`}>{state.message}</p>
            )}
        </form>
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
