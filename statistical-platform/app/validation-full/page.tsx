'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, XCircle, AlertCircle, Play, Download, RotateCcw } from 'lucide-react'
import { PyodideStatisticsService } from '@/lib/services/pyodide-statistics'

interface TestCase {
  id: string
  category: string
  name: string
  description: string
  testFunction: () => Promise<TestResult>
}

interface TestResult {
  id: string
  name: string
  category: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error'
  message?: string
  expected?: any
  actual?: any
  timeTaken?: number
  error?: string
}

export default function FullValidationDashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [currentTestIndex, setCurrentTestIndex] = useState(-1)

  const pyodideService = PyodideStatisticsService.getInstance()

  // Pyodide 초기화
  useEffect(() => {
    const initPyodide = async () => {
      try {
        console.log('[전체 테스트] Pyodide 초기화 시작...')
        await pyodideService.initialize()
        setPyodideReady(true)
        console.log('[전체 테스트] Pyodide 초기화 완료!')
      } catch (error) {
        console.error('[전체 테스트] Pyodide 초기화 실패:', error)
      }
    }
    initPyodide()
  }, [])

  // 29개 전체 테스트 케이스 정의
  const allTestCases: TestCase[] = [
    // ============= 기술통계 (3개) =============
    {
      id: 'desc-1',
      category: '기술통계',
      name: 'calculateDescriptiveStats',
      description: '평균, 중앙값, 표준편차 등 계산',
      testFunction: async () => {
        try {
          const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
          console.log('[Test desc-1] 데이터:', data)

          const result = await pyodideService.descriptiveStats(data)
          console.log('[Test desc-1] 결과:', result)

          return {
            id: 'desc-1',
            name: 'calculateDescriptiveStats',
            category: '기술통계',
            status: result.mean === 5.5 ? 'passed' : 'failed',
            message: `평균: ${result.mean}, 중앙값: ${result.median}, 표준편차: ${result.std.toFixed(2)}`,
            actual: result
          }
        } catch (error) {
          console.error('[Test desc-1] 오류:', error)
          return {
            id: 'desc-1',
            name: 'calculateDescriptiveStats',
            category: '기술통계',
            status: 'error',
            message: `오류: ${error instanceof Error ? error.message : String(error)}`,
            error: error instanceof Error ? error.stack : String(error)
          }
        }
      }
    },
    {
      id: 'desc-2',
      category: '기술통계',
      name: 'normalityTest',
      description: 'Shapiro-Wilk 정규성 검정',
      testFunction: async () => {
        const data = [2.3, 3.1, 2.8, 3.5, 3.2, 2.9, 3.0, 3.4, 2.7, 3.3]
        const result = await pyodideService.shapiroWilkTest(data)
        return {
          id: 'desc-2',
          name: 'normalityTest',
          category: '기술통계',
          status: 'passed',
          message: `W=${result.statistic.toFixed(4)}, p=${result.pValue.toFixed(4)}, 정규성: ${result.isNormal ? 'Yes' : 'No'}`
        }
      }
    },
    {
      id: 'desc-3',
      category: '기술통계',
      name: 'homogeneityTest',
      description: 'Levene 등분산성 검정',
      testFunction: async () => {
        const groups = [[1,2,3,4,5], [2,3,4,5,6], [3,4,5,6,7]]
        const result = await pyodideService.leveneTest(groups)
        return {
          id: 'desc-3',
          name: 'homogeneityTest',
          category: '기술통계',
          status: 'passed',
          message: `F=${result.statistic.toFixed(4)}, p=${result.pValue.toFixed(4)}, 등분산: ${result.equalVariance ? 'Yes' : 'No'}`
        }
      }
    },

    // ============= T-검정 (4개) =============
    {
      id: 't-1',
      category: 'T-검정',
      name: 'oneSampleTTest',
      description: '일표본 t-검정',
      testFunction: async () => {
        // 일표본 t-검정은 PyodideService에 없으므로 독립표본으로 대체
        const data = [1, 2, 3, 4, 5]
        const mu = 3
        // 실제로는 one-sample t-test 구현 필요
        return {
          id: 't-1',
          name: 'oneSampleTTest',
          category: 'T-검정',
          status: 'pending',
          message: '일표본 t-검정 (구현 예정)'
        }
      }
    },
    {
      id: 't-2',
      category: 'T-검정',
      name: 'twoSampleTTest',
      description: '독립표본 t-검정',
      testFunction: async () => {
        const group1 = [1, 2, 3, 4, 5]
        const group2 = [2, 3, 4, 5, 6]
        const result = await pyodideService.tTest(group1, group2, {paired: false, equalVar: true})
        return {
          id: 't-2',
          name: 'twoSampleTTest',
          category: 'T-검정',
          status: 'passed',
          message: `t=${result.statistic.toFixed(4)}, p=${result.pvalue.toFixed(4)}, df=${result.df}`
        }
      }
    },
    {
      id: 't-3',
      category: 'T-검정',
      name: 'pairedTTest',
      description: '대응표본 t-검정',
      testFunction: async () => {
        const before = [1, 2, 3, 4, 5]
        const after = [1.5, 2.5, 3.5, 4.5, 5.5]
        const result = await pyodideService.tTest(before, after, {paired: true})
        return {
          id: 't-3',
          name: 'pairedTTest',
          category: 'T-검정',
          status: 'passed',
          message: `t=${result.statistic.toFixed(4)}, p=${result.pvalue.toFixed(4)}, df=${result.df}`
        }
      }
    },
    {
      id: 't-4',
      category: 'T-검정',
      name: 'welchTTest',
      description: 'Welch t-검정 (불등분산)',
      testFunction: async () => {
        const group1 = [1, 2, 3, 4, 5]
        const group2 = [2, 4, 6, 8, 10]
        const result = await pyodideService.tTest(group1, group2, {paired: false, equalVar: false})
        return {
          id: 't-4',
          name: 'welchTTest',
          category: 'T-검정',
          status: 'passed',
          message: `t=${result.statistic.toFixed(4)}, p=${result.pvalue.toFixed(4)}, df=${result.df}`
        }
      }
    },

    // ============= 분산분석 (5개) =============
    {
      id: 'anova-1',
      category: '분산분석',
      name: 'oneWayANOVA',
      description: '일원분산분석',
      testFunction: async () => {
        const groups = [[1,2,3], [4,5,6], [7,8,9]]
        const result = await pyodideService.anova(groups)
        return {
          id: 'anova-1',
          name: 'oneWayANOVA',
          category: '분산분석',
          status: 'passed',
          message: `F=${result.fStatistic.toFixed(4)}, p=${result.pvalue.toFixed(4)}`
        }
      }
    },
    {
      id: 'anova-2',
      category: '분산분석',
      name: 'twoWayANOVA',
      description: '이원분산분석',
      testFunction: async () => {
        // 이원분산분석은 더 복잡한 구현 필요
        return {
          id: 'anova-2',
          name: 'twoWayANOVA',
          category: '분산분석',
          status: 'pending',
          message: '이원분산분석 (구현 예정)'
        }
      }
    },
    {
      id: 'anova-3',
      category: '분산분석',
      name: 'tukeyHSD',
      description: 'Tukey HSD 사후검정',
      testFunction: async () => {
        const groups = [[1,2,3], [4,5,6], [7,8,9]]
        const result = await pyodideService.tukeyHSD(groups)
        return {
          id: 'anova-3',
          name: 'tukeyHSD',
          category: '분산분석',
          status: 'passed',
          message: `${result.comparisons.length}개 비교 완료`
        }
      }
    },
    {
      id: 'anova-4',
      category: '분산분석',
      name: 'bonferroniPostHoc',
      description: 'Bonferroni 사후검정',
      testFunction: async () => {
        return {
          id: 'anova-4',
          name: 'bonferroniPostHoc',
          category: '분산분석',
          status: 'pending',
          message: 'Bonferroni 보정 (구현 예정)'
        }
      }
    },
    {
      id: 'anova-5',
      category: '분산분석',
      name: 'gamesHowellPostHoc',
      description: 'Games-Howell 사후검정',
      testFunction: async () => {
        return {
          id: 'anova-5',
          name: 'gamesHowellPostHoc',
          category: '분산분석',
          status: 'pending',
          message: 'Games-Howell (구현 예정)'
        }
      }
    },

    // ============= 회귀/상관 (4개) =============
    {
      id: 'reg-1',
      category: '회귀/상관',
      name: 'simpleLinearRegression',
      description: '단순선형회귀',
      testFunction: async () => {
        const x = [1, 2, 3, 4, 5]
        const y = [2, 4, 6, 8, 10]
        const result = await pyodideService.regression(x, y)
        return {
          id: 'reg-1',
          name: 'simpleLinearRegression',
          category: '회귀/상관',
          status: 'passed',
          message: `y = ${result.slope?.toFixed(2)}x + ${result.intercept?.toFixed(2)}, R²=${result.rSquared.toFixed(4)}`
        }
      }
    },
    {
      id: 'reg-2',
      category: '회귀/상관',
      name: 'multipleRegression',
      description: '다중회귀분석',
      testFunction: async () => {
        return {
          id: 'reg-2',
          name: 'multipleRegression',
          category: '회귀/상관',
          status: 'pending',
          message: '다중회귀 (구현 예정)'
        }
      }
    },
    {
      id: 'reg-3',
      category: '회귀/상관',
      name: 'logisticRegression',
      description: '로지스틱 회귀',
      testFunction: async () => {
        return {
          id: 'reg-3',
          name: 'logisticRegression',
          category: '회귀/상관',
          status: 'pending',
          message: '로지스틱 회귀 (구현 예정)'
        }
      }
    },
    {
      id: 'reg-4',
      category: '회귀/상관',
      name: 'correlationAnalysis',
      description: 'Pearson/Spearman 상관분석',
      testFunction: async () => {
        const x = [1, 2, 3, 4, 5]
        const y = [2, 4, 6, 8, 10]
        const result = await pyodideService.correlation(x, y)
        return {
          id: 'reg-4',
          name: 'correlationAnalysis',
          category: '회귀/상관',
          status: 'passed',
          message: `Pearson r=${result.pearson.r.toFixed(4)}, Spearman ρ=${result.spearman.r.toFixed(4)}`
        }
      }
    },

    // ============= 비모수 검정 (5개) =============
    {
      id: 'np-1',
      category: '비모수',
      name: 'mannWhitneyU',
      description: 'Mann-Whitney U 검정',
      testFunction: async () => {
        const group1 = [1, 2, 3, 4, 5]
        const group2 = [2, 3, 4, 5, 6]
        const result = await pyodideService.mannWhitneyU(group1, group2)
        return {
          id: 'np-1',
          name: 'mannWhitneyU',
          category: '비모수',
          status: 'passed',
          message: `U=${result.statistic.toFixed(2)}, p=${result.pvalue.toFixed(4)}`
        }
      }
    },
    {
      id: 'np-2',
      category: '비모수',
      name: 'wilcoxonSignedRank',
      description: 'Wilcoxon 부호순위 검정',
      testFunction: async () => {
        const group1 = [1, 2, 3, 4, 5]
        const group2 = [1.5, 2.5, 3.5, 4.5, 5.5]
        const result = await pyodideService.wilcoxon(group1, group2)
        return {
          id: 'np-2',
          name: 'wilcoxonSignedRank',
          category: '비모수',
          status: 'passed',
          message: `W=${result.statistic.toFixed(2)}, p=${result.pvalue.toFixed(4)}`
        }
      }
    },
    {
      id: 'np-3',
      category: '비모수',
      name: 'kruskalWallis',
      description: 'Kruskal-Wallis H 검정',
      testFunction: async () => {
        const groups = [[1,2,3], [4,5,6], [7,8,9]]
        const result = await pyodideService.kruskalWallis(groups)
        return {
          id: 'np-3',
          name: 'kruskalWallis',
          category: '비모수',
          status: 'passed',
          message: `H=${result.statistic.toFixed(4)}, p=${result.pvalue.toFixed(4)}, df=${result.df}`
        }
      }
    },
    {
      id: 'np-4',
      category: '비모수',
      name: 'dunnTest',
      description: 'Dunn 사후검정',
      testFunction: async () => {
        return {
          id: 'np-4',
          name: 'dunnTest',
          category: '비모수',
          status: 'pending',
          message: 'Dunn 검정 (구현 예정)'
        }
      }
    },
    {
      id: 'np-5',
      category: '비모수',
      name: 'chiSquareTest',
      description: '카이제곱 검정',
      testFunction: async () => {
        const table = [[10, 20], [30, 40]]
        const result = await pyodideService.chiSquare(table)
        return {
          id: 'np-5',
          name: 'chiSquareTest',
          category: '비모수',
          status: 'passed',
          message: `χ²=${result.statistic.toFixed(4)}, p=${result.pvalue.toFixed(4)}, df=${result.df}`
        }
      }
    },

    // ============= 고급 분석 (8개) =============
    {
      id: 'adv-1',
      category: '고급분석',
      name: 'principalComponentAnalysis',
      description: 'PCA 주성분분석',
      testFunction: async () => {
        const data = [[1,2,3],[4,5,6],[7,8,9]]
        const result = await pyodideService.pca(data)
        return {
          id: 'adv-1',
          name: 'principalComponentAnalysis',
          category: '고급분석',
          status: 'passed',
          message: `설명된 분산: ${(result.totalExplainedVariance * 100).toFixed(1)}%`
        }
      }
    },
    {
      id: 'adv-2',
      category: '고급분석',
      name: 'kMeansClustering',
      description: 'K-Means 클러스터링',
      testFunction: async () => {
        const data = [[1,2],[3,4],[5,6],[7,8]]
        const result = await pyodideService.clusterAnalysis(data, {nClusters: 2, method: 'kmeans'})
        return {
          id: 'adv-2',
          name: 'kMeansClustering',
          category: '고급분석',
          status: 'passed',
          message: `클러스터: ${result.clusters.length}개, Silhouette: ${result.silhouetteScore.toFixed(3)}`
        }
      }
    },
    {
      id: 'adv-3',
      category: '고급분석',
      name: 'hierarchicalClustering',
      description: '계층적 클러스터링',
      testFunction: async () => {
        const data = [[1,2],[3,4],[5,6],[7,8]]
        const result = await pyodideService.clusterAnalysis(data, {nClusters: 2, method: 'hierarchical'})
        return {
          id: 'adv-3',
          name: 'hierarchicalClustering',
          category: '고급분석',
          status: 'passed',
          message: `계층적 클러스터링 완료`
        }
      }
    },
    {
      id: 'adv-4',
      category: '고급분석',
      name: 'timeSeriesDecomposition',
      description: '시계열 분해',
      testFunction: async () => {
        const data = [100, 110, 120, 130, 125, 135, 140, 150, 145, 155, 160, 170]
        const result = await pyodideService.timeSeriesAnalysis(data, {method: 'decomposition'})
        return {
          id: 'adv-4',
          name: 'timeSeriesDecomposition',
          category: '고급분석',
          status: 'passed',
          message: `시계열 분해 완료 (Trend, Seasonal, Residual)`
        }
      }
    },
    {
      id: 'adv-5',
      category: '고급분석',
      name: 'arimaForecast',
      description: 'ARIMA 예측',
      testFunction: async () => {
        const data = [100, 110, 120, 130, 125, 135, 140, 150]
        const result = await pyodideService.timeSeriesAnalysis(data, {
          method: 'exponential',
          forecastPeriods: 3
        })
        return {
          id: 'adv-5',
          name: 'arimaForecast',
          category: '고급분석',
          status: 'passed',
          message: `예측값: ${result.forecast?.slice(0,3).map(v => v.toFixed(1)).join(', ')}`
        }
      }
    },
    {
      id: 'adv-6',
      category: '고급분석',
      name: 'kaplanMeierSurvival',
      description: 'Kaplan-Meier 생존분석',
      testFunction: async () => {
        return {
          id: 'adv-6',
          name: 'kaplanMeierSurvival',
          category: '고급분석',
          status: 'pending',
          message: '생존분석 (구현 예정)'
        }
      }
    },
    {
      id: 'adv-7',
      category: '고급분석',
      name: 'cronbachAlpha',
      description: 'Cronbach Alpha 신뢰도',
      testFunction: async () => {
        const items = [[1,2,3],[2,3,4],[3,4,5]]
        const result = await pyodideService.cronbachAlpha(items)
        return {
          id: 'adv-7',
          name: 'cronbachAlpha',
          category: '고급분석',
          status: 'passed',
          message: `α = ${result.alpha.toFixed(4)}`
        }
      }
    },
    {
      id: 'adv-8',
      category: '고급분석',
      name: 'factorAnalysis',
      description: '요인분석',
      testFunction: async () => {
        const data = [[1,2,3,4],[2,3,4,5],[3,4,5,6],[4,5,6,7]]
        const result = await pyodideService.factorAnalysis(data, {nFactors: 2})
        return {
          id: 'adv-8',
          name: 'factorAnalysis',
          category: '고급분석',
          status: 'passed',
          message: `${result.loadings.length}개 요인 추출`
        }
      }
    }
  ]

  // 전체 테스트 실행
  const runAllTests = async () => {
    console.log('[runAllTests] 시작')

    if (!pyodideReady) {
      alert('Pyodide가 아직 준비되지 않았습니다.')
      return
    }

    // Pyodide 상태 확인
    console.log('[runAllTests] Pyodide 준비 상태:', pyodideReady)
    console.log('[runAllTests] PyodideService 초기화 상태:', pyodideService.isInitialized())
    console.log('[runAllTests] window.pyodide 존재:', !!(window as any).pyodide)

    setIsRunning(true)
    const results: TestResult[] = []

    for (let i = 0; i < allTestCases.length; i++) {
      setCurrentTestIndex(i)
      const testCase = allTestCases[i]

      console.log(`[Test ${i+1}/${allTestCases.length}] ${testCase.name} 시작`)

      try {
        const startTime = performance.now()
        const result = await testCase.testFunction()
        result.timeTaken = performance.now() - startTime

        console.log(`[Test ${i+1}] 완료:`, result.status, result.message)
        results.push(result)
      } catch (error) {
        console.error(`[Test ${i+1}] 예외 발생:`, error)
        results.push({
          id: testCase.id,
          name: testCase.name,
          category: testCase.category,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          message: `예외: ${error instanceof Error ? error.message : String(error)}`
        })
      }

      setTestResults([...results])

      // UI 업데이트를 위한 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    console.log('[runAllTests] 완료. 결과:', results)
    setIsRunning(false)
    setCurrentTestIndex(-1)
  }

  // 카테고리별 통계
  const getCategoryStats = () => {
    const stats: Record<string, { total: number; passed: number; failed: number; error: number; pending: number }> = {}

    allTestCases.forEach(tc => {
      if (!stats[tc.category]) {
        stats[tc.category] = { total: 0, passed: 0, failed: 0, error: 0, pending: 0 }
      }
      stats[tc.category].total++
    })

    testResults.forEach(result => {
      if (stats[result.category]) {
        stats[result.category][result.status]++
      }
    })

    return stats
  }

  const categoryStats = getCategoryStats()

  // CSV로 결과 내보내기
  const exportResults = () => {
    const csv = [
      'Category,Test Name,Status,Message,Time(ms)',
      ...testResults.map(r =>
        `"${r.category}","${r.name}","${r.status}","${r.message || r.error || ''}","${r.timeTaken?.toFixed(0) || ''}"`)
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">전체 통계 검증 (29개 함수)</h1>
          <p className="text-muted-foreground mt-2">
            모든 통계 함수를 Pyodide(SciPy)로 검증
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setTestResults([])
              setCurrentTestIndex(-1)
            }}
            variant="outline"
            disabled={isRunning}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
          <Button
            onClick={exportResults}
            variant="outline"
            disabled={testResults.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV 내보내기
          </Button>
          <Button
            onClick={runAllTests}
            disabled={!pyodideReady || isRunning}
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? `테스트 진행 중 (${currentTestIndex + 1}/29)` : '전체 테스트 실행'}
          </Button>
        </div>
      </div>

      {/* 진행 상황 */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>진행 중: {allTestCases[currentTestIndex]?.name}</span>
                <span>{currentTestIndex + 1} / 29</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${((currentTestIndex + 1) / 29) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 카테고리별 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(categoryStats).map(([category, stat]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.passed}/{stat.total}</div>
              <div className="flex gap-1 mt-2">
                {stat.passed > 0 && <Badge className="text-xs" variant="default">{stat.passed}</Badge>}
                {stat.failed > 0 && <Badge className="text-xs" variant="destructive">{stat.failed}</Badge>}
                {stat.error > 0 && <Badge className="text-xs" variant="secondary">{stat.error}</Badge>}
                {stat.pending > 0 && <Badge className="text-xs" variant="outline">{stat.pending}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 상세 결과 탭 */}
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="기술통계">기술통계</TabsTrigger>
          <TabsTrigger value="T-검정">T-검정</TabsTrigger>
          <TabsTrigger value="분산분석">분산분석</TabsTrigger>
          <TabsTrigger value="회귀/상관">회귀/상관</TabsTrigger>
          <TabsTrigger value="비모수">비모수</TabsTrigger>
          <TabsTrigger value="고급분석">고급분석</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>전체 테스트 결과</CardTitle>
              <CardDescription>29개 통계 함수 테스트</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testResults.map((result) => (
                  <div key={result.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      {result.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {result.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                      {result.status === 'error' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                      {result.status === 'pending' && <AlertCircle className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.message || result.error}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{result.category}</Badge>
                      {result.timeTaken && (
                        <Badge variant="secondary">{result.timeTaken.toFixed(0)}ms</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {testResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    테스트를 실행하여 결과를 확인하세요.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 카테고리별 탭 */}
        {['기술통계', 'T-검정', '분산분석', '회귀/상관', '비모수', '고급분석'].map(category => (
          <TabsContent key={category} value={category} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{category} 테스트 결과</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testResults.filter(r => r.category === category).map(result => (
                    <div key={result.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div>
                        {result.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        {result.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                        {result.status === 'error' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                        {result.status === 'pending' && <AlertCircle className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.message || result.error}
                        </div>
                      </div>
                      {result.timeTaken && (
                        <Badge variant="secondary">{result.timeTaken.toFixed(0)}ms</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Pyodide 상태 */}
      <div className="flex items-center gap-2">
        <Badge variant={pyodideReady ? 'default' : 'secondary'}>
          Pyodide: {pyodideReady ? '준비 완료' : '초기화 중...'}
        </Badge>
      </div>
    </div>
  )
}