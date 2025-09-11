"use client"

import { useState, useEffect, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { 
  calculateDescriptiveStats, 
  oneSampleTTest, 
  twoSampleTTest, 
  pearsonCorrelation,
  type DescriptiveStatistics,
  type StatisticalTestResult 
} from "@/lib/statistics"
import { 
  loadPyodideRuntime, 
  subscribeToPyodide, 
  getPyodideState,
  isPyodideReady,
  type PyodideState 
} from "@/lib/pyodide-runtime-loader"
import { PyodideStatusCard } from "./pyodide-status-card"
import { AnalysisSettingsForm } from "./analysis-settings-form"
import { AnalysisResultsDisplay } from "./analysis-results-display"
import { ERROR_MESSAGES, STATISTICS } from "@/lib/constants"
import { validateAnalysisAssumptions, extractColumnData } from "@/lib/data-validation"
import { createCleanupManager } from "@/lib/cleanup-utils"

interface StatisticalAnalysisRuntimeProps {
  datasetId?: string
  testType?: string
}

export function StatisticalAnalysisRuntime({ datasetId, testType }: StatisticalAnalysisRuntimeProps) {
  const { datasets, getDatasetById, addAnalysisResult } = useAppStore()
  const [selectedDataset, setSelectedDataset] = useState<string>(datasetId || "")
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [analysisType, setAnalysisType] = useState<string>(testType || "")
  const [significanceLevel, setSignificanceLevel] = useState<string>("0.05")
  const [isCalculating, setIsCalculating] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Pyodide 상태 관리
  const [pyodideState, setPyodideState] = useState<PyodideState>(getPyodideState())

  useEffect(() => {
    const cleanup = createCleanupManager()
    
    // Pyodide 구독 등록
    const unsubscribe = subscribeToPyodide(setPyodideState)
    cleanup.register(unsubscribe)

    return () => {
      cleanup.cleanup()
    }
  }, [])

  // 데이터셋 정보
  const dataset = selectedDataset ? getDatasetById(selectedDataset) : null
  const numericColumns = useMemo(() => {
    if (!dataset?.data) return []
    
    const firstRow = dataset.data[0]
    if (!firstRow) return []
    
    return Object.keys(firstRow).filter(col => {
      const values = dataset.data!.slice(0, 10).map(row => row[col])
      return values.some(val => !isNaN(Number(val)) && val !== '' && val !== null)
    })
  }, [dataset])

  // 컬럼 토글 핸들러
  const handleColumnToggle = (col: string) => {
    setSelectedColumns(prev => 
      prev.includes(col) 
        ? prev.filter(c => c !== col)
        : [...prev, col]
    )
  }

  // 분석 실행
  const runAnalysis = async () => {
    if (!dataset?.data || selectedColumns.length === 0) {
      setError(ERROR_MESSAGES.INVALID_DATASET)
      return
    }

    if (!isPyodideReady()) {
      setError(ERROR_MESSAGES.PYODIDE_NOT_READY)
      return
    }

    setIsCalculating(true)
    setError(null)
    
    try {
      // 선택된 컬럼의 숫자 데이터 추출
      const columnData = selectedColumns.map(col => {
        return dataset.data!
          .map(row => Number(row[col]))
          .filter(val => !isNaN(val))
      })

      let analysisResult: any = null

      // 기본 JavaScript 통계 (백업용)
      if (analysisType === "descriptive") {
        analysisResult = {
          type: "descriptive",
          method: "JavaScript 기술통계",
          results: columnData.map((data, index) => ({
            column: selectedColumns[index],
            stats: calculateDescriptiveStats(data)
          })),
          timestamp: new Date()
        }
      } else if (analysisType === "ttest_one" && columnData.length >= 1) {
        const testValue = STATISTICS.TEST_VALUES.DEFAULT_ONE_SAMPLE
        const testResult = oneSampleTTest(columnData[0], testValue)
        analysisResult = {
          type: "ttest_one",
          method: "단일표본 t검정",
          testValue,
          column: selectedColumns[0],
          results: testResult,
          timestamp: new Date()
        }
      } else if (analysisType === "ttest_two" && columnData.length >= 2) {
        const testResult = twoSampleTTest(columnData[0], columnData[1])
        analysisResult = {
          type: "ttest_two", 
          method: "독립표본 t검정",
          columns: selectedColumns.slice(0, 2),
          results: testResult,
          timestamp: new Date()
        }
      } else if (analysisType === "correlation" && columnData.length >= 2) {
        const corrResult = pearsonCorrelation(columnData[0], columnData[1])
        analysisResult = {
          type: "correlation",
          method: "피어슨 상관분석",
          columns: selectedColumns.slice(0, 2),
          results: corrResult,
          timestamp: new Date()
        }
      }

      if (analysisResult) {
        setResults(analysisResult)
        
        // 분석 결과를 스토어에 저장
        addAnalysisResult({
          datasetId: selectedDataset,
          datasetName: dataset.name,
          testType: analysisType,
          testName: analysisResult.method,
          method: analysisResult.method,
          parameters: {
            columns: selectedColumns,
            significanceLevel: Number(significanceLevel)
          },
          results: {
            testStatistic: analysisResult.results?.testStatistic || 0,
            pValue: analysisResult.results?.pValue || 0,
            effectSize: analysisResult.results?.effectSize || null,
            confidenceInterval: analysisResult.results?.confidenceInterval || null,
            conclusion: analysisResult.results?.conclusion || "",
            interpretation: analysisResult.results?.interpretation || ""
          },
          assumptions: {
            normality: [],
            homogeneity: [],
            independence: true
          },
          recommendations: [],
          visualizations: [],
          status: 'completed',
          timestamp: new Date()
        })
      } else {
        setError(ERROR_MESSAGES.INSUFFICIENT_DATA)
      }

    } catch (err) {
      console.error("분석 오류:", err)
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.")
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PyodideStatusCard 
        pyodideState={pyodideState}
        onStartLoading={() => loadPyodideRuntime()}
      />

      <AnalysisSettingsForm
        datasets={datasets}
        selectedDataset={selectedDataset}
        selectedColumns={selectedColumns}
        analysisType={analysisType}
        significanceLevel={significanceLevel}
        numericColumns={numericColumns}
        isCalculating={isCalculating}
        error={error}
        onDatasetChange={setSelectedDataset}
        onColumnToggle={handleColumnToggle}
        onAnalysisTypeChange={setAnalysisType}
        onSignificanceLevelChange={setSignificanceLevel}
        onRunAnalysis={runAnalysis}
      />

      <AnalysisResultsDisplay results={results} />
    </div>
  )
}