'use client'

import { ChevronRight, Download, BarChart3, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnalysisResult } from '@/types/smart-flow'

interface ResultsActionStepProps {
  results: AnalysisResult | null
}

export function ResultsActionStep({ results }: ResultsActionStepProps) {
  if (!results) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">분석을 먼저 실행해주세요.</p>
      </div>
    )
  }

  const nextActions = [
    {
      title: '사후검정 수행',
      description: '세부 그룹 간 차이 확인',
      icon: BarChart3
    },
    {
      title: '시각화 생성',
      description: '그래프로 결과 확인',
      icon: BarChart3
    },
    {
      title: '보고서 생성',
      description: 'PDF 형식으로 다운로드',
      icon: FileText
    }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📊 분석 결과</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">검정 방법</p>
            <p className="font-medium">{results.method}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">통계량</p>
              <p className="text-xl font-bold">{results.statistic.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">p-value</p>
              <p className={`text-xl font-bold ${
                results.pValue < 0.05 ? 'text-green-600' : 'text-gray-600'
              }`}>
                {results.pValue.toFixed(3)}
              </p>
            </div>
            {results.effectSize && (
              <div>
                <p className="text-sm text-muted-foreground">효과크기</p>
                <p className="text-xl font-bold">{results.effectSize.toFixed(2)}</p>
              </div>
            )}
          </div>

          {results.confidence && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">95% 신뢰구간</p>
              <p className="font-medium">
                [{results.confidence.lower.toFixed(3)}, {results.confidence.upper.toFixed(3)}]
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="font-medium mb-2">💡 해석</p>
            <p className="text-sm">{results.interpretation}</p>
            {results.pValue < 0.05 && (
              <p className="text-sm mt-2">
                p-값이 0.05보다 작으므로 (p = {results.pValue.toFixed(3)} &lt; 0.05),
                통계적으로 유의한 차이가 있습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">다음 단계 추천</h4>
        
        <div className="grid gap-3">
          {nextActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          결과 다운로드
        </Button>
        <Button variant="outline" className="flex-1">
          새 분석 시작
        </Button>
      </div>
    </div>
  )
}