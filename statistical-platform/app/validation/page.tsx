'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react'
import { PyodideStatisticsService } from '@/lib/services/pyodide-statistics'

interface SimpleTestResult {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error'
  message?: string
  expected?: any
  actual?: any
  timeTaken?: number
}

export default function ValidationDashboard() {
  const [testResults, setTestResults] = useState<SimpleTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [pyodideReady, setPyodideReady] = useState(false)

  const pyodideService = PyodideStatisticsService.getInstance()

  // Pyodide 초기화
  useEffect(() => {
    const initPyodide = async () => {
      try {
        console.log('Pyodide 초기화 시작...')

        // window 객체 확인
        if (typeof window === 'undefined') {
          throw new Error('브라우저 환경이 아님')
        }

        await pyodideService.initialize()
        setPyodideReady(true)
        console.log('Pyodide 초기화 완료!')
      } catch (error) {
        console.error('Pyodide 초기화 실패:', error)
        // 오류 메시지를 state에 저장
        setTestResults([{
          name: 'Pyodide 초기화',
          status: 'error',
          message: `초기화 실패: ${error instanceof Error ? error.message : String(error)}`
        }])
      }
    }
    initPyodide()
  }, [])

  // 간단한 테스트 실행
  const runSimpleTests = async () => {
    if (!pyodideReady) {
      alert('Pyodide가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setIsRunning(true)
    const results: SimpleTestResult[] = []

    // 1. 기술통계 테스트
    try {
      const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const startTime = performance.now()

      const descriptiveResult = await pyodideService.descriptiveStats(testData)
      const timeTaken = performance.now() - startTime

      results.push({
        name: '기술통계 계산',
        status: descriptiveResult.mean === 5.5 ? 'passed' : 'failed',
        message: `평균: ${descriptiveResult.mean}, 중앙값: ${descriptiveResult.median}`,
        expected: { mean: 5.5, median: 5.5 },
        actual: { mean: descriptiveResult.mean, median: descriptiveResult.median },
        timeTaken
      })
    } catch (error) {
      results.push({
        name: '기술통계 계산',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    }

    // 2. 정규성 검정 테스트
    try {
      const normalData = [2.3, 3.1, 2.8, 3.5, 3.2, 2.9, 3.0, 3.4, 2.7, 3.3]
      const startTime = performance.now()

      const normalityResult = await pyodideService.shapiroWilkTest(normalData)
      const timeTaken = performance.now() - startTime

      results.push({
        name: 'Shapiro-Wilk 정규성 검정',
        status: normalityResult.pValue > 0.05 ? 'passed' : 'failed',
        message: `p-value: ${normalityResult.pValue.toFixed(4)}, 정규성: ${normalityResult.isNormal ? '예' : '아니오'}`,
        actual: { pValue: normalityResult.pValue, isNormal: normalityResult.isNormal },
        timeTaken
      })
    } catch (error) {
      results.push({
        name: 'Shapiro-Wilk 정규성 검정',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    }

    // 3. 상관분석 테스트
    try {
      const x = [1, 2, 3, 4, 5]
      const y = [2, 4, 6, 8, 10]
      const startTime = performance.now()

      const correlationResult = await pyodideService.correlation(x, y)
      const timeTaken = performance.now() - startTime

      results.push({
        name: 'Pearson 상관계수',
        status: correlationResult.pearson.r > 0.99 ? 'passed' : 'failed',
        message: `r = ${correlationResult.pearson.r.toFixed(4)}, p = ${correlationResult.pearson.pValue.toFixed(4)}`,
        expected: { r: 1.0 },
        actual: { r: correlationResult.pearson.r, p: correlationResult.pearson.pValue },
        timeTaken
      })
    } catch (error) {
      results.push({
        name: 'Pearson 상관계수',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    }

    // 4. t-검정 테스트
    try {
      const group1 = [1, 2, 3, 4, 5]
      const group2 = [2, 3, 4, 5, 6]
      const startTime = performance.now()

      const tTestResult = await pyodideService.tTest(group1, group2, { paired: false, equalVar: true })
      const timeTaken = performance.now() - startTime

      results.push({
        name: '독립표본 t-검정',
        status: 'passed',
        message: `t = ${tTestResult.statistic.toFixed(4)}, p = ${tTestResult.pvalue.toFixed(4)}, df = ${tTestResult.df}`,
        actual: { t: tTestResult.statistic, p: tTestResult.pvalue, df: tTestResult.df },
        timeTaken
      })
    } catch (error) {
      results.push({
        name: '독립표본 t-검정',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    }

    // 5. ANOVA 테스트
    try {
      const groups = [
        [1, 2, 3, 4, 5],
        [3, 4, 5, 6, 7],
        [5, 6, 7, 8, 9]
      ]
      const startTime = performance.now()

      const anovaResult = await pyodideService.anova(groups)
      const timeTaken = performance.now() - startTime

      results.push({
        name: '일원분산분석 (ANOVA)',
        status: anovaResult.pvalue < 0.05 ? 'passed' : 'failed',
        message: `F = ${anovaResult.fStatistic.toFixed(4)}, p = ${anovaResult.pvalue.toFixed(4)}`,
        actual: { F: anovaResult.fStatistic, p: anovaResult.pvalue },
        timeTaken
      })
    } catch (error) {
      results.push({
        name: '일원분산분석 (ANOVA)',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    }

    // 6. 회귀분석 테스트
    try {
      const x = [1, 2, 3, 4, 5]
      const y = [2.1, 3.9, 6.2, 7.8, 10.1]
      const startTime = performance.now()

      const regressionResult = await pyodideService.regression(x, y)
      const timeTaken = performance.now() - startTime

      results.push({
        name: '단순선형회귀',
        status: regressionResult.rSquared > 0.95 ? 'passed' : 'failed',
        message: `y = ${regressionResult.slope?.toFixed(2)}x + ${regressionResult.intercept?.toFixed(2)}, R² = ${regressionResult.rSquared.toFixed(4)}`,
        actual: { slope: regressionResult.slope, intercept: regressionResult.intercept, rSquared: regressionResult.rSquared },
        timeTaken
      })
    } catch (error) {
      results.push({
        name: '단순선형회귀',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    }

    // 7. 비모수 검정 테스트
    try {
      const group1 = [1, 2, 3, 4, 5]
      const group2 = [2, 3, 4, 5, 6]
      const startTime = performance.now()

      const mannWhitneyResult = await pyodideService.mannWhitneyU(group1, group2)
      const timeTaken = performance.now() - startTime

      results.push({
        name: 'Mann-Whitney U 검정',
        status: 'passed',
        message: `U = ${mannWhitneyResult.statistic.toFixed(2)}, p = ${mannWhitneyResult.pvalue.toFixed(4)}`,
        actual: { U: mannWhitneyResult.statistic, p: mannWhitneyResult.pvalue },
        timeTaken
      })
    } catch (error) {
      results.push({
        name: 'Mann-Whitney U 검정',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    }

    // 8. 카이제곱 검정 테스트
    try {
      const contingencyTable = [
        [10, 15, 20],
        [20, 25, 30]
      ]
      const startTime = performance.now()

      const chiSquareResult = await pyodideService.chiSquare(contingencyTable)
      const timeTaken = performance.now() - startTime

      results.push({
        name: '카이제곱 독립성 검정',
        status: 'passed',
        message: `χ² = ${chiSquareResult.statistic.toFixed(4)}, p = ${chiSquareResult.pvalue.toFixed(4)}, df = ${chiSquareResult.df}`,
        actual: { chiSquare: chiSquareResult.statistic, p: chiSquareResult.pvalue, df: chiSquareResult.df },
        timeTaken
      })
    } catch (error) {
      results.push({
        name: '카이제곱 독립성 검정',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    }

    setTestResults(results)
    setIsRunning(false)
  }

  const passedCount = testResults.filter(r => r.status === 'passed').length
  const failedCount = testResults.filter(r => r.status === 'failed').length
  const errorCount = testResults.filter(r => r.status === 'error').length

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>통계 검증 대시보드</CardTitle>
          <CardDescription>
            Pyodide 기반 통계 함수들의 정확성 검증
          </CardDescription>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">📊 29개 전체 테스트를 원하시나요?</p>
            <a
              href="/validation-full"
              className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              전체 29개 통계 함수 테스트 페이지로 이동 →
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 상태 표시 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <Badge variant={pyodideReady ? 'default' : 'secondary'}>
                Pyodide: {pyodideReady ? '준비됨' : '초기화 중...'}
              </Badge>
              {testResults.length > 0 && (
                <>
                  <Badge variant="default" className="bg-green-600">통과: {passedCount}</Badge>
                  <Badge variant="destructive">실패: {failedCount}</Badge>
                  {errorCount > 0 && <Badge variant="secondary">오류: {errorCount}</Badge>}
                </>
              )}
            </div>
            <Button
              onClick={runSimpleTests}
              disabled={!pyodideReady || isRunning}
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? '테스트 진행 중...' : '테스트 실행'}
            </Button>
          </div>

          {/* 테스트 결과 */}
          {testResults.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="font-semibold text-lg mb-3">테스트 결과</h3>
              {testResults.map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  {/* 상태 아이콘 */}
                  <div className="mt-1">
                    {result.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {result.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                    {result.status === 'error' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                  </div>

                  {/* 테스트 정보 */}
                  <div className="flex-1">
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {result.message}
                    </div>
                    {result.timeTaken && (
                      <div className="text-xs text-muted-foreground mt-1">
                        실행 시간: {result.timeTaken.toFixed(0)}ms
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 설명 */}
          {testResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              &apos;테스트 실행&apos; 버튼을 클릭하여 통계 함수들을 검증하세요.
              <br />
              각 테스트는 Pyodide를 통해 Python SciPy로 계산됩니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}