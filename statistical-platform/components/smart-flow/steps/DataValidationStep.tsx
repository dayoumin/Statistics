'use client'

import { memo, useMemo } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, BarChart } from 'lucide-react'
import { ValidationResults, ExtendedValidationResults, ColumnStatistics } from '@/types/smart-flow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface DataValidationStepProps {
  validationResults: ValidationResults | ExtendedValidationResults | null
  data: any[] | null
}

// Type guard for ExtendedValidationResults
function hasColumnStats(results: ValidationResults | null): results is ExtendedValidationResults {
  return results !== null && 'columnStats' in results
}

export const DataValidationStep = memo(function DataValidationStep({
  validationResults,
  data
}: DataValidationStepProps) {
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

  return (
    <div className="space-y-6">
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

      {/* 상세 정보 탭 */}
      <Tabs defaultValue="variables" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="variables">변수 정보</TabsTrigger>
          <TabsTrigger value="statistics">기초 통계</TabsTrigger>
          <TabsTrigger value="issues">문제점</TabsTrigger>
        </TabsList>

        {/* 변수 정보 탭 */}
        <TabsContent value="variables" className="space-y-4">
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

        {/* 기초 통계 탭 */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>수치형 변수 기초통계</CardTitle>
            </CardHeader>
            <CardContent>
              {numericColumns.length > 0 ? (
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
                        <th className="text-right p-2">이상치</th>
                      </tr>
                    </thead>
                    <tbody>
                      {numericColumns.map((stat, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2 font-medium">{stat.name}</td>
                            <td className="text-right p-2">{stat.mean?.toFixed(2)}</td>
                            <td className="text-right p-2">{stat.median?.toFixed(2)}</td>
                            <td className="text-right p-2">{stat.std?.toFixed(2)}</td>
                            <td className="text-right p-2">{stat.min?.toFixed(2)}</td>
                            <td className="text-right p-2">{stat.max?.toFixed(2)}</td>
                            <td className="text-right p-2">
                              {stat.outliers?.length || 0}개
                              {stat.outliers && stat.outliers.length > 0 && (
                                <span className="text-yellow-600 ml-1">
                                  ({((stat.outliers.length / stat.numericCount) * 100).toFixed(1)}%)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
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

        {/* 문제점 탭 */}
        <TabsContent value="issues" className="space-y-4">
          {hasErrors && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900 dark:text-red-100">
                  <XCircle className="inline w-5 h-5 mr-2" />
                  오류
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
                  {validationResults.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {hasWarnings && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-900 dark:text-yellow-100">
                  <AlertTriangle className="inline w-5 h-5 mr-2" />
                  경고
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {validationResults.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {!hasErrors && !hasWarnings && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100">
                  <CheckCircle className="inline w-5 h-5 mr-2" />
                  확인사항
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• 모든 데이터가 정상적으로 로드되었습니다</li>
                  <li>• 데이터 타입이 일관성 있게 검출되었습니다</li>
                  <li>• 통계 분석을 진행할 준비가 되었습니다</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 데이터 품질 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Info className="inline w-5 h-5 mr-2" />
                데이터 품질 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>결측값 비율</span>
                <span className="font-medium">
                  {((validationResults.missingValues / (validationResults.totalRows * validationResults.columnCount)) * 100).toFixed(1)}%
                </span>
              </div>
              {columnStats && (
                <>
                  <div className="flex justify-between">
                    <span>혼합 타입 변수</span>
                    <span className="font-medium">
                      {columnStats.filter(s => s.type === 'mixed').length}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>이상치 포함 변수</span>
                    <span className="font-medium">
                      {columnStats.filter(s => s.outliers && s.outliers.length > 0).length}개
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
})