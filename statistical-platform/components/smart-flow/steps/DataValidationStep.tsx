'use client'

import { memo, useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, BarChart, Clock, Pause, Play, TrendingUp, Activity, ArrowLeft, ChevronRight, BarChart3, LineChart, FlaskConical } from 'lucide-react'
import { ValidationResults, ExtendedValidationResults, ColumnStatistics } from '@/types/smart-flow'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DataValidationStepProps } from '@/types/smart-flow-navigation'
import { logger } from '@/lib/utils/logger'
import { usePyodide } from '@/components/providers/PyodideProvider'
import { PlotlyChartImproved } from '@/components/charts/PlotlyChartImproved'
import { getHeatmapLayout, getModalLayout, CHART_STYLES } from '@/lib/plotly-config'
import type { Data } from 'plotly.js'
import { DataTypeDetector } from '@/lib/statistics/data-type-detector'
import { useSmartFlowStore } from '@/lib/stores/smart-flow-store'

// Constants
const SKEWED_THRESHOLD = 0.8  // 80% 이상이면 편향
const SPARSE_THRESHOLD = 5    // 5개 미만이면 희소
const MAX_DISPLAY_CATEGORIES = 5  // 표시할 최대 카테고리 수

// Type guard for ExtendedValidationResults
function hasColumnStats(results: ValidationResults | null): results is ExtendedValidationResults {
  return results !== null && 'columnStats' in results
}

export const DataValidationStep = memo(function DataValidationStep({
  validationResults,
  data,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  currentStep,
  totalSteps
}: DataValidationStepProps) {
  const [autoProgress, setAutoProgress] = useState(false) // 기본값을 false로 변경
  const [countdown, setCountdown] = useState(5)
  const [isPaused, setIsPaused] = useState(false)
  const [normalityTests, setNormalityTests] = useState<Record<string, any>>({})
  const [isCalculating, setIsCalculating] = useState(false)
  const [isAssumptionLoading, setIsAssumptionLoading] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<ColumnStatistics | null>(null)
  const [showVisualization, setShowVisualization] = useState(false)
  const [alpha, setAlpha] = useState<number>(0.05)
  const [normalityRule, setNormalityRule] = useState<'any' | 'majority' | 'strict'>('any')
  const assumptionRunId = useRef(0)
  const didAutoRunNormality = useRef(false)

  // PyodideProvider에서 상태 가져오기
  const { isLoaded: pyodideLoaded, isLoading: pyodideLoading, service: pyodideService, error: pyodideError } = usePyodide()

  // Store에서 상태 관리
  const {
    dataCharacteristics,
    assumptionResults,
    setDataCharacteristics,
    setAssumptionResults
  } = useSmartFlowStore()
  if (!validationResults || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">데이터를 먼저 업로드해주세요.</p>
      </div>
    )
  }

  const hasErrors = validationResults.errors.length > 0
  const hasWarnings = validationResults.warnings.length > 0

  // Type-safe column stats extraction
  const columnStats = useMemo(() =>
    hasColumnStats(validationResults) ? validationResults.columnStats : undefined,
    [validationResults]
  )

  // Memoize numeric columns for performance
  const numericColumns = useMemo(() =>
    columnStats?.filter(s => s.type === 'numeric') || [],
    [columnStats]
  )

  // Memoize categorical columns
  const categoricalColumns = useMemo(() =>
    columnStats?.filter(s => s.type === 'categorical' || s.uniqueValues <= 20) || [],
    [columnStats]
  )

  // 데이터 특성 자동 분석 및 통계 가정 검정 (백그라운드 + 200ms 디바운스)
  useEffect(() => {
    if (!data || !validationResults || !pyodideLoaded || !pyodideService) return

    let isActive = true
    const timer = setTimeout(() => {
      const localRunId = assumptionRunId.current + 1
      assumptionRunId.current = localRunId
      (async () => {
        try {
          // 1. 데이터 특성 자동 분석
          const characteristics = DataTypeDetector.analyzeDataCharacteristics(data)
          if (isActive) setDataCharacteristics(characteristics)

          console.log('[DataValidation] 데이터 특성 분석 완료:', {
            구조: characteristics.structure,
            설계: characteristics.studyDesign,
            샘플크기: characteristics.sampleSize,
            그룹수: characteristics.groupCount
          })

          // 2. 필요한 통계 가정만 자동 검정
          if (numericColumns.length > 0) {
            if (isActive) setIsAssumptionLoading(true)
            const testData: any = {}

            // 첫 번째 수치형 컬럼으로 정규성 검정
            const firstNumericCol = numericColumns[0]
            const values = data.map(row => parseFloat(row[firstNumericCol.name]))
              .filter(v => !isNaN(v))

            if (values.length >= 3) {
              testData.values = values
            }

            // 그룹이 여러 개 있으면 등분산성 검정
            if (characteristics.groupCount > 1 && categoricalColumns.length > 0) {
              const groupCol = categoricalColumns[0]
              const groups: number[][] = []

              const uniqueGroups = [...new Set(data.map(row => row[groupCol.name]))]
              for (const group of uniqueGroups) {
                const groupData = data
                  .filter(row => row[groupCol.name] === group)
                  .map(row => parseFloat(row[firstNumericCol.name]))
                  .filter(v => !isNaN(v))

                if (groupData.length > 0) groups.push(groupData)
              }

              if (groups.length >= 2) {
                testData.groups = groups
              }
            }

            // 통계 가정 검정 실행
            const assumptions = await pyodideService.checkAllAssumptions(testData, {
              alpha,
              normalityRule
            })
            if (isActive && localRunId === assumptionRunId.current) setAssumptionResults(assumptions)

            console.log('[DataValidation] 통계 가정 검정 완료:', assumptions.summary)
          }
        } catch (error) {
          console.error('[DataValidation] 분석 실패:', error)
        } finally {
          if (isActive && localRunId === assumptionRunId.current) setIsAssumptionLoading(false)
        }
      })()
    }, 200)

    return () => { isActive = false; clearTimeout(timer) }
  }, [data, validationResults, pyodideLoaded, pyodideService, alpha, normalityRule, numericColumns, categoricalColumns])

  // 정규성(Shapiro) 자동 실행: 준비되면 백그라운드로 1회 실행
  useEffect(() => {
    if (!pyodideLoaded || !pyodideService) return
    if (!data || numericColumns.length === 0) return
    if (didAutoRunNormality.current) return
    if (isAssumptionLoading || isCalculating || pyodideLoading) return

    // 최소 요건: 하나 이상의 수치형 컬럼에 유효값 3개 이상
    const hasEnoughData = numericColumns.some(col => {
      const arr = data
        .map((row: any) => Number(row[col.name]))
        .filter((v: number) => !isNaN(v))
      return arr.length >= 3
    })
    if (!hasEnoughData) return

    didAutoRunNormality.current = true
    runNormalityTests()
  }, [pyodideLoaded, pyodideService, data, numericColumns, isAssumptionLoading, isCalculating, pyodideLoading])

  // 자동 진행 기능
  useEffect(() => {
    if (!validationResults || hasErrors || isPaused || !autoProgress) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (onNext) onNext()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [validationResults, hasErrors, isPaused, autoProgress])

  const toggleAutoProgress = () => {
    setIsPaused(!isPaused)
    if (isPaused) {
      setCountdown(5) // 재시작 시 카운트다운 초기화
    }
  }

  // 정규성 검정 실행 (자동/수동 공용)
  const runNormalityTests = async () => {
    console.log('performStatisticalTests called', {
      hasData: !!data,
      numericColumnsCount: numericColumns.length,
      numericColumns: numericColumns.map(c => c.name)
    })

    // 가드: 데이터/수치형 변수 없으면 실행하지 않음
    if (!data || !numericColumns.length) {
      console.log('No data or numeric columns, returning')
      return
    }
    // 다른 작업 진행 중이면 스킵
    if (isAssumptionLoading || isCalculating || pyodideLoading) {
      console.log('Skip normality: busy state')
      return
    }

    setIsCalculating(true)
    const normalityResults: Record<string, any> = {}

    try {
      // Pyodide가 이미 로드되어 있으므로 바로 실행
      if (!pyodideLoaded || !pyodideService) {
        console.log('Pyodide not loaded yet')
        return
      }
      console.log('Running tests with preloaded Pyodide')
      for (const col of numericColumns) {
        // 열 데이터 추출
        const columnData = data
          .map((row: Record<string, unknown>) => row[col.name])
          .filter((val: unknown): val is number | string => val !== null && val !== undefined && !isNaN(Number(val)))
          .map((val: number | string) => Number(val))

        if (columnData.length >= 3) {
          console.log(`Testing column ${col.name} with ${columnData.length} values`)

          // 정규성 검정 (n >= 3)
          try {
            const normality = await pyodideService.shapiroWilkTest(columnData)
            console.log(`Normality test for ${col.name}:`, normality)
            normalityResults[col.name] = normality
          } catch (err) {
            console.error(`Normality test failed for ${col.name}:`, err)
            logger.error(`Normality test failed for ${col.name}`, err)
          }
        }
      }

      console.log('Final results:', {
        normalityResults
      })
      setNormalityTests(normalityResults)
    } catch (error) {
      console.error('Statistical tests error:', error)
      logger.error('통계 검정 오류', error)
    } finally {
      setIsCalculating(false)
    }
  }

  // 기본적으로 자동 실행하지 않음 (버튼으로 수동 실행)

  return (
    <div className="space-y-6">
      {/* Pyodide 로딩 상태 */}
      {pyodideLoading && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Python 통계 엔진을 초기화하는 중입니다... (첫 실행 시 3-5초 소요)
            </p>
          </div>
        </div>
      )}

      {/* Pyodide 에러 */}
      {pyodideError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-900 dark:text-red-100">
            통계 엔진 오류: {pyodideError}
          </p>
        </div>
      )}

      {/* 검증 요약 */}
      <div className={`rounded-lg p-6 ${
        hasErrors ? 'bg-red-50 dark:bg-red-950/20' :
        hasWarnings ? 'bg-yellow-50 dark:bg-yellow-950/20' :
        'bg-green-50 dark:bg-green-950/20'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          {hasErrors ? (
            <XCircle className="w-6 h-6 text-red-600" />
          ) : hasWarnings ? (
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
          <h3 className="text-lg font-semibold">
            {hasErrors ? '데이터 검증 실패' :
             hasWarnings ? '데이터 검증 완료 (경고 있음)' :
             '데이터 검증 완료'}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white dark:bg-background rounded p-3">
            <p className="text-sm text-muted-foreground">총 행 수</p>
            <p className="text-lg">{validationResults.totalRows}</p>
          </div>
          <div className="bg-white dark:bg-background rounded p-3">
            <p className="text-sm text-muted-foreground">변수 수</p>
            <p className="text-lg">{validationResults.columnCount}</p>
          </div>
          <div className="bg-white dark:bg-background rounded p-3">
            <p className="text-sm text-muted-foreground">결측값</p>
            <p className="text-lg">{validationResults.missingValues}</p>
          </div>
          <div className="bg-white dark:bg-background rounded p-3">
            <p className="text-sm text-muted-foreground">데이터 타입</p>
            <p className="text-lg">{validationResults.dataType}</p>
          </div>
        </div>
      </div>


      {/* 상세 정보 탭 - 재구성 */}
      <Tabs defaultValue="descriptive" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="descriptive" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            기초통계
          </TabsTrigger>
          <TabsTrigger value="assumptions" className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4" />
            통계적 가정
            {assumptionResults?.summary && (
              <Badge variant={assumptionResults.summary.canUseParametric ? "success" : "warning"} className="ml-2 text-xs">
                {assumptionResults.summary.canUseParametric ? "충족" : "위반"}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <LineChart className="w-4 h-4" />
            탐색적 시각화
          </TabsTrigger>
        </TabsList>

        {/* 기초통계 탭 */}
        <TabsContent value="descriptive" className="space-y-4" forceMount>
          <Card>
            <CardHeader>
              <CardTitle>발견된 변수</CardTitle>
            </CardHeader>
            <CardContent>
              {columnStats ? (
                <div className="space-y-3">
                  {columnStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{stat.name}</span>
                        <Badge variant={
                          stat.type === 'numeric' ? 'default' :
                          stat.type === 'categorical' ? 'secondary' : 'destructive'
                        }>
                          {stat.type === 'numeric' ? '수치형' :
                           stat.type === 'categorical' ? '범주형' : '혼합'}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>고유값: {stat.uniqueValues}개</span>
                        <span>결측: {stat.missingCount}개</span>
                        {stat.type === 'numeric' && (
                          <>
                            <span className="text-blue-600">평균: {stat.mean?.toFixed(2)}</span>
                            <span className="text-blue-600">표준편차: {stat.std?.toFixed(2)}</span>
                            {stat.outliers && stat.outliers.length > 0 && (
                              <span className="text-orange-600">이상치: {stat.outliers.length}개</span>
                            )}
                          </>
                        )}
                        {stat.type === 'mixed' && (
                          <span className="text-yellow-600">
                            수치 {stat.numericCount}개, 문자 {stat.textCount}개
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {validationResults.variables.map((variable, index) => (
                    <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {variable}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 수치형 변수 상세 통계 */}
          {columnStats && columnStats.some(s => s.type === 'numeric') && (
            <Card>
              <CardHeader>
                <CardTitle>수치형 변수 상세 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">변수명</th>
                        <th className="text-right p-2">평균</th>
                        <th className="text-right p-2">중앙값</th>
                        <th className="text-right p-2">표준편차</th>
                        <th className="text-right p-2">최소값</th>
                        <th className="text-right p-2">최대값</th>
                        <th className="text-right p-2">Q1</th>
                        <th className="text-right p-2">Q3</th>
                        <th className="text-right p-2">이상치</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columnStats
                        .filter(s => s.type === 'numeric')
                        .map((stat, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{stat.name}</td>
                            <td className="text-right p-2">{stat.mean?.toFixed(2)}</td>
                            <td className="text-right p-2">{stat.median?.toFixed(2)}</td>
                            <td className="text-right p-2">{stat.std?.toFixed(2)}</td>
                            <td className="text-right p-2">{stat.min?.toFixed(2)}</td>
                            <td className="text-right p-2">{stat.max?.toFixed(2)}</td>
                            <td className="text-right p-2">{stat.q1?.toFixed(2)}</td>
                            <td className="text-right p-2">{stat.q3?.toFixed(2)}</td>
                            <td className="text-right p-2">
                              {stat.outliers?.length || 0}
                              {stat.outliers && stat.outliers.length > 0 && (
                                <span className="text-xs text-orange-600 ml-1">
                                  ({((stat.outliers.length / stat.numericCount) * 100).toFixed(1)}%)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 범주형 변수 빈도 분석 */}
          {columnStats && columnStats.some(s => s.type === 'categorical') && (
            <Card>
              <CardHeader>
                <CardTitle>범주형 변수 빈도 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {columnStats
                    .filter(s => s.type === 'categorical')
                    .map((stat, idx) => {
                      // 한 번만 계산
                      const totalValidCount = stat.topValues?.reduce((acc, v) => acc + v.count, 0) || 1
                      const hasSkewedDistribution = stat.topValues?.[0] &&
                        (stat.topValues[0].count / totalValidCount) > SKEWED_THRESHOLD
                      const hasSparseCategories = stat.topValues?.some(v => v.count < SPARSE_THRESHOLD)

                      return (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{stat.name}</h4>
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              {stat.uniqueValues}개 카테고리
                            </Badge>
                            {hasSkewedDistribution && (
                              <Badge variant="warning" className="text-xs">편향 분포</Badge>
                            )}
                            {hasSparseCategories && !hasSkewedDistribution && (
                              <Badge variant="warning" className="text-xs">희소 카테고리</Badge>
                            )}
                          </div>
                        </div>
                        {stat.topValues && stat.topValues.length > 0 ? (
                          <div className="space-y-2">
                            {stat.topValues.slice(0, MAX_DISPLAY_CATEGORIES).map((val, vidx) => {
                              const percentage = ((val.count / totalValidCount) * 100).toFixed(1)
                              return (
                                <div key={vidx} className="flex items-center gap-3">
                                  <span className="text-sm flex-1 truncate">{val.value || '(빈 값)'}</span>
                                  <span className="text-sm text-muted-foreground">{val.count}개</span>
                                  <div className="w-24">
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary transition-all"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
                                </div>
                              )
                            })}
                            {stat.uniqueValues > MAX_DISPLAY_CATEGORIES && (
                              <p className="text-xs text-muted-foreground mt-2">
                                ... 외 {stat.uniqueValues - MAX_DISPLAY_CATEGORIES}개 카테고리
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">빈도 정보 없음</p>
                        )}
                        {stat.missingCount > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            결측값: {stat.missingCount}개
                          </div>
                        )}
                      </div>
                    )})}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 통계적 가정 탭 - 자동 검정 및 추천 */}
        <TabsContent value="assumptions" className="space-y-4" forceMount>
          {/* 옵션 & 가이드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                가정 검정 옵션 <span className="text-xs text-muted-foreground">(적용 대상: 정규성/등분산 판정)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <span className="text-muted-foreground">alpha</span>
                  <input
                    type="number"
                    step={0.01}
                    min={0.001}
                    max={0.2}
                    value={alpha}
                    onChange={(e) => setAlpha(Number(e.target.value) || 0.05)}
                    className="w-24 border rounded px-2 py-1 bg-background"
                  />
                  <Info className="h-4 w-4 text-muted-foreground" title="유의수준: p < alpha면 가정 위반에 가까움, p > alpha면 충족에 가까움 (기본 0.05)" />
                  <span className="text-[11px] text-muted-foreground">적용: 정규성·등분산 판정</span>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-muted-foreground">normalityRule</span>
                  <select
                    value={normalityRule}
                    onChange={(e) => setNormalityRule(e.target.value as 'any' | 'majority' | 'strict')}
                    className="border rounded px-2 py-1 bg-background"
                  >
                    <option value="any">any(기본)</option>
                    <option value="majority">majority</option>
                    <option value="strict">strict</option>
                  </select>
                  <Info
                    className="h-4 w-4 text-muted-foreground"
                    title={
                      normalityRule === 'any'
                        ? '정규성 검정(SW/KS/D’Agostino) 중 하나라도 통과하면 정규성 만족'
                        : normalityRule === 'majority'
                        ? '여러 검정 중 절반 이상이 통과하면 정규성 만족'
                        : '모든 검정이 통과해야 정규성 만족'
                    }
                  />
                  <span className="text-[11px] text-muted-foreground">적용: 정규성 판정</span>
                </label>
                <a
                  href="/docs/technical/ASSUMPTIONS_GUIDE.md"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto underline text-blue-600"
                >
                  가이드 보기
                </a>
                <a
                  href="/docs/technical/TESTING_GUIDE.md"
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-blue-600"
                >
                  테스트 가이드
                </a>
              </div>
            {isAssumptionLoading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                가정 검정 수행 중...
              </div>
            )}
              <p className="mt-2 text-xs text-muted-foreground">
                정규성: 데이터(또는 잔차)가 정규분포인지 확인합니다. 등분산성: 그룹 간 분산이 유사한지 확인합니다. 독립성: 값들(또는 잔차)이 서로 독립적인지 확인합니다.
              </p>
            </CardContent>
          </Card>
          {/* 데이터 특성 요약 */}
          {dataCharacteristics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  데이터 특성 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">샘플 크기</p>
                    <p className="text-xl font-bold">{dataCharacteristics.sampleSize}</p>
                    {dataCharacteristics.sampleSize < 30 && (
                      <Badge variant="warning" className="mt-1 text-xs">소표본</Badge>
                    )}
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">연구 설계</p>
                    <p className="text-lg font-semibold">{dataCharacteristics.studyDesign}</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">그룹 수</p>
                    <p className="text-xl font-bold">{dataCharacteristics.groupCount}</p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">데이터 구조</p>
                    <p className="text-lg font-semibold">{dataCharacteristics.structure}</p>
                  </div>
                </div>

                {/* 권장 분석 방법 */}
                {dataCharacteristics.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">권장 분석 방법</h4>
                    <div className="space-y-2">
                      {dataCharacteristics.recommendations.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{rec.method}</span>
                            <Badge variant={rec.confidence > 0.7 ? "success" : "secondary"}>
                              신뢰도 {(rec.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>• {rec.reasons.join(', ')}</p>
                            {rec.requirements.length > 0 && (
                              <p className="text-yellow-600 dark:text-yellow-400">
                                ⚠️ 필요 가정: {rec.requirements.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 통계적 가정 검정 결과 */}
          {assumptionResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  통계적 가정 검정 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 정규성 검정 */}
                  {assumptionResults.normality?.shapiroWilk && (
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">정규성 (Shapiro-Wilk)</span>
                        <Badge variant={assumptionResults.normality.shapiroWilk.isNormal ? "success" : "warning"}>
                          {assumptionResults.normality.shapiroWilk.isNormal ? "충족" : "위반"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>W = {assumptionResults.normality.shapiroWilk.statistic.toFixed(4)}</span>
                        <span className="ml-3">p = {assumptionResults.normality.shapiroWilk.pValue.toFixed(4)}</span>
                      </div>
                    </div>
                  )}

                  {/* 등분산성 검정 */}
                  {assumptionResults.homogeneity?.levene && (
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">등분산성 (Levene)</span>
                        <Badge variant={assumptionResults.homogeneity.levene.equalVariance ? "success" : "warning"}>
                          {assumptionResults.homogeneity.levene.equalVariance ? "충족" : "위반"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>F = {assumptionResults.homogeneity.levene.statistic.toFixed(4)}</span>
                        <span className="ml-3">p = {assumptionResults.homogeneity.levene.pValue.toFixed(4)}</span>
                      </div>
                    </div>
                  )}

                  {/* 종합 권장사항 */}
                  {assumptionResults.summary && (
                    <div className={`p-4 rounded-lg ${
                      assumptionResults.summary.canUseParametric
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                    }`}>
                      <h4 className="font-medium mb-2">종합 권장사항</h4>
                      <div className="space-y-2 text-sm">
                        {assumptionResults.summary.recommendations.map((rec, idx) => (
                          <p key={idx} className="flex items-start gap-2">
                            <span>•</span>
                            <span>{rec}</span>
                          </p>
                        ))}
                        {assumptionResults.summary.reasons.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-muted-foreground">이유:</p>
                            {assumptionResults.summary.reasons.map((reason, idx) => (
                              <p key={idx} className="text-muted-foreground ml-2">- {reason}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 기존 정규성 검정 코드는 백업용으로 유지 */}
          {/* 정규성 검정 결과 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                정규성 검정 (Shapiro-Wilk)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-muted-foreground">
                  필요할 때만 실행하세요. (Pyodide 초기화 3-5초)
                </div>
                <Button size="sm" variant="outline" onClick={runNormalityTests} disabled={isCalculating}>
                  {isCalculating ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                      실행 중...
                    </span>
                  ) : (
                    '정규성 검정 실행'
                  )}
                </Button>
              </div>
              {isCalculating ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  통계 검정 수행 중...
                </div>
              ) : numericColumns.length > 0 ? (
                <div className="space-y-3">
                  {numericColumns.map((col) => {
                    const test = normalityTests[col.name]
                    return (
                      <div key={col.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{col.name}</span>
                          {test && (
                            <Badge variant={test.isNormal ? "success" : "warning"}>
                              {test.isNormal ? "정규분포 만족" : "정규분포 위배"}
                            </Badge>
                          )}
                        </div>
                        {test && (
                          <div className="text-sm text-muted-foreground">
                            <span>W = {test.statistic?.toFixed(4)}</span>
                            <span className="ml-3">p = {test.pValue?.toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {Object.keys(normalityTests).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      정규성 검정 대기 중... (최소 3개 데이터 필요)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">수치형 변수가 없습니다.</p>
              )}
            </CardContent>
          </Card>

          {/* 이상치 진단 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                이상치 탐지 (IQR 방법)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {numericColumns.length > 0 ? (
                <div className="space-y-3">
                  {numericColumns.map((col) => {
                    // columnStats의 IQR/경계/이상치 활용
                    const stat = columnStats?.find(s => s.name === col.name)
                    return (
                      <div key={col.name} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{col.name}</span>
                          {stat && (
                            <div className="flex gap-2">
                              {(stat.outliers?.length || 0) > 0 && (
                                <Badge variant="warning">
                                  이상치: {stat.outliers?.length}개
                                </Badge>
                              )}
                              {(stat.outliers?.length || 0) === 0 && (
                                <Badge variant="success">✔ 이상치 없음</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        {stat && (
                          <div className="text-xs text-muted-foreground grid grid-cols-4 gap-2">
                            <span>Q1: {stat.q1?.toFixed(2)}</span>
                            <span>Q3: {stat.q3?.toFixed(2)}</span>
                            <span>IQR: {(stat.q3 !== undefined && stat.q1 !== undefined ? (stat.q3 - stat.q1).toFixed(2) : 'N/A')}</span>
                            <span>
                              범위: [
                                {stat.q1 !== undefined && stat.q3 !== undefined ? (stat.q1 - 1.5 * (stat.q3 - stat.q1)).toFixed(2) : 'N/A'},
                                {' '}
                                {stat.q1 !== undefined && stat.q3 !== undefined ? (stat.q3 + 1.5 * (stat.q3 - stat.q1)).toFixed(2) : 'N/A'}
                              ]
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">수치형 변수가 없습니다.</p>
              )}
            </CardContent>
          </Card>

          
        </TabsContent>

        {/* 탐색적 시각화 탭 */}
        <TabsContent value="visualization" className="space-y-4" forceMount>
          {/* 변수별 분포 차트는 이미 위에 구현됨 */}
          <div className="grid gap-4 md:grid-cols-2">
            {numericColumns.slice(0, 4).map((stat, idx) => {
              const columnData = data?.map(row => {
                const value = parseFloat(row[stat.name])
                return isNaN(value) ? null : value
              }).filter(v => v !== null) || []

              return (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-sm">{stat.name} 분포</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {columnData.length > 0 ? (
                      <PlotlyChartImproved
                        data={[{
                          x: columnData,
                          type: 'box',
                          ...CHART_STYLES.box,
                          name: stat.name,
                          boxmean: 'sd',
                          orientation: 'h',
                          hovertemplate:
                            '최대: %{x[5]}<br>' +
                            'Q3: %{x[4]}<br>' +
                            '중앙값: %{x[3]}<br>' +
                            'Q1: %{x[2]}<br>' +
                            '최소: %{x[1]}<br>' +
                            '평균: %{mean}<br>' +
                            '표준편차: %{sd}<extra></extra>'
                        } as Data]}
                        layout={{
                          ...getModalLayout({
                            title: { text: '' },
                            xaxis: { title: '' },
                            height: 250,
                            showlegend: false
                          }),
                          margin: { l: 10, r: 10, t: 10, b: 40 }
                        }}
                        config={{
                          displayModeBar: false,
                          responsive: true
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>데이터가 없습니다</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {/* 범주형 변수 빈도 차트 */}
            {categoricalColumns.slice(0, 2).map((stat, idx) => {
              if (!stat.topValues || stat.topValues.length === 0) return null

              return (
                <Card key={`cat-${idx}`}>
                  <CardHeader>
                    <CardTitle className="text-sm">{stat.name} 빈도</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <PlotlyChartImproved
                      data={[{
                        x: stat.topValues.slice(0, 10).map(c => c.value),
                        y: stat.topValues.slice(0, 10).map(c => c.count),
                        type: 'bar',
                        ...CHART_STYLES.bar,
                        hovertemplate: '%{x}: %{y}개<extra></extra>'
                      } as Data]}
                      layout={{
                        ...getModalLayout({
                          title: { text: '' },
                          xaxis: { title: '', tickangle: -45 },
                          yaxis: { title: '빈도' },
                          height: 250,
                          showlegend: false
                        }),
                        margin: { l: 40, r: 10, t: 10, b: 60 }
                      }}
                      config={{
                        displayModeBar: false,
                        responsive: true
                      }}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 상관관계 히트맵 (수치형 변수가 2개 이상일 때) */}
          {numericColumns.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle>변수 간 상관관계</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  수치형 변수 간의 Pearson 상관계수를 히트맵으로 표시합니다.
                </p>
                {/* 여기에 상관관계 히트맵 구현 */}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
})