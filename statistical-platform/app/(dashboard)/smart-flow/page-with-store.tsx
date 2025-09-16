'use client'

import { useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Upload, CheckCircle, BarChart3, FileText, Sparkles } from 'lucide-react'
import { ProgressStepper } from '@/components/smart-flow/ProgressStepper'
import { DataUploadStep } from '@/components/smart-flow/steps/DataUploadStep'
import { DataValidationStep } from '@/components/smart-flow/steps/DataValidationStep'
import { PurposeInputStep } from '@/components/smart-flow/steps/PurposeInputStep'
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

export default function SmartFlowPageWithStore() {
  // Zustand store 사용
  const {
    currentStep,
    completedSteps,
    uploadedFile,
    uploadedData,
    validationResults,
    selectedMethod,
    analysisResults,
    setCurrentStep,
    setUploadedFile,
    setUploadedData,
    setValidationResults,
    setAnalysisPurpose,
    setSelectedMethod,
    setAnalysisResults,
    canProceedToNext,
    goToNextStep,
    goToPreviousStep,
  } = useSmartFlowStore()

  const handleStepClick = useCallback((stepId: number) => {
    if (stepId <= Math.max(...completedSteps, 1)) {
      setCurrentStep(stepId)
    }
  }, [completedSteps, setCurrentStep])

  const handleUploadComplete = useCallback((file: File, data: any[]) => {
    setUploadedFile(file)
    setUploadedData(data)
    
    // 자동 검증 수행
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
    
    // 검증 로직
    if (data.length < 3) {
      validation.warnings.push('데이터가 3개 미만입니다. 통계 분석이 제한될 수 있습니다.')
    }
    
    // 결측값 체크
    let missingCount = 0
    data.forEach(row => {
      Object.values(row).forEach(value => {
        if (value === null || value === undefined || value === '') {
          missingCount++
        }
      })
    })
    validation.missingValues = missingCount
    
    if (missingCount > 0) {
      validation.warnings.push(`${missingCount}개의 결측값이 발견되었습니다.`)
    }
    
    setValidationResults(validation)
    goToNextStep()
  }, [setUploadedFile, setUploadedData, setValidationResults, goToNextStep])

  const handlePurposeSubmit = useCallback((purpose: string, method: StatisticalMethod) => {
    setAnalysisPurpose(purpose)
    setSelectedMethod(method)
    goToNextStep()
  }, [setAnalysisPurpose, setSelectedMethod, goToNextStep])

  const handleAnalysisComplete = useCallback((results: AnalysisResult) => {
    setAnalysisResults(results)
    goToNextStep()
  }, [setAnalysisResults, goToNextStep])

  // 4단계에서 자동으로 분석 시작
  useEffect(() => {
    if (currentStep === 4 && !analysisResults) {
      // AnalysisExecutionStep이 자동으로 처리
    }
  }, [currentStep, analysisResults])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-6xl mx-auto p-6 space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">스마트 통계 분석</h1>
          <p className="text-muted-foreground text-lg">
            단계별 안내를 따라 쉽고 정확한 통계 분석을 진행하세요
          </p>
        </div>

        {/* Progress Stepper */}
        <ProgressStepper 
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

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
          
          <CardContent className="min-h-[400px]">
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
              <PurposeInputStep onPurposeSubmit={handlePurposeSubmit} />
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
          <Button 
            variant="outline" 
            onClick={goToPreviousStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            이전 단계
          </Button>
          
          <div className="flex gap-2">
            {currentStep === 5 && (
              <Button 
                variant="outline"
                onClick={() => {
                  setCurrentStep(1)
                  setUploadedFile(null)
                  setUploadedData(null)
                  setValidationResults(null)
                  setSelectedMethod(null)
                  setAnalysisResults(null)
                }}
              >
                새 분석 시작
              </Button>
            )}
            
            <Button 
              onClick={goToNextStep}
              disabled={currentStep === 5 || !canProceedToNext()}
            >
              다음 단계
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
        
        {/* 디버그 정보 (개발 중에만 표시) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-xs">
            <p>현재 단계: {currentStep}</p>
            <p>완료된 단계: {completedSteps.join(', ')}</p>
            <p>파일 업로드: {uploadedFile ? '✅' : '❌'}</p>
            <p>데이터 로드: {uploadedData ? `✅ (${uploadedData.length}행)` : '❌'}</p>
            <p>검증 완료: {validationResults ? '✅' : '❌'}</p>
            <p>방법 선택: {selectedMethod ? `✅ (${selectedMethod.name})` : '❌'}</p>
            <p>분석 완료: {analysisResults ? '✅' : '❌'}</p>
          </div>
        )}
      </div>
    </div>
  )
}