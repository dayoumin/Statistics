"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, BarChart3, Loader2 } from "lucide-react"
import { isPyodideReady } from "@/lib/pyodide-runtime-loader"

interface Dataset {
  id: string
  name: string
  rows: number
  columns: number
}

interface AnalysisSettingsFormProps {
  datasets: Dataset[]
  selectedDataset: string
  selectedColumns: string[]
  analysisType: string
  significanceLevel: string
  numericColumns: string[]
  isCalculating: boolean
  error: string | null
  onDatasetChange: (value: string) => void
  onColumnToggle: (column: string) => void
  onAnalysisTypeChange: (value: string) => void
  onSignificanceLevelChange: (value: string) => void
  onRunAnalysis: () => void
}

export function AnalysisSettingsForm({
  datasets,
  selectedDataset,
  selectedColumns,
  analysisType,
  significanceLevel,
  numericColumns,
  isCalculating,
  error,
  onDatasetChange,
  onColumnToggle,
  onAnalysisTypeChange,
  onSignificanceLevelChange,
  onRunAnalysis
}: AnalysisSettingsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>통계 분석 설정</CardTitle>
        <CardDescription>
          데이터셋과 분석 방법을 선택하여 통계 분석을 수행하세요
          {!isPyodideReady() && " (기본 JavaScript 통계 기능만 사용 가능)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="dataset">데이터셋 선택</Label>
          <Select value={selectedDataset} onValueChange={onDatasetChange}>
            <SelectTrigger>
              <SelectValue placeholder="데이터셋을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {datasets.map((ds) => (
                <SelectItem key={ds.id} value={ds.id}>
                  {ds.name} ({ds.rows.toLocaleString()}행, {ds.columns}열)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {numericColumns.length > 0 && (
          <div>
            <Label>분석할 컬럼 선택 (숫자형 컬럼만 표시)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {numericColumns.map(col => (
                <Button
                  key={col}
                  variant={selectedColumns.includes(col) ? "default" : "outline"}
                  size="sm"
                  onClick={() => onColumnToggle(col)}
                >
                  {col}
                </Button>
              ))}
            </div>
            {selectedColumns.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                선택된 컬럼: {selectedColumns.join(", ")}
              </p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="analysisType">분석 방법</Label>
          <Select value={analysisType} onValueChange={onAnalysisTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="분석 방법을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="descriptive">기술통계 (평균, 표준편차 등)</SelectItem>
              <SelectItem value="ttest_one">단일표본 t검정</SelectItem>
              <SelectItem value="ttest_two">독립표본 t검정</SelectItem>
              <SelectItem value="correlation">피어슨 상관분석</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="significance">유의수준</Label>
          <Select value={significanceLevel} onValueChange={onSignificanceLevelChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.01">0.01 (99% 신뢰도)</SelectItem>
              <SelectItem value="0.05">0.05 (95% 신뢰도)</SelectItem>
              <SelectItem value="0.10">0.10 (90% 신뢰도)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={onRunAnalysis}
          disabled={!selectedDataset || selectedColumns.length === 0 || !analysisType || isCalculating}
          className="w-full"
        >
          {isCalculating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <BarChart3 className="h-4 w-4 mr-2" />
              분석 실행
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}