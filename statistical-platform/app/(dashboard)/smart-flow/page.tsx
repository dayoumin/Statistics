'use client'

import { useCallback, useEffect, useState, lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Upload, CheckCircle, BarChart3, FileText, Sparkles, HelpCircle, X, Clock } from 'lucide-react'

// Lazy load heavy components for code splitting
const ProgressStepper = lazy(() => import('@/components/smart-flow/ProgressStepper').then(m => ({ default: m.ProgressStepper })))
const DataUploadStep = lazy(() => import('@/components/smart-flow/steps/DataUploadStep').then(m => ({ default: m.DataUploadStep })))
const DataValidationStep = lazy(() => import('@/components/smart-flow/steps/DataValidationStep').then(m => ({ default: m.DataValidationStep })))
const PurposeInputStep = lazy(() => import('@/components/smart-flow/steps/PurposeInputStep').then(m => ({ default: m.PurposeInputStep })))
const AnalysisExecutionStep = lazy(() => import('@/components/smart-flow/steps/AnalysisExecutionStep').then(m => ({ default: m.AnalysisExecutionStep })))
const ResultsActionStep = lazy(() => import('@/components/smart-flow/steps/ResultsActionStep').then(m => ({ default: m.ResultsActionStep })))
const AnalysisHistoryPanel = lazy(() => import('@/components/smart-flow/AnalysisHistoryPanel').then(m => ({ default: m.AnalysisHistoryPanel })))
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
  { id: 1, name: '데이터 업로드', icon: Upload, description: '분석할 파일 선택' },
  { id: 2, name: '데이터 확인', icon: CheckCircle, description: '데이터 구조와 품질 점검' },
  { id: 3, name: '분석 목표 설정', icon: Sparkles, description: '답을 찾고 싶은 질문 정의' },
  { id: 4, name: '분석 수행', icon: BarChart3, description: '최적 통계 방법으로 분석' },
  { id: 5, name: '결과 해석', icon: FileText, description: '인사이트 확인 및 보고서 생성' }
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
    uploadedData,
    validationResults,
    selectedMethod,
    variableMapping,
    analysisResults,
    isLoading,
    error,
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

  // 데이터 검증 수행 (상세 검증 - 이상치, 데이터 타입 포함)
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
              aria-label="분석 히스토리 패널 열기"
            >
              <Clock className="w-4 h-4 mr-2" />
              분석 히스토리
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              aria-label="데이터 제한 안내 패널 열기"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              데이터 제한 안내
            </Button>
          </div>
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
                  aria-label="도움말 패널 닫기"
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
                  aria-label="히스토리 패널 닫기"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded" />}>
                <AnalysisHistoryPanel />
              </Suspense>
            </CardContent>
          </Card>
        )}

        {/* Progress Stepper */}
        <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-lg" />}>
          <ProgressStepper
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </Suspense>

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
            
            <ErrorBoundary>
              {currentStep === 1 && (
                <div className="animate-in fade-in duration-500">
                  <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
                    <DataUploadStep
                      onUploadComplete={handleUploadComplete}
                      onNext={goToNextStep}
                      canGoNext={canProceedToNext()}
                      currentStep={currentStep}
                      totalSteps={steps.length}
                    />
                  </Suspense>
                </div>
              )}

              {currentStep === 2 && (
                <div className="animate-in fade-in duration-500">
                  <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
                    <DataValidationStep
                      validationResults={validationResults}
                      data={uploadedData}
                      onNext={goToNextStep}
                      onPrevious={goToPreviousStep}
                      canGoNext={canProceedToNext()}
                      canGoPrevious={currentStep > 1}
                      currentStep={currentStep}
                      totalSteps={steps.length}
                    />
                  </Suspense>
                </div>
              )}

              {currentStep === 3 && (
                <div className="animate-in fade-in duration-500">
                  <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
                    <PurposeInputStep
                      onPurposeSubmit={handlePurposeSubmit}
                      validationResults={validationResults}
                      data={uploadedData}
                      onNext={goToNextStep}
                      onPrevious={goToPreviousStep}
                      canGoNext={canProceedToNext()}
                      canGoPrevious={currentStep > 1}
                      currentStep={currentStep}
                      totalSteps={steps.length}
                    />
                  </Suspense>
                </div>
              )}

              {currentStep === 4 && (
                <div className="animate-in fade-in duration-500">
                  <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
                    <AnalysisExecutionStep
                      selectedMethod={selectedMethod}
                      variableMapping={variableMapping || {}}
                      onAnalysisComplete={handleAnalysisComplete}
                      onNext={goToNextStep}
                      onPrevious={goToPreviousStep}
                      canGoNext={canProceedToNext()}
                      canGoPrevious={currentStep > 1}
                    />
                  </Suspense>
                </div>
              )}

              {currentStep === 5 && (
                <div className="animate-in fade-in duration-500">
                  <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
                    <ResultsActionStep results={analysisResults} />
                  </Suspense>
                </div>
              )}
            </ErrorBoundary>
          </CardContent>
        </Card>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 1 || isLoading}
              aria-label="이전 분석 단계로 이동"
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
              aria-label="모든 데이터 초기화 및 처음부터 다시 시작"
            >
              처음부터 다시
            </Button>
          </div>
          
          <Button
            onClick={goToNextStep}
            disabled={currentStep === 5 || !canProceedToNext() || isLoading}
            aria-label="다음 분석 단계로 이동"
          >
            다음 단계
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}