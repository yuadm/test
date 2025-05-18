
"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Try to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data?.user) {
        // Fetch user data from our users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (userError) {
          // If user doesn't exist in our users table yet, create a default entry
          // This handles first-time login after authentication is set up
          if (userError.code === "PGRST116") {
            const { error: insertError } = await supabase.from("users").insert({
              id: data.user.id,
              email: data.user.email || email,
              role: "admin", // Default role for first user
            })

            if (insertError) {
              setError("Failed to create user profile")
              return
            }
          } else {
            setError(userError.message)
            return
          }
        }

        toast({
          title: "Login successful",
          description: "Redirecting to dashboard...",
        })

        router.push("/dashboard")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Welcome to Our Admin Portal</h1>
        <p className="text-gray-500">Sign in to access the dashboard and manage your business</p>
      </div>
      <Card className="border-none shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Dashboard</CardTitle>
          <CardDescription className="text-center">Enter your credentials to sign in</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-red-500 font-medium">{error}</div>}
          </form>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
