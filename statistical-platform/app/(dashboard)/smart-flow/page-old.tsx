'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Upload, CheckCircle, BarChart3, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  { id: 1, name: '데이터 업로드', icon: Upload, description: '분석할 데이터 파일을 업로드하세요' },
  { id: 2, name: '데이터 검증', icon: CheckCircle, description: '데이터를 자동으로 검증합니다' },
  { id: 3, name: '분석 목적', icon: Sparkles, description: '무엇을 알고 싶은지 알려주세요' },
  { id: 4, name: '통계 분석', icon: BarChart3, description: '최적의 통계 방법으로 분석합니다' },
  { id: 5, name: '결과 및 액션', icon: FileText, description: '결과를 확인하고 다음 단계를 선택하세요' }
]

export default function SmartFlowPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCompletedSteps([...completedSteps, currentStep])
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepId: number) => {
    if (stepId <= Math.max(...completedSteps, 1)) {
      setCurrentStep(stepId)
    }
  }

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
        <div className="relative">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
            />
          </div>
          
          <div className="relative flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = completedSteps.includes(step.id)
              const isClickable = step.id <= Math.max(...completedSteps, 1)
              
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "flex flex-col items-center space-y-2 p-2 rounded-lg transition-all",
                    isClickable && "cursor-pointer hover:bg-muted/50",
                    !isClickable && "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isActive && "bg-primary text-primary-foreground scale-110",
                    isCompleted && !isActive && "bg-primary/20 text-primary",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground"
                    )}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block max-w-[150px]">
                      {step.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

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
            {/* Step 1: 데이터 업로드 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">파일을 드래그하거나 클릭하여 업로드</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    CSV, Excel(.xlsx), TSV 파일을 지원합니다
                  </p>
                  <Button variant="outline">파일 선택</Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">💡 도움말</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 첫 번째 행은 변수명(헤더)이어야 합니다</li>
                    <li>• 최대 파일 크기: 100MB</li>
                    <li>• 숫자 데이터는 소수점을 포함할 수 있습니다</li>
                    <li>• 결측값은 빈 셀로 표시해주세요</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 2: 데이터 검증 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold">데이터 검증 완료</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white dark:bg-background rounded p-3">
                      <p className="text-sm text-muted-foreground">총 행 수</p>
                      <p className="text-2xl font-bold">150</p>
                    </div>
                    <div className="bg-white dark:bg-background rounded p-3">
                      <p className="text-sm text-muted-foreground">변수 수</p>
                      <p className="text-2xl font-bold">5</p>
                    </div>
                    <div className="bg-white dark:bg-background rounded p-3">
                      <p className="text-sm text-muted-foreground">결측값</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <div className="bg-white dark:bg-background rounded p-3">
                      <p className="text-sm text-muted-foreground">데이터 타입</p>
                      <p className="text-2xl font-bold">수치형</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">발견된 변수:</p>
                    <div className="flex flex-wrap gap-2">
                      {['나이', '키', '몸무게', '혈압', '콜레스테롤'].map(variable => (
                        <span key={variable} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4">
                  <h4 className="font-medium mb-2">⚠️ 확인사항</h4>
                  <ul className="text-sm space-y-1">
                    <li>• 모든 데이터가 정상적으로 로드되었습니다</li>
                    <li>• 이상치가 일부 발견되었으나 분석 가능합니다</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 3: 분석 목적 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">무엇을 알고 싶으신가요?</label>
                    <textarea 
                      className="w-full min-h-[120px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="예: 남녀 간 키 차이가 있는지 알고 싶어요
나이에 따른 콜레스테롤 변화를 보고 싶어요
그룹 간 평균 차이를 비교하고 싶어요"
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6">
                    <h4 className="font-medium mb-3">🎯 추천 분석 방법</h4>
                    <div className="space-y-3">
                      <button className="w-full text-left p-3 bg-white dark:bg-background rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">독립표본 t-검정</p>
                            <p className="text-sm text-muted-foreground">두 그룹 간 평균 차이 검정</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>
                      
                      <button className="w-full text-left p-3 bg-white dark:bg-background rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">상관분석</p>
                            <p className="text-sm text-muted-foreground">변수 간 관계 분석</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>

                      <button className="w-full text-left p-3 bg-white dark:bg-background rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">회귀분석</p>
                            <p className="text-sm text-muted-foreground">영향 관계 분석 및 예측</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: 통계 분석 실행 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <BarChart3 className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">통계 분석 진행 중...</h3>
                  <p className="text-muted-foreground mb-6">잠시만 기다려주세요</p>
                  
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">데이터 전처리 완료</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">정규성 검정 완료</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full border-2 border-primary animate-spin" />
                      <span className="text-sm font-medium">t-검정 수행 중...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: 결과 및 다음 액션 */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 분석 결과</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">검정 방법</p>
                      <p className="font-medium">독립표본 t-검정</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">t 통계량</p>
                        <p className="text-xl font-bold">2.348</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">p-value</p>
                        <p className="text-xl font-bold text-green-600">0.021</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">효과크기</p>
                        <p className="text-xl font-bold">0.43</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="font-medium mb-2">💡 해석</p>
                      <p className="text-sm">
                        두 그룹 간 평균 차이가 통계적으로 유의합니다 (p = 0.021 &lt; 0.05). 
                        효과크기는 중간 정도(d = 0.43)로, 실질적으로도 의미 있는 차이입니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">다음 단계 추천</h4>
                  
                  <div className="grid gap-3">
                    <button className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className="text-left">
                        <p className="font-medium">사후검정 수행</p>
                        <p className="text-sm text-muted-foreground">세부 그룹 간 차이 확인</p>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <button className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className="text-left">
                        <p className="font-medium">시각화 생성</p>
                        <p className="text-sm text-muted-foreground">그래프로 결과 확인</p>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <button className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className="text-left">
                        <p className="font-medium">보고서 생성</p>
                        <p className="text-sm text-muted-foreground">PDF 형식으로 다운로드</p>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            이전 단계
          </Button>
          
          <Button 
            onClick={handleNextStep}
            disabled={currentStep === 5}
          >
            다음 단계
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}