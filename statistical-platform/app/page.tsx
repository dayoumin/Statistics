'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Upload, CheckCircle, BarChart3, FileText, Sparkles, HelpCircle, X, Clock } from 'lucide-react'
import { ProgressStepper } from '@/components/smart-flow/ProgressStepper'
import { DataUploadStep } from '@/components/smart-flow/steps/DataUploadStep'
import { DataValidationStep } from '@/components/smart-flow/steps/DataValidationStep'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PurposeInputStep } from '@/components/smart-flow/steps/PurposeInputStep'
import { AnalysisExecutionStep } from '@/components/smart-flow/steps/AnalysisExecutionStep'
import { ResultsActionStep } from '@/components/smart-flow/steps/ResultsActionStep'
import { AnalysisHistoryPanel } from '@/components/smart-flow/AnalysisHistoryPanel'
import { useSmartFlowStore } from '@/lib/stores/smart-flow-store'
import { DataValidationService } from '@/lib/services/data-validation-service'
import {
  StepConfig,
  ValidationResults,
  StatisticalMethod,
  AnalysisResult,
  DataRow
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
  const [showHistory, setShowHistory] = useState(false)
  const [systemMemory, setSystemMemory] = useState<number | null>(null)
  
  // 시스템 메모리 감지 (Navigator API)
  useEffect(() => {
    interface NavigatorWithMemory extends Navigator {
      deviceMemory?: number
    }

    if (typeof navigator !== 'undefined') {
      const nav = navigator as NavigatorWithMemory
      if (nav.deviceMemory) {
        setSystemMemory(nav.deviceMemory) // GB 단위
      }
    }
  }, [])
  
  // Zustand store 사용 (세션 스토리지 자동 저장/복원)
  const {
    currentStep,
    completedSteps,
    _uploadedFile,
    uploadedData,
    validationResults,
    selectedMethod,
    analysisResults,
    isLoading,
    error,
    _setCurrentStep,
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
    _addCompletedStep,
    reset,
    navigateToStep,
    canNavigateToStep
  } = useSmartFlowStore()

  const handleStepClick = useCallback((stepId: number) => {
    if (canNavigateToStep(stepId)) {
      navigateToStep(stepId)
    }
  }, [canNavigateToStep, navigateToStep])

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

  // 데이터 검증 수행 (상세 검증 포함)
  const performDataValidation = (data: DataRow[]): ValidationResults => {
    return DataValidationService.performDetailedValidation(data)
  }
  
  // 데이터 정보 추출 (PurposeInputStep에 전달용)
  const _getDataInfo = () => {
    if (!uploadedData) return null
    return DataValidationService.getDataInfo(uploadedData)
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
          
          {/* 액션 버튼들 */}
          <div className="absolute right-0 top-0 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <Clock className="w-4 h-4 mr-2" />
              분석 히스토리
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              데이터 제한 안내
            </Button>
          </div>
        </div>
        
        {/* 도움말 패널 */}
        {showHelp && (
          <Card className="border-gray-300 bg-gray-50 dark:bg-gray-900/50">
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
                      <li className="font-medium text-gray-700 dark:text-gray-300">
                        → 감지된 메모리: {systemMemory}GB
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-sm">
                  <strong>💡 팁:</strong> 브라우저는 시스템 메모리의 25-50%만 사용 가능합니다.
                  대용량 데이터는 샘플링하거나 필요한 컬럼만 선택하세요.
                </p>
              </div>
              
              <div className="text-sm text-center">
                <a 
                  href="/help#data-limits" 
                  target="_blank"
                  className="text-gray-700 dark:text-gray-300 hover:underline hover:text-gray-900 dark:hover:text-gray-100"
                >
                  자세한 도움말 보기 →
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 분석 히스토리 패널 */}
        {showHistory && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">📊 분석 히스토리</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AnalysisHistoryPanel />
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
          <div className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-800 dark:text-gray-200 font-bold">오류:</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{error}</span>
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
              <div className="animate-in fade-in duration-500">
                <DataUploadStep onUploadComplete={handleUploadComplete} />
              </div>
            )}

            {currentStep === 2 && (
              <div className="animate-in fade-in duration-500">
                <ErrorBoundary>
                  <DataValidationStep
                    validationResults={validationResults}
                    data={uploadedData}
                  />
                </ErrorBoundary>
              </div>
            )}

            {currentStep === 3 && (
              <div className="animate-in fade-in duration-500">
                <PurposeInputStep
                  onPurposeSubmit={handlePurposeSubmit}
                />
              </div>
            )}

            {currentStep === 4 && (
              <div className="animate-in fade-in duration-500">
                <AnalysisExecutionStep
                  method={selectedMethod?.name || null}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </div>
            )}

            {currentStep === 5 && (
              <div className="animate-in fade-in duration-500">
                <ResultsActionStep results={analysisResults} />
              </div>
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