'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function TestPyodidePage() {
  const [status, setStatus] = useState<string>('초기화 대기 중...')
  const [logs, setLogs] = useState<string[]>([])
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null)

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${time}] ${message}`])
    console.log(message)
  }

  useEffect(() => {
    testPyodide()
  }, [])

  const testPyodide = async () => {
    try {
      setStatus('Pyodide 로딩 중...')
      addLog('테스트 시작')

      // 1단계: 스크립트 로드
      addLog('1단계: Pyodide 스크립트 로드 시도...')

      if (!(window as any).loadPyodide) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'

        await new Promise((resolve, reject) => {
          script.onload = () => {
            addLog('✓ Pyodide 스크립트 로드 성공')
            resolve(true)
          }
          script.onerror = () => {
            addLog('✗ Pyodide 스크립트 로드 실패')
            reject(new Error('스크립트 로드 실패'))
          }
          document.head.appendChild(script)
        })
      }

      // 2단계: Pyodide 초기화
      addLog('2단계: Pyodide 초기화 중...')
      setStatus('Pyodide 초기화 중...')

      const pyodide = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      })
      addLog('✓ Pyodide 초기화 성공')

      // 3단계: 패키지 로드
      addLog('3단계: NumPy 로드 중...')
      setStatus('NumPy 패키지 로딩 중...')
      await pyodide.loadPackage(['numpy'])
      addLog('✓ NumPy 로드 성공')

      // 4단계: 간단한 테스트
      addLog('4단계: Python 코드 실행 테스트...')
      setStatus('Python 테스트 실행 중...')

      const result = await pyodide.runPythonAsync(`
        import numpy as np
        data = [1, 2, 3, 4, 5]
        mean = np.mean(data)
        f"평균: {mean}"
      `)

      addLog(`✓ Python 실행 결과: ${result}`)

      setStatus('✅ Pyodide 테스트 성공!')
      setIsSuccess(true)
      addLog('🎉 모든 테스트 통과!')

    } catch (error) {
      setStatus('❌ Pyodide 테스트 실패')
      setIsSuccess(false)
      addLog(`❌ 오류: ${error instanceof Error ? error.message : String(error)}`)
      console.error('Pyodide 테스트 실패:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pyodide 테스트
            {isSuccess === true && <CheckCircle2 className="w-6 h-6 text-green-600" />}
            {isSuccess === false && <XCircle className="w-6 h-6 text-red-600" />}
            {isSuccess === null && <AlertCircle className="w-6 h-6 text-yellow-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 현재 상태 */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-lg font-medium">{status}</div>
          </div>

          {/* 로그 */}
          <div className="space-y-2">
            <h3 className="font-semibold">실행 로그:</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div>로그 대기 중...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))
              )}
            </div>
          </div>

          {/* 재시도 버튼 */}
          <Button
            onClick={() => {
              setLogs([])
              setIsSuccess(null)
              testPyodide()
            }}
            variant="outline"
          >
            다시 테스트
          </Button>

          {/* 브라우저 콘솔 안내 */}
          <div className="text-sm text-muted-foreground">
            ℹ️ 브라우저 개발자 도구 콘솔(F12)에서 더 자세한 로그를 확인할 수 있습니다.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}