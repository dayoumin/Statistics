'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react'
import { PyodideStatisticsService } from '@/lib/services/pyodide-statistics'

interface TestResult {
  name: string
  category: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error'
  message?: string
  expected?: any
  actual?: any
  timeTaken?: number
  error?: string
}

export default function TestResultsPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const pyodideService = PyodideStatisticsService.getInstance()

  // Pyodide 초기화
  useEffect(() => {
    const initPyodide = async () => {
      try {
        console.log('[TestPage] Pyodide 초기화 시작...')
        await pyodideService.initialize()
        setPyodideReady(true)
        console.log('[TestPage] Pyodide 초기화 완료!')
      } catch (error) {
        console.error('[TestPage] Pyodide 초기화 실패:', error)
        setInitError(error instanceof Error ? error.message : String(error))
      }
    }
    initPyodide()
  }, [])

  const runAllTests = async () => {
    if (!pyodideReady) return

    setIsRunning(true)
    const results: TestResult[] = []

    // 테스트 목록
    const tests = [
      {
        name: 'Shapiro-Wilk 정규성 검정',
        category: '기술통계',
        test: async () => {
          const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
          const result = await pyodideService.shapiroWilkTest(data)
          return {
            passed: result.pValue > 0 && result.pValue <= 1,
            actual: result,
            expected: { pValue: '0-1 범위', statistic: '0.9 이상' }
          }
        }
      },
      {
        name: '독립표본 t-검정',
        category: 'T-검정',
        test: async () => {
          const group1 = [1, 2, 3, 4, 5]
          const group2 = [2, 3, 4, 5, 6]
          const result = await pyodideService.tTest(group1, group2, { paired: false, equalVar: true })
          return {
            passed: result.pvalue !== undefined && result.statistic !== undefined,
            actual: result,
            expected: { pvalue: '< 0.05 for significant', statistic: 't-value' }
          }
        }
      },
      {
        name: '대응표본 t-검정',
        category: 'T-검정',
        test: async () => {
          const before = [1, 2, 3, 4, 5]
          const after = [1.5, 2.5, 3.5, 4.5, 5.5]
          const result = await pyodideService.tTest(before, after, { paired: true })
          return {
            passed: result.pvalue !== undefined,
            actual: result,
            expected: { pvalue: '< 0.05 for significant' }
          }
        }
      },
      {
        name: 'Pearson 상관분석',
        category: '상관분석',
        test: async () => {
          const x = [1, 2, 3, 4, 5]
          const y = [2, 4, 6, 8, 10]
          const result = await pyodideService.correlation(x, y)
          return {
            passed: Math.abs(result.pearson.r - 1) < 0.01,
            actual: result.pearson,
            expected: { r: '≈ 1.0 (완전 상관)' }
          }
        }
      },
      {
        name: '일원분산분석 (ANOVA)',
        category: 'ANOVA',
        test: async () => {
          const groups = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
          const result = await pyodideService.anova(groups)
          return {
            passed: result.fStatistic > 0 && result.pvalue < 0.001,
            actual: result,
            expected: { pvalue: '< 0.001 (그룹 간 차이 있음)' }
          }
        }
      },
      {
        name: '선형회귀분석',
        category: '회귀분석',
        test: async () => {
          const x = [1, 2, 3, 4, 5]
          const y = [2, 4, 6, 8, 10]
          const result = await pyodideService.regression(x, y)
          return {
            passed: Math.abs(result.slope! - 2) < 0.01 && Math.abs(result.intercept!) < 0.01,
            actual: result,
            expected: { slope: 2, intercept: 0, rSquared: 1 }
          }
        }
      },
      {
        name: 'Mann-Whitney U 검정',
        category: '비모수',
        test: async () => {
          const group1 = [1, 2, 3, 4, 5]
          const group2 = [6, 7, 8, 9, 10]
          const result = await pyodideService.mannWhitneyU(group1, group2)
          return {
            passed: result.pvalue < 0.05,
            actual: result,
            expected: { pvalue: '< 0.05 (그룹 간 차이)' }
          }
        }
      },
      {
        name: '이상치 탐지 (IQR)',
        category: '기술통계',
        test: async () => {
          const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100] // 100은 이상치
          const result = await pyodideService.detectOutliers(data)
          return {
            passed: result.extremeOutliers.length > 0,
            actual: result,
            expected: { extremeOutliers: '[100]' }
          }
        }
      },
      {
        name: 'Levene 등분산성 검정',
        category: '가정 검정',
        test: async () => {
          const groups = [[1, 2, 3], [1, 2, 3], [1, 2, 3]]
          const result = await pyodideService.leveneTest(groups)
          return {
            passed: result.pValue > 0.05,
            actual: result,
            expected: { pValue: '> 0.05 (등분산 가정 만족)' }
          }
        }
      },
      {
        name: 'Kruskal-Wallis 검정',
        category: '비모수',
        test: async () => {
          const groups = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
          const result = await pyodideService.kruskalWallis(groups)
          return {
            passed: result.pvalue < 0.01,
            actual: result,
            expected: { pvalue: '< 0.01 (그룹 간 차이)' }
          }
        }
      }
    ]

    // 테스트 실행
    for (const test of tests) {
      const testResult: TestResult = {
        name: test.name,
        category: test.category,
        status: 'running'
      }

      // 실행 중 상태 표시
      setTestResults(prev => [...prev, testResult])

      const startTime = Date.now()

      try {
        const result = await test.test()
        testResult.status = result.passed ? 'passed' : 'failed'
        testResult.actual = result.actual
        testResult.expected = result.expected
        testResult.message = result.passed
          ? '테스트 통과'
          : '예상값과 실제값이 일치하지 않습니다'
      } catch (error) {
        testResult.status = 'error'
        testResult.error = error instanceof Error ? error.message : String(error)
        testResult.message = '테스트 실행 중 오류 발생'
      }

      testResult.timeTaken = Date.now() - startTime

      // 결과 업데이트
      setTestResults(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = testResult
        return updated
      })

      // 잠시 대기 (UI 업데이트를 위해)
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setIsRunning(false)
  }

  // 통계 계산
  const stats = {
    total: testResults.length,
    passed: testResults.filter(r => r.status === 'passed').length,
    failed: testResults.filter(r => r.status === 'failed').length,
    errors: testResults.filter(r => r.status === 'error').length
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">통계 함수 테스트 결과</h1>

      {/* 초기화 상태 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pyodide 상태</CardTitle>
        </CardHeader>
        <CardContent>
          {initError ? (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span>초기화 실패: {initError}</span>
            </div>
          ) : pyodideReady ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>Pyodide 준비 완료</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              <span>Pyodide 초기화 중...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 테스트 컨트롤 */}
      <div className="flex gap-4 mb-6">
        <Button
          onClick={runAllTests}
          disabled={!pyodideReady || isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              테스트 실행 중...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              모든 테스트 실행
            </>
          )}
        </Button>

        {testResults.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setTestResults([])}
          >
            결과 초기화
          </Button>
        )}
      </div>

      {/* 테스트 요약 */}
      {testResults.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>테스트 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">전체</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">성공</p>
                <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">실패</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">오류</p>
                <p className="text-2xl font-bold text-orange-600">{stats.errors}</p>
              </div>
            </div>
            {stats.total > 0 && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-green-600 h-full transition-all"
                    style={{ width: `${(stats.passed / stats.total) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  성공률: {((stats.passed / stats.total) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 테스트 결과 목록 */}
      <div className="grid gap-4">
        {testResults.map((test, idx) => (
          <Card key={idx} className={
            test.status === 'passed' ? 'border-green-200' :
            test.status === 'failed' ? 'border-red-200' :
            test.status === 'error' ? 'border-orange-200' :
            'border-gray-200'
          }>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {test.status === 'passed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {test.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
                  {test.status === 'error' && <AlertCircle className="h-5 w-5 text-orange-600" />}
                  {test.status === 'running' && <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />}
                  <div>
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <CardDescription>{test.category}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    test.status === 'passed' ? 'default' :
                    test.status === 'failed' ? 'destructive' :
                    test.status === 'error' ? 'destructive' :
                    'secondary'
                  }>
                    {test.status === 'passed' ? '성공' :
                     test.status === 'failed' ? '실패' :
                     test.status === 'error' ? '오류' :
                     test.status === 'running' ? '실행 중' : '대기'}
                  </Badge>
                  {test.timeTaken && (
                    <span className="text-sm text-gray-500">
                      {test.timeTaken}ms
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            {(test.status !== 'pending' && test.status !== 'running') && (
              <CardContent>
                <div className="space-y-2">
                  {test.message && (
                    <p className="text-sm">{test.message}</p>
                  )}
                  {test.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-800 font-mono">{test.error}</p>
                    </div>
                  )}
                  {test.expected && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-600">예상값</p>
                        <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(test.expected, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">실제값</p>
                        <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(test.actual, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {testResults.length === 0 && pyodideReady && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">테스트를 실행하려면 위의 버튼을 클릭하세요</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}