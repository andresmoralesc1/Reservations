"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type UserRole = "admin" | "manager" | "staff" | "viewer"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  restaurantId: string
  permissions: Permission[]
}

export type Permission =
  | "view_reservations"
  | "approve_reservations"
  | "reject_reservations"
  | "edit_reservations"
  | "delete_reservations"
  | "view_analytics"
  | "manage_tables"
  | "manage_users"
  | "export_data"

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view_reservations",
    "approve_reservations",
    "reject_reservations",
    "edit_reservations",
    "delete_reservations",
    "view_analytics",
    "manage_tables",
    "manage_users",
    "export_data",
  ],
  manager: [
    "view_reservations",
    "approve_reservations",
    "reject_reservations",
    "edit_reservations",
    "view_analytics",
    "manage_tables",
    "export_data",
  ],
  staff: [
    "view_reservations",
    "approve_reservations",
    "reject_reservations",
  ],
  viewer: [
    "view_reservations",
  ],
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// Demo users for development (replace with real auth in production)
const DEMO_USERS: User[] = [
  {
    id: "1",
    email: "admin@posit.com",
    name: "Admin User",
    role: "admin",
    restaurantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    permissions: ROLE_PERMISSIONS.admin,
  },
  {
    id: "2",
    email: "manager@posit.com",
    name: "Manager User",
    role: "manager",
    restaurantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    permissions: ROLE_PERMISSIONS.manager,
  },
  {
    id: "3",
    email: "staff@posit.com",
    name: "Staff User",
    role: "staff",
    restaurantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    permissions: ROLE_PERMISSIONS.staff,
  },
]

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("posit_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("posit_user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Demo login - replace with real authentication
    const foundUser = DEMO_USERS.find((u) => u.email === email)
    if (foundUser && password === "demo123") {
      setUser(foundUser)
      localStorage.setItem("posit_user", JSON.stringify(foundUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("posit_user")
  }

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    return user.permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false
    return permissions.some((p) => user.permissions.includes(p))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasPermission,
        hasAnyPermission,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
