"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, BarChart3, TrendingUp, Zap, Database, Play, HelpCircle, Info, Users, Target } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import Link from "next/link"
// import { PowerAnalysisPanel } from "@/components/analysis/power-analysis-panel" // TODO: Implement power analysis

// Heavy components lazy loaded
const StatisticalAnalysisComponent = lazy(() => 
  import("@/components/analysis/statistical-analysis-runtime").then(module => ({
    default: module.StatisticalAnalysisRuntime
  }))
)

export default function AnalysisPage() {
  const { datasets, getActiveDatasets } = useAppStore()
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const searchParams = useSearchParams()
  
  const activeDatasets = getActiveDatasets()
  
  // URL 쿼리 파라미터에서 데이터셋과 테스트 자동 선택
  useEffect(() => {
    const datasetParam = searchParams.get('dataset')
    const testParam = searchParams.get('test')
    const categoryParam = searchParams.get('category')
    
    if (datasetParam && activeDatasets.some(ds => ds.id === datasetParam)) {
      setSelectedDataset(datasetParam)
    }
    
    if (testParam) {
      setSelectedTest(testParam)
      setIsAnalysisOpen(true)
    }
    
    if (categoryParam === 'correlation') {
      // 상관분석의 경우 특별히 처리 (통계 엔진에 추가 예정)
      setSelectedTest('Correlation Analysis')
      setIsAnalysisOpen(true)
    }
  }, [searchParams, activeDatasets])
  
  // 업로드 완료 시 데이터셋 목록 새로고침
  const handleUploadComplete = (datasetId: string) => {
    setRefreshKey(prev => prev + 1)
    setSelectedDataset(datasetId) // 새로 업로드된 데이터셋 자동 선택
  }
  const analysisCategories = [
    {
      title: "기초 통계 분석",
      description: "기본적인 통계 검정과 기술통계",
      icon: Calculator,
      color: "text-blue-600",
      tests: [
        { 
          name: "기술통계량", 
          englishName: "Descriptive Statistics",
          description: "평균, 중앙값, 표준편차 등 기본 통계", 
          tooltip: "데이터의 중심경향과 분산을 파악할 때 사용",
          whenToUse: "• 데이터의 기본적인 특성을 파악하고 싶을 때\n• 데이터 분포를 확인하고 싶을 때\n• 이상치를 발견하고 싶을 때",
          example: "설문조사 결과의 평균 점수 계산",
          icon: Target
        },
        { 
          name: "일표본 t-검정", 
          englishName: "One-sample t-test",
          description: "표본 평균과 모집단 평균 비교", 
          tooltip: "알려진 기준값과 표본 평균을 비교할 때 사용",
          whenToUse: "• 표본 평균이 특정 기준값과 다른지 확인할 때\n• 정규분포를 따르는 연속형 데이터\n• 표본 크기가 30개 이상이거나 모집단이 정규분포",
          example: "학생들의 평균 시험점수가 70점과 다른지 검정",
          icon: Target
        },
        { 
          name: "독립표본 t-검정", 
          englishName: "Two-sample t-test",
          description: "두 독립 그룹의 평균 비교", 
          tooltip: "서로 다른 두 그룹의 평균이 같은지 비교할 때 사용",
          whenToUse: "• 두 독립된 그룹의 평균을 비교할 때\n• 연속형 종속변수, 범주형 독립변수\n• 각 그룹이 정규분포를 따르고 등분산 가정",
          example: "남학생과 여학생의 평균 키 차이 검정",
          icon: Users
        },
        { 
          name: "대응표본 t-검정", 
          englishName: "Paired t-test",
          description: "동일 대상의 전후 측정값 비교", 
          tooltip: "같은 대상에서 측정한 두 시점의 값을 비교할 때 사용",
          whenToUse: "• 동일한 대상의 사전-사후 비교\n• 짝을 이룬 데이터 비교\n• 차이값이 정규분포를 따름",
          example: "운동 프로그램 전후의 체중 변화 분석",
          icon: Target
        },
      ]
    },
    {
      title: "분산분석 (ANOVA)",
      description: "다중 그룹 비교와 사후검정",
      icon: BarChart3,
      color: "text-green-600",
      tests: [
        { 
          name: "일원분산분석", 
          englishName: "One-way ANOVA",
          description: "3개 이상 그룹의 평균 비교", 
          tooltip: "3개 이상의 독립된 그룹 평균을 동시에 비교할 때 사용",
          whenToUse: "• 3개 이상의 독립 그룹 비교\n• 연속형 종속변수\n• 각 그룹의 정규성과 등분산성 가정",
          example: "A, B, C 세 가지 치료법의 효과 비교",
          icon: BarChart3
        },
        { 
          name: "이원분산분석", 
          englishName: "Two-way ANOVA",
          description: "두 요인의 주효과와 상호작용 분석", 
          tooltip: "두 개의 독립변수가 종속변수에 미치는 효과를 분석할 때 사용",
          whenToUse: "• 두 개의 범주형 독립변수가 있을 때\n• 주효과와 상호작용 효과 분석\n• 정규성, 등분산성, 독립성 가정",
          example: "성별과 교육방법이 학습효과에 미치는 영향",
          icon: BarChart3
        },
        { 
          name: "Tukey HSD 검정", 
          englishName: "Tukey HSD",
          description: "ANOVA 사후검정 (등분산)", 
          tooltip: "ANOVA에서 유의한 결과가 나왔을 때 어느 그룹 간에 차이가 있는지 확인",
          whenToUse: "• ANOVA 결과가 유의할 때\n• 등분산 가정을 만족할 때\n• 모든 쌍별 비교를 수행",
          example: "3개 치료군 중 어느 그룹들 간에 차이가 있는지 확인",
          icon: Target
        },
        { 
          name: "Games-Howell 검정", 
          englishName: "Games-Howell",
          description: "ANOVA 사후검정 (이분산)", 
          tooltip: "등분산 가정을 위반했을 때 사용하는 사후검정",
          whenToUse: "• ANOVA 결과가 유의할 때\n• 등분산 가정을 위반할 때\n• 그룹 크기가 다를 때",
          example: "그룹별 분산이 다를 때의 사후검정",
          icon: Target
        },
      ]
    },
    {
      title: "회귀분석",
      description: "변수 간 관계 모델링과 예측",
      icon: TrendingUp,
      color: "text-purple-600",
      tests: [
        { 
          name: "단순선형회귀", 
          englishName: "Simple Linear Regression",
          description: "하나의 예측변수로 결과 예측", 
          tooltip: "연속형 독립변수 1개가 연속형 종속변수에 미치는 영향을 분석",
          whenToUse: "• 두 연속형 변수 간의 선형관계 분석\n• 예측 모델 구축\n• 선형성, 독립성, 등분산성, 정규성 가정",
          example: "공부시간이 시험성적에 미치는 영향",
          icon: TrendingUp
        },
        { 
          name: "다중회귀분석", 
          englishName: "Multiple Regression",
          description: "여러 예측변수로 결과 예측", 
          tooltip: "여러 독립변수가 종속변수에 미치는 영향을 동시에 분석",
          whenToUse: "• 여러 독립변수의 영향을 동시에 분석\n• 변수 간 상대적 중요도 파악\n• 다중공선성 주의",
          example: "나이, 경험, 교육수준이 연봉에 미치는 영향",
          icon: TrendingUp
        },
        { 
          name: "다항회귀분석", 
          englishName: "Polynomial Regression",
          description: "비선형 관계 모델링", 
          tooltip: "독립변수와 종속변수 간의 비선형(곡선) 관계를 분석",
          whenToUse: "• 변수 간 곡선 관계가 예상될 때\n• 선형회귀로 설명되지 않는 패턴\n• 과적합 주의",
          example: "온도와 아이스크림 판매량의 관계 (포물선)",
          icon: TrendingUp
        },
        { 
          name: "로지스틱회귀", 
          englishName: "Logistic Regression",
          description: "이항 결과 예측 모델", 
          tooltip: "범주형(이항) 종속변수를 예측하는 회귀분석",
          whenToUse: "• 종속변수가 이항 범주형일 때\n• 성공/실패, 합격/불합격 예측\n• 확률로 결과 해석",
          example: "나이, 소득이 제품 구매 여부에 미치는 영향",
          icon: Target
        },
      ]
    },
    {
      title: "비모수 검정",
      description: "분포 가정이 없는 통계 방법",
      icon: Zap,
      color: "text-orange-600",
      tests: [
        { 
          name: "Mann-Whitney U 검정", 
          englishName: "Mann-Whitney U Test",
          description: "두 독립 그룹의 중앙값 비교 (비모수)", 
          tooltip: "정규분포 가정 없이 두 독립 그룹을 비교할 때 사용",
          whenToUse: "• 두 독립 그룹 비교 (t-검정의 비모수 버전)\n• 정규분포 가정 위반\n• 순서형 데이터",
          example: "두 치료법의 효과 비교 (정규분포 아님)",
          icon: Users
        },
        { 
          name: "Wilcoxon 부호순위검정", 
          englishName: "Wilcoxon Signed-rank",
          description: "대응표본의 중앙값 비교 (비모수)", 
          tooltip: "정규분포 가정 없이 대응표본을 비교할 때 사용",
          whenToUse: "• 대응표본 비교 (대응표본 t-검정의 비모수 버전)\n• 차이값이 정규분포를 따르지 않을 때\n• 순서형 데이터",
          example: "운동 프로그램 전후 비교 (정규분포 아님)",
          icon: Target
        },
        { 
          name: "Kruskal-Wallis 검정", 
          englishName: "Kruskal-Wallis Test",
          description: "3개 이상 그룹의 중앙값 비교 (비모수)", 
          tooltip: "정규분포 가정 없이 3개 이상 그룹을 비교할 때 사용",
          whenToUse: "• 3개 이상 독립 그룹 비교 (일원분산분석의 비모수 버전)\n• 정규분포나 등분산 가정 위반\n• 순서형 데이터",
          example: "3개 브랜드의 만족도 비교 (순서형 데이터)",
          icon: BarChart3
        },
        { 
          name: "Dunn 검정", 
          englishName: "Dunn's Test",
          description: "Kruskal-Wallis 사후검정", 
          tooltip: "Kruskal-Wallis 검정 후 어느 그룹 간에 차이가 있는지 확인",
          whenToUse: "• Kruskal-Wallis 결과가 유의할 때\n• 비모수 사후검정\n• 다중비교 보정 적용",
          example: "3개 그룹 중 어느 그룹들 간에 차이가 있는지 확인",
          icon: Target
        },
      ]
    }
  ]


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statistical Analysis</h1>
        <p className="text-muted-foreground">
          Choose from professional-grade statistical tests and analyses.
        </p>
      </div>

      <TooltipProvider>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            {analysisCategories.map((category, categoryIndex) => (
              <TabsTrigger 
                key={categoryIndex} 
                value={categoryIndex === 0 ? "basic" : categoryIndex === 1 ? "anova" : categoryIndex === 2 ? "regression" : "nonparametric"}
                className="flex items-center gap-2"
              >
                <category.icon className="h-4 w-4" />
                {category.title}
              </TabsTrigger>
            ))}
            <TabsTrigger value="power" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Power Analysis
            </TabsTrigger>
          </TabsList>
          
          {analysisCategories.map((category, categoryIndex) => (
            <TabsContent 
              key={categoryIndex} 
              value={categoryIndex === 0 ? "basic" : categoryIndex === 1 ? "anova" : categoryIndex === 2 ? "regression" : "nonparametric"}
              className="space-y-4"
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-background to-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-background border ${category.color}`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  {category.tests.map((test, testIndex) => (
                    <div key={testIndex} className="group border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-primary/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <test.icon className={`h-5 w-5 ${category.color}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{test.name}</h3>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-md">
                                    <div className="space-y-2">
                                      <p className="font-medium">{test.tooltip}</p>
                                      <div className="text-sm">
                                        <p className="font-medium text-primary">언제 사용하나요?</p>
                                        <pre className="whitespace-pre-wrap text-xs">{test.whenToUse}</pre>
                                      </div>
                                      <div className="text-sm">
                                        <p className="font-medium text-green-600">예시:</p>
                                        <p className="text-xs">{test.example}</p>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <p className="text-sm text-muted-foreground font-mono">{test.englishName}</p>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed">{test.description}</p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="ml-3 group-hover:border-primary group-hover:text-primary"
                              onClick={() => setSelectedTest(test.name)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              실행
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{test.name}</DialogTitle>
                              <DialogDescription>{test.description}</DialogDescription>
                            </DialogHeader>
                            
                            {activeDatasets.length === 0 ? (
                              <div className="text-center py-8">
                                <Database className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium mb-2">No datasets available</h3>
                                <p className="text-muted-foreground mb-4">
                                  Upload a dataset first to run statistical analyses
                                </p>
                                <div className="flex gap-3 justify-center">
                                  <Link href="/data">
                                    <Button>
                                      <Database className="h-4 w-4 mr-2" />
                                      데이터 관리
                                    </Button>
                                  </Link>
                                  <Link href="/smart-analysis">
                                    <Button variant="outline">
                                      <BarChart3 className="h-4 w-4 mr-2" />
                                      AI 분석 시작
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Select Dataset:</label>
                                  <Select value={selectedDataset || ''} onValueChange={setSelectedDataset}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose a dataset" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {activeDatasets.map((dataset) => (
                                        <SelectItem key={dataset.id} value={dataset.id}>
                                          {dataset.name} ({dataset.rows.toLocaleString()} rows, {dataset.columns} columns)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {selectedDataset && (
                                  <ErrorBoundary>
                                    <Suspense fallback={
                                      <div className="flex items-center justify-center p-8">
                                        <div className="animate-spin">
                                          <BarChart3 className="h-8 w-8 text-primary" />
                                        </div>
                                        <span className="ml-2">Loading analysis...</span>
                                      </div>
                                    }>
                                      <StatisticalAnalysisComponent 
                                        datasetId={selectedDataset}
                                        testType={test.name}
                                      />
                                    </Suspense>
                                  </ErrorBoundary>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
            </TabsContent>
          ))}
          
          <TabsContent value="power" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Power Analysis</CardTitle>
                <CardDescription>
                  Statistical power analysis will be available in a future update
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </TooltipProvider>

    </div>
  )
}