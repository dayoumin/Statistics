"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Download, 
  Share2, 
  BarChart3, 
  Calculator, 
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock
} from "lucide-react"
import Link from "next/link"
import { useAppStore, type AnalysisResult } from "@/lib/store"

export default function ResultsPage() {
  const params = useParams()
  const { getAnalysisResult } = useAppStore()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadResult = async () => {
      try {
        const analysisResult = getAnalysisResult(params.id as string)
        if (analysisResult) {
          setResult(analysisResult)
        } else {
          // 샘플 데이터로 대체 (실제로는 서버에서 로드)
          setResult({
            id: params.id as string,
            datasetId: "sample-dataset",
            datasetName: "sample_data.csv",
            testType: "Mann-Whitney U Test",
            testName: "Mann-Whitney U 검정",
            method: "비모수 검정",
            parameters: {},
            timestamp: new Date(),
            createdAt: new Date(),
            status: 'completed',
            results: {
              testStatistic: 1247.5,
              pValue: 0.032,
              effectSize: 0.24,
              confidenceInterval: [0.05, 0.89],
              conclusion: "통계적으로 유의한 차이가 있습니다",
              interpretation: "두 그룹 간의 차이가 통계적으로 유의합니다 (p < 0.05). 효과크기는 중간 정도로 실질적인 의미가 있는 차이입니다."
            },
            assumptions: {
              normality: [
                { passed: false, pValue: 0.024, test: "Shapiro-Wilk" },
                { passed: true, pValue: 0.145, test: "Shapiro-Wilk" }
              ],
              homogeneity: [
                { passed: true, pValue: 0.067, test: "Levene's Test" }
              ],
              independence: true
            },
            recommendations: [
              "정규성 가정을 만족하지 않아 비모수 검정을 사용했습니다",
              "더 큰 표본 크기로 분석을 반복해보는 것을 권장합니다",
              "실제 연구 맥락에서 효과크기의 실질적 의미를 고려해보세요"
            ],
            visualizations: ["boxplot", "histogram", "qq_plot"]
          })
        }
      } catch (error) {
        console.error("Failed to load analysis result:", error)
      } finally {
        setLoading(false)
      }
    }

    loadResult()
  }, [params.id, getAnalysisResult])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin">
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>
        <span className="ml-2">분석 결과를 불러오는 중...</span>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">분석 결과를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mb-4">
          요청하신 분석 결과가 존재하지 않거나 삭제되었습니다.
        </p>
        <Link href="/dashboard">
          <Button>대시보드로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'failed': return 'destructive'
      case 'processing': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'failed': return <AlertTriangle className="h-4 w-4" />
      case 'processing': return <Clock className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            분석 결과
          </h1>
          <p className="text-muted-foreground mt-2">
            {result.testName} • {result.datasetName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={getStatusColor(result.status)} className="flex items-center gap-1">
            {getStatusIcon(result.status)}
            {result.status === 'completed' ? '완료' : 
             result.status === 'failed' ? '실패' : '처리중'}
          </Badge>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            공유
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="results">분석 결과</TabsTrigger>
          <TabsTrigger value="assumptions">가정 검정</TabsTrigger>
          <TabsTrigger value="visualizations">시각화</TabsTrigger>
          <TabsTrigger value="raw-data">원본 데이터</TabsTrigger>
        </TabsList>

        {/* 분석 결과 탭 */}
        <TabsContent value="results" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 결과 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  검정 통계량
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">검정 방법</span>
                    <p className="font-medium">{result.method}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">검정통계량</span>
                    <p className="font-medium">U = {result.results.testStatistic}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">p-값</span>
                    <p className="font-medium text-lg">{result.results.pValue.toFixed(3)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">효과크기</span>
                    <p className="font-medium">
                      {result.results.effectSize ? `r = ${result.results.effectSize}` : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {result.results.confidenceInterval && (
                  <div>
                    <span className="text-sm text-muted-foreground">95% 신뢰구간</span>
                    <p className="font-medium">
                      [{result.results.confidenceInterval[0]}, {result.results.confidenceInterval[1]}]
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 결론 및 해석 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  결론 및 해석
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>결론:</strong> {result.results.conclusion}
                  </AlertDescription>
                </Alert>
                
                <div>
                  <h4 className="font-medium mb-2">해석</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.results.interpretation}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 권장사항 */}
          <Card>
            <CardHeader>
              <CardTitle>통계적 권장사항</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 가정 검정 탭 */}
        <TabsContent value="assumptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>통계적 가정 검정 결과</CardTitle>
              <CardDescription>
                분석에 사용된 통계 방법의 가정들이 만족되는지 확인합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">정규성 검정</h4>
                <div className="space-y-2">
                  {result.assumptions.normality.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{test.test}</span>
                        <p className="text-sm text-muted-foreground">p = {test.pValue.toFixed(3)}</p>
                      </div>
                      <Badge variant={test.passed ? "default" : "destructive"}>
                        {test.passed ? "통과 ✓" : "위반 ✗"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">등분산성 검정</h4>
                <div className="space-y-2">
                  {result.assumptions.homogeneity.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{test.test}</span>
                        <p className="text-sm text-muted-foreground">p = {test.pValue.toFixed(3)}</p>
                      </div>
                      <Badge variant={test.passed ? "default" : "destructive"}>
                        {test.passed ? "통과 ✓" : "위반 ✗"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">독립성 가정</h4>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">관측값 독립성</span>
                  <Badge variant={result.assumptions.independence ? "default" : "destructive"}>
                    {result.assumptions.independence ? "만족 ✓" : "위반 ✗"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시각화 탭 */}
        <TabsContent value="visualizations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {result.visualizations.map((viz, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {viz === 'boxplot' ? '박스플롯' :
                     viz === 'histogram' ? '히스토그램' :
                     viz === 'qq_plot' ? 'Q-Q 플롯' : viz}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 aspect-square rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">차트 예정</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 원본 데이터 탭 */}
        <TabsContent value="raw-data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>분석에 사용된 데이터</CardTitle>
              <CardDescription>
                통계 분석에 사용된 원본 데이터셋입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-center text-muted-foreground">
                  데이터 테이블이 여기에 표시됩니다
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 하단 액션 */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          분석 완료: {result.timestamp.toLocaleString()}
        </div>
        <div className="flex gap-3">
          <Link href="/smart-analysis">
            <Button variant="outline">새 분석 시작</Button>
          </Link>
          <Link href="/dashboard">
            <Button>대시보드로 돌아가기</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}