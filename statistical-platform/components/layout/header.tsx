"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { memo } from "react"

// 네비게이션 아이템을 상수로 이동하여 리렌더링 시 재생성 방지
const NAV_ITEMS = [
  { href: "/", label: "스마트 분석" },
  { href: "/analysis", label: "전통 분석" },
  { href: "/dashboard", label: "대시보드" },
  { href: "/about", label: "소개" },
  { href: "/help", label: "도움말" },
  { href: "/settings", label: "설정" },
] as const

// 개별 네비게이션 아이템 컴포넌트를 memo로 최적화
const NavItem = memo(({ href, label, isActive }: { href: string; label: string; isActive: boolean }) => (
  <Link 
    key={href} 
    href={href} 
    prefetch={true}
  >
    <Button 
      variant={isActive ? "default" : "ghost"} 
      size="sm"
      className={cn(
        "transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-primary text-primary-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Button>
  </Link>
))

NavItem.displayName = "NavItem"

export const Header = memo(() => {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Link 
          href="/" 
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity" 
          aria-label="Statistical Analysis Platform - Home"
          prefetch={true}
        >
          <Calculator className="h-6 w-6" aria-hidden="true" />
          <h1 className="text-lg font-semibold">통계 분석 플랫폼</h1>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <nav className="flex items-center space-x-2" role="navigation" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <NavItem 
                key={item.href}
                href={item.href}
                label={item.label}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
})

Header.displayName = "Header"