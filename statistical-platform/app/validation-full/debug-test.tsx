'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PyodideStatisticsService } from '@/lib/services/pyodide-statistics'

export default function DebugTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  // Singleton 인스턴스를 한번만 가져옴
  const pyodideService = useMemo(() => PyodideStatisticsService.getInstance(), [])

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📝'
    const log = `[${timestamp}] ${prefix} ${message}`
    setLogs(prev => [...prev, log])
    console.log(log)
  }

  const runDebugTest = async () => {
    setStatus('running')
    setLogs([])

    addLog('=== Pyodide 초기화 디버깅 시작 ===', 'info')

    try {
      // Step 1: PyodideService 인스턴스 확인
      addLog('Step 1: PyodideService 인스턴스 확인')

      if (!pyodideService) {
        throw new Error('PyodideService 인스턴스를 가져올 수 없음')
      }
      addLog('PyodideService 인스턴스 OK', 'success')
      addLog(`인스턴스 타입: ${typeof pyodideService}`)

      // Step 2: 초기화 상태 확인
      addLog('Step 2: 초기화 상태 확인')
      const isInitialized = pyodideService.isInitialized()
      addLog(`초기화 상태: ${isInitialized}`)

      if (!isInitialized) {
        addLog('Step 2.1: Pyodide 초기화 시작')
        try {
          await pyodideService.initialize()
          addLog('Pyodide 초기화 성공', 'success')
        } catch (initError) {
          addLog(`초기화 오류: ${initError instanceof Error ? initError.message : String(initError)}`, 'error')
          if (initError instanceof Error && initError.stack) {
            addLog(`Stack: ${initError.stack}`, 'error')
          }
          throw initError
        }
      }

      // Step 2.2: 초기화 후 재확인
      addLog('Step 2.2: 초기화 후 상태 재확인')
      const isNowInitialized = pyodideService.isInitialized()
      addLog(`현재 초기화 상태: ${isNowInitialized}`, isNowInitialized ? 'success' : 'error')

      // Step 3: 간단한 Python 코드 실행 테스트
      addLog('Step 3: Python 코드 직접 실행 테스트')

      // window.pyodide 확인
      const windowPyodide = (window as any).pyodide
      addLog(`window.pyodide 타입: ${typeof windowPyodide}`)

      if (windowPyodide) {
        addLog('window.pyodide 존재 확인', 'success')
        addLog(`pyodide.version: ${windowPyodide.version || 'unknown'}`)

        const testCode = `
import sys
print(f"Python version: {sys.version}")
1 + 1
`
        const result = await (window as any).pyodide.runPythonAsync(testCode)
        addLog(`Python 실행 결과: ${result}`, 'success')
      } else {
        addLog('window.pyodide가 없음', 'error')
      }

      // Step 4: NumPy 테스트
      addLog('Step 4: NumPy 테스트')
      const numpyTest = await (window as any).pyodide.runPythonAsync(`
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
f"NumPy mean: {np.mean(arr)}"
`)
      addLog(numpyTest, 'success')

      // Step 5: SciPy 테스트
      addLog('Step 5: SciPy 테스트')
      const scipyTest = await (window as any).pyodide.runPythonAsync(`
from scipy import stats
data = [1, 2, 3, 4, 5]
stat, pval = stats.shapiro(data)
f"Shapiro test: W={stat:.4f}, p={pval:.4f}"
`)
      addLog(scipyTest, 'success')

      // Step 6: PyodideService 메서드 테스트
      addLog('Step 6: PyodideService.descriptiveStats 테스트')

      try {
        const testData = [1, 2, 3, 4, 5]
        addLog(`테스트 데이터: ${testData.join(', ')}`)

        const descResult = await pyodideService.descriptiveStats(testData)
        addLog(`결과: mean=${descResult.mean}, median=${descResult.median}, std=${descResult.std}`, 'success')
      } catch (error) {
        addLog(`descriptiveStats 오류: ${error instanceof Error ? error.message : String(error)}`, 'error')

        // 오류 상세 분석
        if (error instanceof Error && error.stack) {
          addLog(`Stack trace: ${error.stack}`, 'error')
        }
      }

      // Step 7: Python 함수 직접 호출 테스트
      addLog('Step 7: Python 함수 직접 정의 및 호출')
      const directTest = await (window as any).pyodide.runPythonAsync(`
def test_function(data):
    import numpy as np
    return {
        'mean': float(np.mean(data)),
        'std': float(np.std(data))
    }

import json
result = test_function([1, 2, 3, 4, 5])
json.dumps(result)
`)
      addLog(`직접 호출 결과: ${directTest}`, 'success')

      setStatus('success')
      addLog('🎉 모든 디버그 테스트 완료!', 'success')

    } catch (error) {
      setStatus('error')
      addLog(`전체 오류: ${error instanceof Error ? error.message : String(error)}`, 'error')

      if (error instanceof Error && error.stack) {
        addLog(`Stack: ${error.stack}`, 'error')
      }
    }
  }

  // 자동 실행
  useEffect(() => {
    // 페이지 로드 후 2초 대기 후 자동 실행
    const timer = setTimeout(() => {
      runDebugTest()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>디버그 테스트</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant={
              status === 'success' ? 'default' :
              status === 'error' ? 'destructive' :
              status === 'running' ? 'secondary' :
              'outline'
            }>
              {status === 'idle' ? '대기' :
               status === 'running' ? '실행 중...' :
               status === 'success' ? '성공' : '오류'}
            </Badge>
            <Button onClick={runDebugTest} disabled={status === 'running'}>
              다시 테스트
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs space-y-1 max-h-[600px] overflow-y-auto">
            {logs.length === 0 ? (
              <div>2초 후 자동 실행됩니다...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className={
                  log.includes('❌') ? 'text-red-400' :
                  log.includes('✅') ? 'text-green-400' :
                  'text-gray-300'
                }>
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}