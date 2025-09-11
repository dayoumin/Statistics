"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"

export function Header() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center space-x-2">
          <Calculator className="h-6 w-6" />
          <h1 className="text-lg font-semibold">Statistical Analysis Platform</h1>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
            <Button variant="ghost" size="sm">
              Analysis
            </Button>
            <Button variant="ghost" size="sm">
              Data
            </Button>
            <Button variant="ghost" size="sm">
              Settings
            </Button>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}