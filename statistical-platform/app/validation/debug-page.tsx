'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function PyodideDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [pyodideStatus, setPyodideStatus] = useState<'loading' | 'success' | 'error'>('loading')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[PyodideDebug] ${message}`)
  }

  useEffect(() => {
    const initPyodide = async () => {
      try {
        addLog('시작: Pyodide 초기화...')

        // 1. window.loadPyodide 확인
        if (typeof window === 'undefined') {
          throw new Error('브라우저 환경이 아님')
        }
        addLog('✓ 브라우저 환경 확인')

        // 2. Pyodide 스크립트 로드
        if (!window.loadPyodide) {
          addLog('Pyodide 스크립트 로딩 시작...')
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
          script.async = true

          await new Promise((resolve, reject) => {
            script.onload = () => {
              addLog('✓ Pyodide 스크립트 로드 완료')
              resolve(true)
            }
            script.onerror = (e) => {
              addLog('✗ Pyodide 스크립트 로드 실패: ' + e)
              reject(e)
            }
            document.head.appendChild(script)
          })
        } else {
          addLog('✓ Pyodide 스크립트 이미 로드됨')
        }

        // 3. Pyodide 초기화
        addLog('Pyodide 인스턴스 생성 중...')
        const pyodide = await (window as any).loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
        })
        addLog('✓ Pyodide 인스턴스 생성 완료')

        // 4. 패키지 로드
        addLog('Python 패키지 로딩 중... (numpy, scipy, pandas)')
        await pyodide.loadPackage(['numpy', 'scipy', 'pandas'])
        addLog('✓ 패키지 로드 완료')

        // 5. 간단한 테스트
        addLog('Python 테스트 실행 중...')
        const result = await pyodide.runPythonAsync(`
          import numpy as np
          from scipy import stats

          # 간단한 계산 테스트
          data = [1, 2, 3, 4, 5]
          mean = np.mean(data)
          std = np.std(data)

          # Shapiro-Wilk 테스트
          stat, pvalue = stats.shapiro(data)

          f"평균: {mean}, 표준편차: {std}, Shapiro W: {stat:.4f}, p-value: {pvalue:.4f}"
        `)
        addLog('✓ Python 테스트 결과: ' + result)

        setPyodideStatus('success')
        addLog('🎉 Pyodide 초기화 성공!')

      } catch (error) {
        setPyodideStatus('error')
        addLog('❌ 오류 발생: ' + (error instanceof Error ? error.message : String(error)))
        console.error('Pyodide 초기화 실패:', error)
      }
    }

    initPyodide()
  }, [])

  // 수동 테스트 함수
  const runManualTest = async () => {
    try {
      addLog('수동 테스트 시작...')

      if (!window.pyodide) {
        throw new Error('Pyodide가 초기화되지 않음')
      }

      const result = await window.pyodide.runPythonAsync(`
        import numpy as np
        from scipy import stats

        # t-test 예시
        group1 = [1, 2, 3, 4, 5]
        group2 = [2, 3, 4, 5, 6]

        t_stat, p_value = stats.ttest_ind(group1, group2)
        f"t-statistic: {t_stat:.4f}, p-value: {p_value:.4f}"
      `)

      addLog('✓ 수동 테스트 결과: ' + result)
    } catch (error) {
      addLog('❌ 수동 테스트 실패: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Pyodide 디버그 페이지</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant={
              pyodideStatus === 'success' ? 'default' :
              pyodideStatus === 'error' ? 'destructive' :
              'secondary'
            }>
              상태: {
                pyodideStatus === 'success' ? '성공' :
                pyodideStatus === 'error' ? '오류' :
                '로딩 중...'
              }
            </Badge>
            <Button
              onClick={runManualTest}
              size="sm"
              disabled={pyodideStatus !== 'success'}
            >
              수동 테스트 실행
            </Button>
            <Button
              onClick={() => window.location.reload()}
              size="sm"
              variant="outline"
            >
              페이지 새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
            <div className="space-y-1">
              {logs.length === 0 ? (
                <div>로그 대기 중...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}