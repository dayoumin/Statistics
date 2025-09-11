import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '수산과학 통계 분석 플랫폼',
  description: '국립수산과학원 통계 분석 도구',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  수산과학 통계 분석 플랫폼
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-700 hover:text-blue-600">
                  홈
                </a>
                <a href="/statistics" className="text-gray-700 hover:text-blue-600">
                  통계 분석
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  )
}