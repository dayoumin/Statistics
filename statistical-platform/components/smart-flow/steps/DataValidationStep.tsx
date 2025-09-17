'use client'

import { memo, useMemo, useState, useEffect, useCallback } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, BarChart, Clock, Pause, Play, TrendingUp, Activity, ArrowLeft, ChevronRight } from 'lucide-react'
import { ValidationResults, ExtendedValidationResults, ColumnStatistics } from '@/types/smart-flow'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { pyodideStats } from '@/lib/services/pyodide-statistics'
import type { DataValidationStepProps } from '@/types/smart-flow-navigation'
import { logger } from '@/lib/utils/logger'

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
  const [outlierDetection, setOutlierDetection] = useState<Record<string, any>>({})
  const [isCalculating, setIsCalculating] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)
  const [pyodideError, setPyodideError] = useState<string | null>(null)
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

  // 정규성 검정 및 이상치 탐지 수행
  const performStatisticalTests = useCallback(async () => {
    if (!data || !numericColumns.length) return

    setIsCalculating(true)
    setPyodideError(null)
    const normalityResults: Record<string, any> = {}
    const outlierResults: Record<string, any> = {}

    try {
      // Pyodide 초기화 확인
      setPyodideLoading(true)
      await pyodideStats.initialize()
      setPyodideLoading(false)
      for (const col of numericColumns) {
        // 열 데이터 추출
        const columnData = data
          .map((row: Record<string, unknown>) => row[col.name])
          .filter((val: unknown): val is number | string => val !== null && val !== undefined && !isNaN(Number(val)))
          .map((val: number | string) => Number(val))

        if (columnData.length >= 3) {
          // 정규성 검정 (n >= 3)
          try {
            const normality = await pyodideStats.shapiroWilkTest(columnData)
            normalityResults[col.name] = normality
          } catch (err) {
            logger.error(`Normality test failed for ${col.name}`, err)
          }

          // 이상치 탐지 (n >= 4)
          if (columnData.length >= 4) {
            try {
              const outliers = await pyodideStats.detectOutliersIQR(columnData)
              outlierResults[col.name] = outliers
            } catch (err) {
              logger.error(`Outlier detection failed for ${col.name}`, err)
            }
          }
        }
      }

      setNormalityTests(normalityResults)
      setOutlierDetection(outlierResults)
    } catch (error) {
      logger.error('통계 검정 오류', error)
      setPyodideError(error instanceof Error ? error.message : '통계 검정 중 오류가 발생했습니다')
    } finally {
      setIsCalculating(false)
      setPyodideLoading(false)
    }
  }, [data, numericColumns])

  // 컴포넌트 마운트 시 통계 검정 수행
  useEffect(() => {
    performStatisticalTests()
  }, [performStatisticalTests])

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

      {/* 진행 옵션 */}
      <Card className="border-primary/20">
        <CardFooter className="flex items-center justify-between">
          {/* 왼쪽: 이전 단계 버튼 */}
          <Button
            size="sm"
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 단계
          </Button>

          {/* 중앙: 상태 및 자동 진행 옵션 */}
          {!hasErrors && validationResults && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm font-medium">
                  데이터 검증 완료
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {autoProgress ? `${countdown}초 후 자동 진행` : '수동 진행 모드'}
                </p>
              </div>
              {!autoProgress ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAutoProgress(true)
                    setCountdown(5)
                  }}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  자동 진행
                </Button>
              ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleAutoProgress}
                    >
                      {isPaused ? (
                        <><Play className="h-4 w-4 mr-1" /> 계속</>
                      ) : (
                        <><Pause className="h-4 w-4 mr-1" /> 일시정지</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAutoProgress(false)}
                    >
                      자동 진행 끄기
                    </Button>
                  </>
              )}
            </div>
          )}

          {/* 오른쪽: 다음 단계 버튼 */}
          <Button
            size="sm"
            variant="default"
            onClick={onNext}
            disabled={hasErrors || !canGoNext}
          >
            다음 단계
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
        {autoProgress && !isPaused && (
          <div className="px-6 pb-4">
            <Progress value={(5 - countdown) * 20} className="h-2" />
          </div>
        )}
      </Card>

      {/* 상세 정보 탭 */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">데이터 프로파일</TabsTrigger>
          <TabsTrigger value="distribution">분포 진단</TabsTrigger>
          <TabsTrigger value="roadmap">분석 로드맵</TabsTrigger>
        </TabsList>

        {/* 데이터 프로파일 탭 */}
        <TabsContent value="profile" className="space-y-4">
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
        </TabsContent>

        {/* 분포 진단 탭 */}
        <TabsContent value="distribution" className="space-y-4">
          {/* 정규성 검정 결과 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                정규성 검정 (Shapiro-Wilk)
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    const outliers = outlierDetection[col.name]
                    return (
                      <div key={col.name} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{col.name}</span>
                          {outliers && (
                            <div className="flex gap-2">
                              {outliers.mildOutliers?.length > 0 && (
                                <Badge variant="warning">
                                  경미: {outliers.mildOutliers.length}개
                                </Badge>
                              )}
                              {outliers.extremeOutliers?.length > 0 && (
                                <Badge variant="destructive">
                                  극단: {outliers.extremeOutliers.length}개
                                </Badge>
                              )}
                              {outliers.mildOutliers?.length === 0 && outliers.extremeOutliers?.length === 0 && (
                                <Badge variant="success">✔ 이상치 없음</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        {outliers && (
                          <div className="text-xs text-muted-foreground grid grid-cols-4 gap-2">
                            <span>Q1: {outliers.q1?.toFixed(2)}</span>
                            <span>Q3: {outliers.q3?.toFixed(2)}</span>
                            <span>IQR: {outliers.iqr?.toFixed(2)}</span>
                            <span>범위: [{outliers.lowerBound?.toFixed(2)}, {outliers.upperBound?.toFixed(2)}]</span>
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

          {/* 범주형 변수 정보 */}
          {categoricalColumns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>범주형 변수 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoricalColumns.map((stat, idx) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="font-medium">{stat.name}</h4>
                      {stat.topCategories && (
                        <div className="flex flex-wrap gap-2">
                          {stat.topCategories.slice(0, 5).map((cat, i) => (
                            <Badge key={i} variant="outline">
                              {cat.value}: {cat.count}개
                            </Badge>
                          ))}
                          {stat.topCategories.length > 5 && (
                            <Badge variant="secondary">
                              +{stat.topCategories.length - 5}개 더
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 분석 로드맵 탭 */}
        <TabsContent value="roadmap" className="space-y-4">
          <div className="grid gap-4">
            {/* 즉시 가능한 분석 */}
            <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                  <CheckCircle className="h-5 w-5" />
                  🟢 즉시 실행 가능한 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">기술통계</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 평균, 중앙값, 표준편차</li>
                      <li>• 빈도분석, 교차표</li>
                      <li>• 상관분석 (Pearson, Spearman)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">비모수 검정</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Mann-Whitney U test</li>
                      <li>• Wilcoxon signed-rank test</li>
                      <li>• Kruskal-Wallis test</li>
                      <li>• 카이제곱 검정</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 조건부 가능 */}
            <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                  <AlertTriangle className="h-5 w-5" />
                  🟡 전처리 후 가능한 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">t-검정 계열</h4>
                    <p className="text-sm text-muted-foreground mb-1">
                      조건: 정규성 필요 (현재 미검증)
                    </p>
                    <p className="text-xs text-yellow-600">
                      → 대안: 비모수 검정 사용
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">회귀분석</h4>
                    <p className="text-sm text-muted-foreground mb-1">
                      조건: 다중공선성 확인 (VIF &lt; 10)
                    </p>
                    <p className="text-xs text-yellow-600">
                      → 주의: 이상치 처리 필요
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 불가능 */}
            <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
                  <XCircle className="h-5 w-5" />
                  🔴 현재 불가능한 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">시계열 분석</h4>
                    <p className="text-sm text-muted-foreground mb-1">
                      필요: 시간 변수 (날짜/시간)
                    </p>
                    <p className="text-xs text-red-600">
                      → 현재: 시간 정보 없음
                    </p>
                  </div>
                  {!columnStats?.some(s => s.type === 'numeric' && s.uniqueValues > 2) && (
                    <div>
                      <h4 className="font-medium mb-2">요인분석</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        필요: 3개 이상 관련 변수
                      </p>
                      <p className="text-xs text-red-600">
                        → 현재: 변수 수 부족
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
})