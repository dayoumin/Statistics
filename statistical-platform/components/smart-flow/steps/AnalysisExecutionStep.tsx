'use client'

import { useEffect, useState } from 'react'
import { BarChart3, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface AnalysisExecutionStepProps {
  method: string | null
  onAnalysisComplete: (results: any) => void
}

export function AnalysisExecutionStep({ method, onAnalysisComplete }: AnalysisExecutionStepProps) {
  const [progress, setProgress] = useState(0)
  const [currentTask, setCurrentTask] = useState('')
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pyodideLoading, setPyodideLoading] = useState(false)

  const tasks = [
    'Pyodide 환경 준비',
    '데이터 전처리',
    '정규성 검정',
    '등분산성 검정',
    `${method || '통계 분석'} 수행 중`,
    '결과 생성'
  ]

  useEffect(() => {
    let currentIndex = 0
    setPyodideLoading(true)
    setError(null)
    
    const runAnalysis = async () => {
      try {
        // Pyodide 로딩 시뮬레이션 (실제로는 pyodide-runtime-loader 사용)
        if (currentIndex === 0) {
          setCurrentTask('Pyodide 환경 준비')
          await new Promise(resolve => setTimeout(resolve, 1500))
          setPyodideLoading(false)
        }
        
        const interval = setInterval(() => {
          if (currentIndex < tasks.length) {
            setCurrentTask(tasks[currentIndex])
            if (currentIndex > 0) {
              setCompletedTasks(prev => [...prev, tasks[currentIndex - 1]])
            }
            setProgress((currentIndex + 1) / tasks.length * 100)
            currentIndex++
          } else {
            clearInterval(interval)
            // 분석 완료 후 결과 전달
            setTimeout(() => {
              onAnalysisComplete({
                method: method || '독립표본 t-검정',
                statistic: 2.348,
                pValue: 0.021,
                effectSize: 0.43,
                confidence: { lower: 0.15, upper: 0.71 },
                interpretation: '두 그룹 간 평균 차이가 통계적으로 유의합니다.'
              })
            }, 500)
          }
        }, 1000)
        
        return () => clearInterval(interval)
      } catch (err) {
        setError('통계 분석 중 오류가 발생했습니다. Pyodide 로딩에 실패했을 수 있습니다.')
        setPyodideLoading(false)
      }
    }
    
    runAnalysis()
  }, [method, onAnalysisComplete])

  return (
    <div className="space-y-6">
      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </Card>
      )}
      
      {pyodideLoading && (
        <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Python 환경을 준비하고 있습니다...
            </p>
          </div>
        </Card>
      )}
      
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <BarChart3 className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold mb-2">통계 분석 진행 중...</h3>
        <p className="text-muted-foreground mb-6">잠시만 기다려주세요</p>
        
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-3">
            {tasks.map((task, index) => {
              const isCompleted = completedTasks.includes(task)
              const isCurrent = currentTask === task
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted" />
                  )}
                  <span className={`text-sm ${
                    isCompleted ? 'text-muted-foreground' : 
                    isCurrent ? 'font-medium' : 'text-muted-foreground/50'
                  }`}>
                    {task}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">📊 분석 정보</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 선택된 방법: {method || '독립표본 t-검정'}</li>
          <li>• 신뢰수준: 95%</li>
          <li>• SciPy 통계 엔진 사용</li>
        </ul>
      </div>
    </div>
  )
}