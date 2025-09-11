"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, Loader2, Play } from "lucide-react"
import { type PyodideState } from "@/lib/pyodide-runtime-loader"
import { PYODIDE } from "@/lib/constants"

interface PyodideStatusCardProps {
  pyodideState: PyodideState
  onStartLoading: () => void
}

export function PyodideStatusCard({ pyodideState, onStartLoading }: PyodideStatusCardProps) {
  const getLoadingProgress = () => {
    switch (pyodideState.status) {
      case 'idle': return PYODIDE.LOADING_PROGRESS.IDLE
      case 'loading': return pyodideState.progress.includes('SciPy') 
        ? PYODIDE.LOADING_PROGRESS.SCIPY 
        : PYODIDE.LOADING_PROGRESS.BASIC
      case 'ready': return PYODIDE.LOADING_PROGRESS.READY
      case 'error': return PYODIDE.LOADING_PROGRESS.IDLE
      default: return PYODIDE.LOADING_PROGRESS.IDLE
    }
  }

  // ready 상태가 아닐 때만 카드 표시
  if (pyodideState.status === 'ready') {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {pyodideState.status === 'loading' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : pyodideState.status === 'error' ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <Play className="h-5 w-5" />
          )}
          통계 분석 엔진 상태
        </CardTitle>
        <CardDescription>
          {pyodideState.status === 'idle' && "고급 통계 분석을 위해 SciPy 엔진을 로드하세요"}
          {pyodideState.status === 'loading' && "Python 통계 엔진을 초기화하고 있습니다..."}
          {pyodideState.status === 'ready' && "모든 통계 분석 기능이 준비되었습니다"}
          {pyodideState.status === 'error' && "엔진 로딩 중 오류가 발생했습니다"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pyodideState.status === 'idle' && (
          <Button onClick={onStartLoading} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            SciPy 통계 엔진 로드 (15-30초)
          </Button>
        )}
        
        {pyodideState.status === 'loading' && (
          <div className="space-y-3">
            <Progress value={getLoadingProgress()} className="w-full" />
            <p className="text-sm text-muted-foreground">{pyodideState.progress}</p>
            <p className="text-xs text-blue-600">
              💡 첫 로딩 시에만 시간이 걸립니다. 이후에는 즉시 사용 가능합니다.
            </p>
          </div>
        )}
        
        {pyodideState.status === 'ready' && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">준비 완료! 이제 모든 통계 분석을 사용할 수 있습니다.</span>
          </div>
        )}
        
        {pyodideState.status === 'error' && (
          <div className="space-y-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {pyodideState.error}
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={onStartLoading}>
              다시 시도
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}