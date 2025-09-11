"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  ArrowRight,
  Info,
  Target,
  Eye,
  Download
} from "lucide-react"
import { StatisticalGuidance, FileNamingGuidance } from "@/lib/statistical-guide"

interface StatisticalGuidanceProps {
  guidance: StatisticalGuidance
  fileNaming?: FileNamingGuidance
  onNextAnalysis?: (analysisType: string) => void
  onDownloadResult?: (filename: string) => void
}

export function StatisticalGuidanceComponent({ 
  guidance, 
  fileNaming,
  onNextAnalysis,
  onDownloadResult 
}: StatisticalGuidanceProps) {
  const [activeTab, setActiveTab] = useState("summary")

  return (
    <div className="space-y-6">
      {/* 핵심 결과 요약 */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            분석 결과 요약
          </CardTitle>
          <CardDescription>통계 분석의 핵심 결과</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-foreground">
            {guidance.summary}
          </p>
        </CardContent>
      </Card>

      {/* 상세 분석 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">해석</TabsTrigger>
          <TabsTrigger value="assumptions">가정검토</TabsTrigger>
          <TabsTrigger value="next-steps">다음단계</TabsTrigger>
          <TabsTrigger value="visualization">시각화</TabsTrigger>
          <TabsTrigger value="reporting">보고서</TabsTrigger>
        </TabsList>

        {/* 결과 해석 탭 */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                상세 해석
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🎯 주요 결과</h4>
                <p className="text-sm text-muted-foreground">
                  {guidance.interpretation.result}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">📊 통계적 유의성</h4>
                <p className="text-sm text-muted-foreground">
                  {guidance.interpretation.significance}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">📈 효과 크기</h4>
                <p className="text-sm text-muted-foreground">
                  {guidance.interpretation.effect}
                </p>
              </div>

              {guidance.interpretation.multipleComparisons && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">🔢 다중비교 보정</h4>
                    <p className="text-sm text-muted-foreground">
                      {guidance.interpretation.multipleComparisons}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 가정 검토 탭 */}
        <TabsContent value="assumptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 충족된 가정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  충족된 가정
                </CardTitle>
              </CardHeader>
              <CardContent>
                {guidance.assumptions.met.length > 0 ? (
                  <ul className="space-y-2">
                    {guidance.assumptions.met.map((assumption, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {assumption}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">해당 없음</p>
                )}
              </CardContent>
            </Card>

            {/* 위반된 가정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  위반된 가정
                </CardTitle>
              </CardHeader>
              <CardContent>
                {guidance.assumptions.violated.length > 0 ? (
                  <ul className="space-y-2">
                    {guidance.assumptions.violated.map((assumption, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        {assumption}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-green-600">모든 가정이 충족되었습니다</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 권고사항 */}
          <Card>
            <CardHeader>
              <CardTitle>권고사항</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {guidance.assumptions.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-blue-500" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 다음 단계 탭 */}
        <TabsContent value="next-steps" className="space-y-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                권장 다음 단계
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 font-medium">{guidance.nextSteps.primary}</p>
              <Button 
                onClick={() => onNextAnalysis?.('recommended')}
                className="w-full"
              >
                권장 분석 진행하기
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>대안적 분석 방법</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {guidance.nextSteps.alternatives.map((alt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start"
                    onClick={() => onNextAnalysis?.(alt)}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {alt}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>고려사항</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {guidance.nextSteps.considerations.map((consideration, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                    {consideration}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시각화 탭 */}
        <TabsContent value="visualization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                권장 시각화
              </CardTitle>
              <CardDescription>결과를 효과적으로 표현하는 시각화 방법들</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {guidance.visualizations.recommended.map((viz, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{viz}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {guidance.visualizations.descriptions[index]}
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      생성하기
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 보고서 작성 탭 */}
        <TabsContent value="reporting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                APA 형식 보고
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <code className="text-sm">{guidance.reportingGuidance.apa}</code>
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                클립보드에 복사
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>해석 문구</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {guidance.reportingGuidance.interpretation}
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                클립보드에 복사
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>제한사항</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {guidance.reportingGuidance.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
                    {limitation}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 파일 저장 가이드 */}
      {fileNaming && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              결과 저장하기
            </CardTitle>
            <CardDescription>권장 파일명과 저장 형식</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">권장 파일명:</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-muted rounded text-sm">
                  {fileNaming.suggestedName}
                </code>
                <Button 
                  size="sm" 
                  onClick={() => onDownloadResult?.(fileNaming.suggestedName)}
                >
                  저장
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">파일 설명:</label>
              <p className="text-sm text-muted-foreground mt-1">
                {fileNaming.description}
              </p>
            </div>

            <div>
              <Badge variant="secondary">
                {fileNaming.category}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 요약 알림 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>분석 완료!</AlertTitle>
        <AlertDescription>
          위의 가이드를 참고하여 결과를 해석하고 다음 분석 단계를 결정하세요. 
          추가적인 도움이 필요하면 도움말 섹션을 확인해주세요.
        </AlertDescription>
      </Alert>
    </div>
  )
}