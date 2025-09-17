'use client'

import { memo, useMemo, useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { ColumnStatistics } from '@/types/smart-flow'
import { workerManager, shouldUseWorker } from '@/lib/services/worker-manager'

// Import refactored components
import { DataSummaryCard } from './validation/summary/DataSummaryCard'
import { ColumnStatsTable } from './validation/summary/ColumnStatsTable'
import { CorrelationHeatmap } from './validation/charts/CorrelationHeatmap'
import { ColumnDetailModal } from './validation/charts/ColumnDetailModal'

// Import utils and types
import {
  DataValidationStepProps,
  hasColumnStats,
  isNumericColumn,
  isCategoricalColumn
} from './validation/constants/validationTypes'
import { calculateCorrelationMatrix } from './validation/utils/correlationUtils'

export const DataValidationStepRefactored = memo(function DataValidationStepRefactored({
  validationResults,
  data
}: DataValidationStepProps) {
  const [selectedColumn, setSelectedColumn] = useState<ColumnStatistics | null>(null)
  const [showVisualization, setShowVisualization] = useState(false)
  const [correlationMatrix, setCorrelationMatrix] = useState<{
    matrix: number[][]
    labels: string[]
  } | null>(null)
  const [isCalculatingCorrelation, setIsCalculatingCorrelation] = useState(false)

  // Empty state
  if (!validationResults || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">데이터를 먼저 업로드해주세요.</p>
      </div>
    )
  }

  const hasErrors = validationResults.errors.length > 0
  const hasWarnings = validationResults.warnings.length > 0

  // Extract column stats
  const columnStats = useMemo(() =>
    hasColumnStats(validationResults) ? validationResults.columnStats : undefined,
    [validationResults]
  )

  // Filter numeric and categorical columns
  const numericColumns = useMemo(() =>
    columnStats?.filter(isNumericColumn) || [],
    [columnStats]
  )

  const categoricalColumns = useMemo(() =>
    columnStats?.filter(isCategoricalColumn) || [],
    [columnStats]
  )

  // Calculate correlation matrix for numeric columns
  useEffect(() => {
    if (!numericColumns.length || numericColumns.length < 2 || !data) {
      setCorrelationMatrix(null)
      return
    }

    const columnsToUse = numericColumns.slice(0, 10) // Limit to 10 columns for performance
    const calculateAsync = async () => {
      setIsCalculatingCorrelation(true)

      try {
        // Check if should use worker for large datasets
        if (shouldUseWorker(data.length * columnsToUse.length)) {
          const result = await workerManager.calculateCorrelationMatrix(
            data,
            columnsToUse.map(c => c.name)
          )
          setCorrelationMatrix(result)
        } else {
          // Calculate directly for small datasets
          const result = calculateCorrelationMatrix(
            data,
            columnsToUse.map(c => c.name)
          )
          setCorrelationMatrix(result)
        }
      } catch (error) {
        console.error('Error calculating correlation matrix:', error)
        // User-friendly error handling
        setCorrelationMatrix(null)
      } finally {
        setIsCalculatingCorrelation(false)
      }
    }

    calculateAsync()
  }, [numericColumns, data])

  // Handle column detail view
  const handleColumnClick = useCallback((column: ColumnStatistics) => {
    setSelectedColumn(column)
    setShowVisualization(true)
  }, [])

  // Analysis recommendations based on data characteristics
  const getAnalysisRecommendations = () => {
    const recommendations = []

    if (numericColumns.length >= 2) {
      recommendations.push({
        icon: '📊',
        text: '수치형 변수가 2개 이상 있어 상관분석, 회귀분석이 가능합니다.'
      })
    }

    if (categoricalColumns.length >= 1 && numericColumns.length >= 1) {
      recommendations.push({
        icon: '📈',
        text: '범주형과 수치형 변수가 있어 t-검정, ANOVA 분석이 가능합니다.'
      })
    }

    if (columnStats && columnStats.some(s => s.outliers && s.outliers.length > 0)) {
      recommendations.push({
        icon: '💡',
        text: '이상치가 발견되었습니다. 비모수 검정 방법 사용을 고려해보세요.'
      })
    }

    if (columnStats && columnStats.some(s => s.missingCount > validationResults.totalRows * 0.2)) {
      recommendations.push({
        icon: '⚠️',
        text: '결측값이 20% 이상인 변수가 있습니다. 해당 변수 제외 또는 대체값 사용을 고려하세요.'
      })
    }

    if (!hasErrors && !hasWarnings) {
      recommendations.push({
        icon: '✅',
        text: '데이터 품질이 양호합니다. 모든 통계 분석 방법을 사용할 수 있습니다.'
      })
    }

    return recommendations
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">요약</TabsTrigger>
          <TabsTrigger value="columns">변수별 통계</TabsTrigger>
          <TabsTrigger value="correlation" disabled={numericColumns.length < 2}>
            상관관계
          </TabsTrigger>
          <TabsTrigger value="recommendations">분석 추천</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <DataSummaryCard validationResults={validationResults} />
        </TabsContent>

        {/* Column Statistics Tab */}
        <TabsContent value="columns" className="space-y-4">
          {columnStats && columnStats.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>변수별 상세 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <ColumnStatsTable
                  columnStats={columnStats}
                  onColumnClick={handleColumnClick}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  변수 통계 정보가 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Correlation Tab */}
        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>변수 간 상관관계</CardTitle>
            </CardHeader>
            <CardContent>
              {isCalculatingCorrelation ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">상관관계 계산 중...</p>
                  </div>
                </div>
              ) : correlationMatrix ? (
                <div className="h-[500px]">
                  <CorrelationHeatmap
                    matrix={correlationMatrix.matrix}
                    labels={correlationMatrix.labels}
                    height={480}
                  />
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  상관관계 분석을 위해 2개 이상의 수치형 변수가 필요합니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                분석 추천
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {getAnalysisRecommendations().map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span>{rec.icon}</span>
                    <span>{rec.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Column Detail Modal */}
      <ColumnDetailModal
        column={selectedColumn}
        isOpen={showVisualization}
        onOpenChange={setShowVisualization}
        data={data}
      />
    </div>
  )
})