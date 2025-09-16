/**
 * Design System Types
 * 
 * Comprehensive type definitions for the design system
 */

import { LucideIcon } from 'lucide-react'
import { themes, type ThemeName } from './tokens'

// Core theme types
export type Theme = typeof themes[ThemeName]
export type ThemeConfig = Theme
export type ComponentStyles = Record<string, string>

// Analysis Category Types
export interface AnalysisCategoryProps {
  categoryId: string
  children: React.ReactNode
  className?: string
}

export interface AnalysisCategoryHeaderProps {
  icon: LucideIcon
  title: string
  description: string
  count: number
  className?: string
}

export interface AnalysisCategoryGridProps {
  children: React.ReactNode
  className?: string
}

export interface AnalysisItemProps {
  name: string
  englishName: string
  description: string
  tooltip: string
  whenToUse: string
  example: string
  icon: LucideIcon
  onExecute: () => void
  className?: string
}

// Themed Tabs Types
export interface ThemedTabsProps {
  children: React.ReactNode
  defaultValue: string
  className?: string
}

export interface ThemedTabsListProps {
  children: React.ReactNode
  className?: string
}

export interface ThemedTabsTriggerProps {
  value: string
  icon: LucideIcon
  title: string
  className?: string
}

export interface ThemedTabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

// Statistical Analysis Types
export interface StatisticalTest {
  name: string
  englishName: string
  description: string
  tooltip: string
  whenToUse: string
  example: string
  icon: LucideIcon
  category: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  requirements?: string[]
  assumptions?: string[]
}

export interface StatisticalCategory {
  id: string
  title: string
  description: string
  icon: LucideIcon
  tests: StatisticalTest[]
  color?: string
  bgColor?: string
  borderColor?: string
}

// Theme Context Types
export interface ThemeContextValue {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  getStyles: (component: string, variant?: string) => string
  currentTheme: Theme
}

// Component Variant Types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'
export type CardVariant = 'default' | 'hover' | 'active' | 'loading'
export type TabVariant = 'default' | 'active'

// Responsive Types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>

// Animation Types
export interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
}

// Accessibility Types
export interface A11yProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  role?: string
}

// Design Token Types
export interface DesignTokens {
  colors: Record<string, string>
  spacing: Record<string, string>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
  typography?: Record<string, string>
  zIndex?: Record<string, number>
}

// Export utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type ExtractKeys<T> = keyof T
export type ExtractValues<T> = T[keyof T]