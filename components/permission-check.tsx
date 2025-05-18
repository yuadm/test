"use client"

import type React from "react"

import { useEffect, useState } from "react"

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
    const checkPermission = () => {
      // Special case for dashboard - everyone can see it
      if (module === "dashboard") {
        setHasPermission(true)
        setIsLoading(false)
        return
      }

      const userData = localStorage.getItem("user")
      if (!userData) {
        setHasPermission(false)
        setIsLoading(false)
        return
      }

      const user = JSON.parse(userData)

      // Admin role has all permissions
      if (user.role === "admin") {
        setHasPermission(true)
        setIsLoading(false)
        return
      }

      // Check specific permission
      const userPermissions = user.permissions || {}
      const modulePermissions = userPermissions[module] || []

      setHasPermission(modulePermissions.includes(permission))
      setIsLoading(false)
    }

    checkPermission()
  }, [module, permission])

  if (isLoading) {
    return null
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}
