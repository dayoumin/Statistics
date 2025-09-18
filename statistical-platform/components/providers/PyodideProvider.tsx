'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { PyodideStatisticsService } from '@/lib/services/pyodide-statistics'

interface PyodideContextType {
  isLoaded: boolean
  isLoading: boolean
  error: string | null
  service: PyodideStatisticsService | null
}

const PyodideContext = createContext<PyodideContextType>({
  isLoaded: false,
  isLoading: false,
  error: null,
  service: null
})

export function usePyodide() {
  return useContext(PyodideContext)
}

const SUCCESS_DISPLAY_DURATION = 3000 // 3초 후 자동 숨김

export function PyodideProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [service, setService] = useState<PyodideStatisticsService | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // 성공 메시지 자동 숨김
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, SUCCESS_DISPLAY_DURATION)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  useEffect(() => {
    // 중복 초기화 방지
    if (isLoading || isLoaded) return

    // 앱 시작 시 자동으로 Pyodide 초기화
    const initPyodide = async () => {

      console.log('[PyodideProvider] Pyodide 자동 초기화 시작...')
      setIsLoading(true)
      setError(null)

      try {
        const pyodideService = PyodideStatisticsService.getInstance()
        await pyodideService.initialize()

        setService(pyodideService)
        setIsLoaded(true)
        setShowSuccess(true) // 성공 메시지 표시
        console.log('[PyodideProvider] Pyodide 초기화 완료! 이제 통계 분석을 즉시 사용할 수 있습니다.')
      } catch (err) {
        console.error('[PyodideProvider] Pyodide 초기화 실패:', err)
        setError(err instanceof Error ? err.message : 'Pyodide 초기화 실패')
      } finally {
        setIsLoading(false)
      }
    }

    // 컴포넌트 마운트 후 약간의 지연을 두고 초기화 시작
    // 이렇게 하면 메인 UI 렌더링을 방해하지 않음
    const timer = setTimeout(() => {
      initPyodide()
    }, 100)

    return () => clearTimeout(timer)
  }, [isLoading, isLoaded]) // 의존성 추가로 중복 실행 방지

  // 로딩 상태를 화면 하단에 작은 인디케이터로 표시
  return (
    <PyodideContext.Provider value={{ isLoaded, isLoading, error, service }}>
      {children}
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-sm z-50">
          <div className="flex items-center gap-2 text-sm">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
            <span className="text-muted-foreground">통계 엔진 로딩중...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 shadow-sm z-50">
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <span>⚠️ 통계 엔진 로드 실패</span>
          </div>
        </div>
      )}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 shadow-sm z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <span>✅ 통계 엔진 준비 완료</span>
          </div>
        </div>
      )}
    </PyodideContext.Provider>
  )
}