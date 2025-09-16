'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Upload, CheckCircle, BarChart3, FileText, Sparkles, HelpCircle, X } from 'lucide-react'
import { ProgressStepper } from '@/components/smart-flow/ProgressStepper'
import { DataUploadStep } from '@/components/smart-flow/steps/DataUploadStep'
import { DataValidationStep } from '@/components/smart-flow/steps/DataValidationStep'
import { PurposeInputStepWithModes } from '@/components/smart-flow/steps/PurposeInputStep-with-modes'
import { AnalysisExecutionStep } from '@/components/smart-flow/steps/AnalysisExecutionStep'
import { ResultsActionStep } from '@/components/smart-flow/steps/ResultsActionStep'
import { useSmartFlowStore } from '@/lib/stores/smart-flow-store'
import { 
  StepConfig, 
  ValidationResults, 
  StatisticalMethod, 
  AnalysisResult 
} from '@/types/smart-flow'

const steps: StepConfig[] = [
  { id: 1, name: '데이터 업로드', icon: Upload, description: '분석할 데이터 파일을 업로드하세요' },
  { id: 2, name: '데이터 검증', icon: CheckCircle, description: '데이터를 자동으로 검증합니다' },
  { id: 3, name: '분석 목적', icon: Sparkles, description: '무엇을 알고 싶은지 알려주세요' },
  { id: 4, name: '통계 분석', icon: BarChart3, description: '최적의 통계 방법으로 분석합니다' },
  { id: 5, name: '결과 및 액션', icon: FileText, description: '결과를 확인하고 다음 단계를 선택하세요' }
]

export default function SmartFlowPageRefactored() {
  const [showHelp, setShowHelp] = useState(false)
  const [systemMemory, setSystemMemory] = useState<number | null>(null)
  
  // 시스템 메모리 감지 (Navigator API)
  useEffect(() => {
    // @ts-ignore - Navigator.deviceMemory는 실험적 기능
    if (typeof navigator !== 'undefined' && navigator.deviceMemory) {
      // @ts-ignore
      setSystemMemory(navigator.deviceMemory) // GB 단위
    }
  }, [])
  
  // Zustand store 사용 (세션 스토리지 자동 저장/복원)
  const {
    currentStep,
    completedSteps,
    uploadedFile,
    uploadedData,
    validationResults,
    selectedMethod,
    analysisResults,
    isLoading,
    error,
    setCurrentStep,
    setUploadedFile,
    setUploadedData,
    setValidationResults,
    setAnalysisPurpose,
    setSelectedMethod,
    setAnalysisResults,
    setError,
    canProceedToNext,
    goToNextStep,
    goToPreviousStep,
    addCompletedStep,
    reset
  } = useSmartFlowStore()

  const handleStepClick = useCallback((stepId: number) => {
    if (stepId <= Math.max(...completedSteps, 1)) {
      setCurrentStep(stepId)
    }
  }, [completedSteps, setCurrentStep])

  const handleUploadComplete = useCallback((file: File, data: any[]) => {
    try {
      setUploadedFile(file)
      setUploadedData(data)
      
      // 향상된 데이터 검증
      const validation = performDataValidation(data)
      setValidationResults(validation)
      
      // 검증 성공 시 다음 단계로
      if (validation.isValid) {
        goToNextStep()
      }
    } catch (err) {
      setError('데이터 업로드 중 오류가 발생했습니다: ' + (err as Error).message)
    }
  }, [setUploadedFile, setUploadedData, setValidationResults, goToNextStep, setError])

  const handlePurposeSubmit = useCallback((purpose: string, method: StatisticalMethod) => {
    setAnalysisPurpose(purpose)
    setSelectedMethod(method)
    goToNextStep()
  }, [setAnalysisPurpose, setSelectedMethod, goToNextStep])

  const handleAnalysisComplete = useCallback((results: AnalysisResult) => {
    setAnalysisResults(results)
    goToNextStep()
  }, [setAnalysisResults, goToNextStep])

  // 향상된 데이터 검증 함수
  const performDataValidation = (data: any[]): ValidationResults => {
    const validation: ValidationResults = {
      isValid: true,
      totalRows: data.length,
      columnCount: data.length > 0 ? Object.keys(data[0]).length : 0,
      missingValues: 0,
      dataType: '수치형',
      variables: data.length > 0 ? Object.keys(data[0]) : [],
      errors: [],
      warnings: []
    }
    
    // 데이터 크기 제한 상수
    const MAX_ROWS = 100000  // 10만 행 제한 (브라우저 메모리 고려)
    const MAX_COLS = 1000    // 1000개 컬럼 제한
    const WARN_ROWS = 10000  // 1만 행 이상 시 경고
    const MIN_ROWS = 3       // 최소 3개 행 필요
    
    // 1. 데이터 크기 검증
    if (data.length === 0) {
      validation.errors.push('데이터가 비어있습니다')
      validation.isValid = false
    } else if (data.length < MIN_ROWS) {
      validation.warnings.push(`데이터가 ${MIN_ROWS}개 미만입니다. 통계 분석이 제한될 수 있습니다.`)
    } else if (data.length > MAX_ROWS) {
      validation.errors.push(`데이터가 ${MAX_ROWS.toLocaleString()}행을 초과합니다. 브라우저 성능 문제로 처리할 수 없습니다.`)
      validation.isValid = false
    } else if (data.length > WARN_ROWS) {
      validation.warnings.push(`데이터가 ${WARN_ROWS.toLocaleString()}행 이상입니다. 처리 시간이 길어질 수 있습니다.`)
    }
    
    // 컬럼 수 검증
    if (validation.columnCount > MAX_COLS) {
      validation.errors.push(`컬럼이 ${MAX_COLS}개를 초과합니다. 데이터를 줄여주세요.`)
      validation.isValid = false
    } else if (validation.columnCount > 100) {
      validation.warnings.push('컬럼이 100개 이상입니다. 분석에 필요한 컬럼만 선택하는 것을 권장합니다.')
    }
    
    // 2. 결측값 검사
    let missingCount = 0
    data.forEach((row, rowIdx) => {
      Object.entries(row).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          missingCount++
        }
      })
    })
    validation.missingValues = missingCount
    
    if (missingCount > 0) {
      const missingRatio = missingCount / (data.length * validation.columnCount)
      if (missingRatio > 0.2) {
        validation.warnings.push(`결측값이 ${(missingRatio * 100).toFixed(1)}% 있습니다. 데이터 품질을 확인하세요.`)
      }
    }
    
    // 3. 데이터 타입 검사
    const numericColumns: string[] = []
    const categoricalColumns: string[] = []
    
    if (data.length > 0) {
      Object.keys(data[0]).forEach(col => {
        const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '')
        const isNumeric = values.every(v => !isNaN(Number(v)))
        
        if (isNumeric) {
          numericColumns.push(col)
        } else {
          categoricalColumns.push(col)
        }
      })
    }
    
    if (numericColumns.length === 0) {
      validation.warnings.push('수치형 데이터가 없습니다. 통계 분석이 제한될 수 있습니다.')
    }
    
    // 4. 이상치 검사 (간단한 IQR 방법)
    numericColumns.forEach(col => {
      const values = data.map(row => Number(row[col])).filter(v => !isNaN(v)).sort((a, b) => a - b)
      if (values.length > 4) {
        const q1 = values[Math.floor(values.length * 0.25)]
        const q3 = values[Math.floor(values.length * 0.75)]
        const iqr = q3 - q1
        const lowerBound = q1 - 1.5 * iqr
        const upperBound = q3 + 1.5 * iqr
        
        const outliers = values.filter(v => v < lowerBound || v > upperBound)
        if (outliers.length > 0) {
          validation.warnings.push(`'${col}' 컬럼에 ${outliers.length}개의 이상치가 감지되었습니다.`)
        }
      }
    })
    
    return validation
  }
  
  // 데이터 정보 추출 (PurposeInputStep에 전달용)
  const getDataInfo = () => {
    if (!uploadedData || uploadedData.length === 0) return null
    
    const numericColumns = Object.keys(uploadedData[0]).filter(col => {
      const values = uploadedData.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '')
      return values.every(v => !isNaN(Number(v)))
    })
    
    const categoricalColumns = Object.keys(uploadedData[0]).filter(col => {
      const values = uploadedData.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '')
      return !values.every(v => !isNaN(Number(v)))
    })
    
    return {
      columnCount: Object.keys(uploadedData[0]).length,
      rowCount: uploadedData.length,
      hasNumeric: numericColumns.length > 0,
      hasCategorical: categoricalColumns.length > 0
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-6xl mx-auto p-6 space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-2 relative">
          <h1 className="text-4xl font-bold tracking-tight">스마트 통계 분석</h1>
          <p className="text-muted-foreground text-lg">
            단계별 안내를 따라 쉽고 정확한 통계 분석을 진행하세요
          </p>
          
          {/* 도움말 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="absolute right-0 top-0"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            데이터 제한 안내
          </Button>
        </div>
        
        {/* 도움말 패널 */}
        {showHelp && (
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">💾 데이터 크기 가이드</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">현재 제한사항</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 최대 파일: 50MB</li>
                    <li>• 최대 데이터: 100,000행 × 1,000열</li>
                    <li>• 권장: 10,000행 이하 (빠른 처리)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">메모리별 권장 크기</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 4GB RAM: ~10,000행</li>
                    <li>• 8GB RAM: ~30,000행</li>
                    <li>• 16GB RAM: ~60,000행</li>
                    {systemMemory && (
                      <li className="font-medium text-blue-600 dark:text-blue-400">
                        → 감지된 메모리: {systemMemory}GB
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-lg p-3">
                <p className="text-sm">
                  <strong>💡 팁:</strong> 브라우저는 시스템 메모리의 25-50%만 사용 가능합니다.
                  대용량 데이터는 샘플링하거나 필요한 컬럼만 선택하세요.
                </p>
              </div>
              
              <div className="text-sm text-center">
                <a 
                  href="/help#data-limits" 
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  자세한 도움말 보기 →
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Stepper */}
        <ProgressStepper 
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

        {/* 에러 메시지 표시 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-600 dark:text-red-400 font-medium">오류:</span>
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* 메인 콘텐츠 영역 */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center space-x-3">
              {(() => {
                const Icon = steps[currentStep - 1].icon
                return <Icon className="w-6 h-6 text-primary" />
              })()}
              <div>
                <CardTitle>Step {currentStep}: {steps[currentStep - 1].name}</CardTitle>
                <CardDescription>{steps[currentStep - 1].description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="min-h-[400px] relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">처리 중...</span>
                </div>
              </div>
            )}
            
            {currentStep === 1 && (
              <DataUploadStep onUploadComplete={handleUploadComplete} />
            )}

            {currentStep === 2 && (
              <DataValidationStep 
                validationResults={validationResults}
                data={uploadedData}
              />
            )}

            {currentStep === 3 && (
              <PurposeInputStepWithModes 
                onPurposeSubmit={handlePurposeSubmit}
                dataInfo={getDataInfo()}
              />
            )}

            {currentStep === 4 && (
              <AnalysisExecutionStep 
                method={selectedMethod?.name || null}
                onAnalysisComplete={handleAnalysisComplete}
              />
            )}

            {currentStep === 5 && (
              <ResultsActionStep results={analysisResults} />
            )}
          </CardContent>
        </Card>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={goToPreviousStep}
              disabled={currentStep === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              이전 단계
            </Button>
            
            {/* 초기화 버튼 - 언제든 처음부터 다시 시작 가능 */}
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm('모든 데이터를 초기화하고 처음부터 다시 시작하시겠습니까?')) {
                  reset()
                  window.location.reload() // 완전 초기화
                }
              }}
              disabled={isLoading}
              className="text-muted-foreground hover:text-destructive"
            >
              처음부터 다시
            </Button>
          </div>
          
          <Button 
            onClick={goToNextStep}
            disabled={currentStep === 5 || !canProceedToNext() || isLoading}
          >
            다음 단계
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}