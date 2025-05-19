
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase } from "../src/integrations/supabase/client"

type PermissionCheckProps = {
  module: string
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionCheck({ module, permission, children, fallback = null }: PermissionCheckProps) {
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has the required permission
    const checkPermission = async () => {
      // Special case for dashboard - everyone can see it
      if (module === "dashboard") {
        setHasPermission(true)
        setIsLoading(false)
        return
      }

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setHasPermission(false)
        setIsLoading(false)
        return
      }

      try {
        // Fetch user data from our users table
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (error) {
          console.error("Error fetching user data:", error)
          setHasPermission(false)
          setIsLoading(false)
          return
        }

        // Admin role has all permissions
        if (userData.role === "admin") {
          setHasPermission(true)
          setIsLoading(false)
          return
        }

        // Check specific permission from user data
        // Using type assertion to safely access the permissions property
        const userPermissions = (userData.permissions as any) || {}
        const modulePermissions = userPermissions[module] || []

        setHasPermission(modulePermissions.includes(permission))
        setIsLoading(false)
      } catch (err) {
        console.error("Error checking permissions:", err)
        setHasPermission(false)
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [module, permission])

  if (isLoading) {
    return null
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}
