"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  BarChart3, 
  TrendingUp, 
  Zap,
  Eye,
  AlertCircle,
  Target
} from "lucide-react"
import { SmartAnalysisResult, AnalysisIssue, SuggestedTest } from "@/lib/smart-analysis"
import { DataColumn } from "@/lib/data-processing"

interface SmartAnalysisRecommendationsProps {
  analysisResult: SmartAnalysisResult
  columns: DataColumn[]
  onRunTest: (testName: string, variables: any) => void
  onViewDataDetails: () => void
}

export function SmartAnalysisRecommendations({ 
  analysisResult, 
  columns, 
  onRunTest, 
  onViewDataDetails 
}: SmartAnalysisRecommendationsProps) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'fair': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'good': return <CheckCircle2 className="h-5 w-5 text-blue-600" />
      case 'fair': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'poor': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getIssueIcon = (type: AnalysisIssue['type']) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getTestIcon = (testType: SuggestedTest['type']) => {
    switch (testType) {
      case 'parametric': return <BarChart3 className="h-4 w-4 text-blue-500" />
      case 'non_parametric': return <Zap className="h-4 w-4 text-purple-500" />
      case 'descriptive': return <TrendingUp className="h-4 w-4 text-green-500" />
    }
  }

  const getConfidenceColor = (confidence: SuggestedTest['confidence']) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
  }

  const errorCount = analysisResult.issues.filter(i => i.type === 'error').length
  const warningCount = analysisResult.issues.filter(i => i.type === 'warning').length

  return (
    <div className="space-y-6">
      {/* 전체 데이터 품질 요약 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getQualityIcon(analysisResult.dataQuality.overall)}
              <div>
                <CardTitle>데이터 품질 평가</CardTitle>
                <CardDescription>업로드된 데이터의 통계 분석 적합성</CardDescription>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={getQualityColor(analysisResult.dataQuality.overall)}
            >
              {analysisResult.dataQuality.overall === 'excellent' && '우수'}
              {analysisResult.dataQuality.overall === 'good' && '양호'}
              {analysisResult.dataQuality.overall === 'fair' && '보통'}
              {analysisResult.dataQuality.overall === 'poor' && '불량'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {analysisResult.dataQuality.sampleSize}
              </div>
              <div className="text-sm text-muted-foreground">표본 크기</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {analysisResult.dataQuality.completeness.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">완성도</div>
              <Progress value={analysisResult.dataQuality.completeness} className="h-2" />
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {analysisResult.dataQuality.normalityScore.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">정규성 추정</div>
              <Progress value={analysisResult.dataQuality.normalityScore} className="h-2" />
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {analysisResult.dataQuality.varianceHomogeneity.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">분산 동질성</div>
              <Progress value={analysisResult.dataQuality.varianceHomogeneity} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 분석 가능 여부 및 주요 문제점 */}
      {!analysisResult.canAnalyze && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>분석 불가능:</strong> 데이터에 {errorCount}개의 심각한 문제가 있어 통계 분석을 수행할 수 없습니다. 
            아래 문제점을 해결한 후 다시 업로드해주세요.
          </AlertDescription>
        </Alert>
      )}

      {analysisResult.canAnalyze && warningCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>주의사항:</strong> 데이터에 {warningCount}개의 주의사항이 있습니다. 
            분석은 가능하지만 결과 해석 시 주의가 필요합니다.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">추천 분석</TabsTrigger>
          <TabsTrigger value="issues">데이터 문제</TabsTrigger>
          <TabsTrigger value="quality">품질 상세</TabsTrigger>
          <TabsTrigger value="preprocessing">전처리 제안</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {analysisResult.suggestedTests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">분석 제안 없음</h3>
                <p className="text-muted-foreground">
                  현재 데이터로는 의미 있는 통계 분석을 제안할 수 없습니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">추천 통계 분석</h3>
                <Badge variant="outline">
                  {analysisResult.suggestedTests.length}개 분석 가능
                </Badge>
              </div>
              
              {analysisResult.suggestedTests.map((test, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTestIcon(test.type)}
                        <div>
                          <CardTitle className="text-lg">{test.name}</CardTitle>
                          <CardDescription>{test.reason}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={getConfidenceColor(test.confidence)}
                        >
                          {test.confidence === 'high' && '높은 신뢰도'}
                          {test.confidence === 'medium' && '중간 신뢰도'}
                          {test.confidence === 'low' && '낮은 신뢰도'}
                        </Badge>
                        <Button 
                          onClick={() => onRunTest(test.name, test.variables)}
                          disabled={!analysisResult.canAnalyze}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          분석 시작
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">요구사항:</h4>
                        <div className="flex flex-wrap gap-1">
                          {test.requirements.map((req, reqIndex) => (
                            <Badge key={reqIndex} variant="secondary" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {test.variables.dependent && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">분석 변수:</h4>
                          <p className="text-sm text-muted-foreground">
                            {test.variables.dependent.join(', ')}
                          </p>
                        </div>
                      )}
                      
                      {test.variables.grouping && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">그룹 변수:</h4>
                          <p className="text-sm text-muted-foreground">
                            {test.variables.grouping.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {analysisResult.issues.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">문제 없음</h3>
                <p className="text-muted-foreground">
                  데이터에서 특별한 문제점이 발견되지 않았습니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {analysisResult.issues.map((issue, index) => (
                <Alert key={index} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                  {getIssueIcon(issue.type)}
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">{issue.message}</div>
                      {issue.solution && (
                        <div className="text-sm text-muted-foreground">
                          <strong>해결방법:</strong> {issue.solution}
                        </div>
                      )}
                      {issue.affectedColumns && (
                        <div className="flex flex-wrap gap-1">
                          {issue.affectedColumns.map((col, colIndex) => (
                            <Badge key={colIndex} variant="outline" className="text-xs">
                              {col}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4">
            {columns.map((column, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{column.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {column.type === 'numeric' && '수치형'}
                        {column.type === 'categorical' && '범주형'}
                        {column.type === 'text' && '텍스트'}
                        {column.type === 'date' && '날짜'}
                      </Badge>
                      {column.dataQuality?.typeConsistency === false && (
                        <Badge variant="destructive">타입 혼재</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">고유값:</span> {column.uniqueCount}개
                      </div>
                      <div>
                        <span className="font-medium">결측값:</span> {column.missingCount}개
                      </div>
                      <div>
                        <span className="font-medium">완성도:</span> {
                          ((column.values.length - column.missingCount) / column.values.length * 100).toFixed(1)
                        }%
                      </div>
                    </div>
                    
                    {column.dataQuality?.outliers && column.dataQuality.outliers.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">이상치 정보:</h4>
                        <div className="space-y-1">
                          {column.dataQuality.outliers.slice(0, 3).map((outlier, oIndex) => (
                            <div key={oIndex} className="text-xs text-muted-foreground">
                              행 {outlier.rowIndex + 1}: {outlier.value} (Z-score: {outlier.zScore.toFixed(2)})
                              {outlier.isExtreme && <Badge variant="destructive" className="ml-2 text-xs">극단</Badge>}
                            </div>
                          ))}
                          {column.dataQuality.outliers.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              ...외 {column.dataQuality.outliers.length - 3}개
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {column.dataQuality?.issues && column.dataQuality.issues.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">품질 이슈:</h4>
                        <div className="space-y-1">
                          {column.dataQuality.issues.map((issue, iIndex) => (
                            <div key={iIndex} className="text-xs text-muted-foreground">
                              • {issue}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-center">
            <Button variant="outline" onClick={onViewDataDetails}>
              <Eye className="h-4 w-4 mr-2" />
              데이터 상세 보기
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preprocessing" className="space-y-4">
          {analysisResult.recommendations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">전처리 불필요</h3>
                <p className="text-muted-foreground">
                  현재 데이터는 추가 전처리 없이 분석 가능합니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analysisResult.recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <Badge 
                        variant={rec.priority === 'high' ? 'destructive' : 
                               rec.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {rec.priority === 'high' && '높음'}
                        {rec.priority === 'medium' && '중간'}
                        {rec.priority === 'low' && '낮음'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{rec.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}