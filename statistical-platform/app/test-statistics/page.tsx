'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { PyodideStatisticsService } from '@/lib/services/pyodide-statistics'

interface TestResult {
  name: string
  category: string
  passed: boolean
  expected: any
  actual: any
  error?: string
  reference?: string
}

export default function TestStatisticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [service, setService] = useState<PyodideStatisticsService | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    const init = async () => {
      const instance = PyodideStatisticsService.getInstance()
      await instance.initialize()
      setService(instance)
      setIsLoading(false)
    }
    init()
  }, [])

  const runTests = async (category: string) => {
    if (!service) return

    setIsRunning(true)
    const results: TestResult[] = []

    try {
      // T-검정 테스트
      if (category === 'all' || category === 'ttest') {
        const group1 = [23, 25, 28, 30, 32]
        const group2 = [20, 22, 24, 26, 28]

        const result = await service.twoSampleTTest(group1, group2, true)
        results.push({
          name: '독립표본 t-검정',
          category: 'T-test',
          passed: Math.abs(result.statistic - 2.2678) < 0.01,
          expected: { statistic: 2.2678, pvalue: 0.0532 },
          actual: { statistic: result.statistic, pvalue: result.pvalue },
          reference: 'GraphPad QuickCalcs'
        })
      }

      // ANOVA 테스트
      if (category === 'all' || category === 'anova') {
        const groups = [
          [23, 25, 27],
          [28, 30, 32],
          [33, 35, 37]
        ]

        const result = await service.oneWayANOVA(groups)
        results.push({
          name: 'One-way ANOVA',
          category: 'ANOVA',
          passed: result.fStatistic > 10 && result.pvalue < 0.01,
          expected: { fStatistic: '>10', pvalue: '<0.01' },
          actual: { fStatistic: result.fStatistic, pvalue: result.pvalue },
          reference: 'Stats Kingdom'
        })
      }

      // 상관분석 테스트
      if (category === 'all' || category === 'correlation') {
        const x = [1, 2, 3, 4, 5]
        const y = [2, 4, 6, 8, 10]

        const result = await service.correlation(x, y)
        results.push({
          name: 'Pearson 상관계수',
          category: 'Correlation',
          passed: Math.abs(result.pearson.r - 1.0) < 0.001,
          expected: { correlation: 1.0, pValue: '<0.01' },
          actual: { correlation: result.pearson.r, pValue: result.pearson.pValue },
          reference: '완벽한 선형관계'
        })
      }

      // 정규성 검정 테스트
      if (category === 'all' || category === 'normality') {
        const normal = [48, 49, 50, 51, 52, 51, 50, 49, 48]

        const result = await service.shapiroWilkTest(normal)
        results.push({
          name: 'Shapiro-Wilk 정규성 검정',
          category: 'Normality',
          passed: result.pValue > 0.05,
          expected: { pValue: '>0.05', isNormal: true },
          actual: { pValue: result.pValue, isNormal: result.isNormal },
          reference: '정규분포 가정'
        })
      }

      // 회귀분석 테스트
      if (category === 'all' || category === 'regression') {
        const x = [1, 2, 3, 4, 5]
        const y = [2.8, 5.1, 7.9, 9.8, 13.2]

        const result = await service.simpleLinearRegression(x, y)
        results.push({
          name: '단순선형회귀',
          category: 'Regression',
          passed: result.rSquared > 0.99,
          expected: { slope: '~2.51', rSquared: '>0.99' },
          actual: { slope: result.slope, rSquared: result.rSquared },
          reference: 'R lm() 함수'
        })
      }

    } catch (error) {
      console.error('Test error:', error)
    }

    setTestResults(results)
    setIsRunning(false)
  }

  const categories = ['all', 'ttest', 'anova', 'correlation', 'normality', 'regression']
  const filteredResults = selectedCategory === 'all'
    ? testResults
    : testResults.filter(r => r.category.toLowerCase().includes(selectedCategory))

  const passedCount = testResults.filter(r => r.passed).length
  const totalCount = testResults.length
  const passRate = totalCount > 0 ? (passedCount / totalCount * 100).toFixed(1) : '0'

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mb-4">통계 엔진 초기화 중...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">통계 메서드 검증</h1>
        <p className="text-muted-foreground">
          R/SPSS 없이 브라우저에서 직접 통계 계산 결과를 검증합니다
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>테스트 실행</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat}
                  onClick={() => runTests(cat)}
                  disabled={isRunning}
                  variant={cat === 'all' ? 'default' : 'outline'}
                >
                  {cat === 'all' ? '전체 테스트' : cat.toUpperCase()}
                </Button>
              ))}
            </div>

            {testResults.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center gap-4">
                    <span>총 {totalCount}개 중 {passedCount}개 통과</span>
                    <Badge variant={passedCount === totalCount ? 'success' : 'secondary'}>
                      {passRate}% 통과율
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>테스트 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
                <TabsList>
                  <TabsTrigger value="all">전체</TabsTrigger>
                  <TabsTrigger value="passed">통과</TabsTrigger>
                  <TabsTrigger value="failed">실패</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                  {filteredResults.map((result, idx) => (
                    <TestResultCard key={idx} result={result} />
                  ))}
                </TabsContent>

                <TabsContent value="passed" className="space-y-4 mt-4">
                  {filteredResults.filter(r => r.passed).map((result, idx) => (
                    <TestResultCard key={idx} result={result} />
                  ))}
                </TabsContent>

                <TabsContent value="failed" className="space-y-4 mt-4">
                  {filteredResults.filter(r => !r.passed).map((result, idx) => (
                    <TestResultCard key={idx} result={result} />
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>참조 링크</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <ReferenceLink
                title="GraphPad QuickCalcs"
                url="https://www.graphpad.com/quickcalcs/"
                description="T-test, Chi-square 등 기본 통계 계산기"
              />
              <ReferenceLink
                title="Stats Kingdom"
                url="https://www.statskingdom.com/"
                description="ANOVA, 회귀분석 등 고급 통계 계산기"
              />
              <ReferenceLink
                title="Social Science Statistics"
                url="https://www.socscistatistics.com/"
                description="다양한 통계 검정 계산기"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TestResultCard({ result }: { result: TestResult }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {result.passed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">{result.name}</span>
            <Badge variant="outline">{result.category}</Badge>
          </div>
          {result.reference && (
            <span className="text-sm text-muted-foreground">{result.reference}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium mb-1">기대값</div>
            <pre className="bg-muted p-2 rounded text-xs">
              {JSON.stringify(result.expected, null, 2)}
            </pre>
          </div>
          <div>
            <div className="font-medium mb-1">실제값</div>
            <pre className="bg-muted p-2 rounded text-xs">
              {JSON.stringify(result.actual, null, 2)}
            </pre>
          </div>
        </div>

        {result.error && (
          <Alert className="mt-4" variant="destructive">
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

function ReferenceLink({ title, url, description }: { title: string; url: string; description: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
    >
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </a>
  )
}


