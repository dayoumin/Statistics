'use client'

import { ReactNode } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { PyodideProvider } from './PyodideProvider'

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <PyodideProvider>
        {children}
      </PyodideProvider>
    </NextThemesProvider>
  )
}