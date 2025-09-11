"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/analysis", label: "Analysis" },
    { href: "/data", label: "Data" },
    { href: "/settings", label: "Settings" },
  ]

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2" aria-label="Statistical Analysis Platform - Home">
          <Calculator className="h-6 w-6" aria-hidden="true" />
          <h1 className="text-lg font-semibold">Statistical Analysis Platform</h1>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <nav className="flex items-center space-x-4" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={pathname === item.href ? "default" : "ghost"} 
                  size="sm"
                  className={cn(
                    "transition-colors",
                    pathname === item.href && "bg-primary text-primary-foreground"
                  )}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}