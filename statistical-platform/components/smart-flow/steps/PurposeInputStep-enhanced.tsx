'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Sparkles, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatisticalMethod } from '@/types/smart-flow'
import { KeywordBasedRecommender } from '@/lib/services/keyword-based-recommender'

interface PurposeInputStepEnhancedProps {
  onPurposeSubmit: (purpose: string, method: StatisticalMethod) => void
  dataInfo?: {
    columnCount: number
    rowCount: number
    hasNumeric: boolean
    hasCategorical: boolean
  }
}

export function PurposeInputStepEnhanced({ 
  onPurposeSubmit,
  dataInfo 
}: PurposeInputStepEnhancedProps) {
  const [purpose, setPurpose] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<StatisticalMethod | null>(null)
  const [recommendedMethods, setRecommendedMethods] = useState<StatisticalMethod[]>([])
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 기본 추천 방법 설정
  useEffect(() => {
    const defaultMethods = KeywordBasedRecommender.recommendMethods('', dataInfo)
    setRecommendedMethods(defaultMethods)
  }, [dataInfo])

  const handleAnalyzePurpose = () => {
    if (!purpose.trim()) return

    setIsAnalyzing(true)
    
    // 시뮬레이션: 분석 중 표시 (실제로는 즉시 처리)
    setTimeout(() => {
      // 키워드 추출
      const keywords = KeywordBasedRecommender.extractKeywords(purpose)
      setDetectedKeywords(keywords)

      // 추천 방법 생성
      const recommendations = KeywordBasedRecommender.recommendMethods(purpose, dataInfo)
      setRecommendedMethods(recommendations)

      setIsAnalyzing(false)
    }, 500)
  }

  const handleMethodSelect = (method: StatisticalMethod) => {
    setSelectedMethod(method)
    onPurposeSubmit(purpose || '분석 목적 미입력', method)
  }

  // 목적 텍스트 변경 시 실시간 분석 (디바운싱)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (purpose.length > 5) {
        const keywords = KeywordBasedRecommender.extractKeywords(purpose)
        setDetectedKeywords(keywords)
        
        const recommendations = KeywordBasedRecommender.recommendMethods(purpose, dataInfo)
        setRecommendedMethods(recommendations)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [purpose, dataInfo])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            무엇을 알고 싶으신가요?
          </label>
          <textarea 
            className="w-full min-h-[120px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="예: 남녀 간 키 차이가 있는지 알고 싶어요
나이에 따른 콜레스테롤 변화를 보고 싶어요
그룹 간 평균 차이를 비교하고 싶어요
치료 전후 효과를 검증하고 싶어요"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
          
          {/* 감지된 키워드 표시 */}
          {detectedKeywords.length > 0 && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
              <p className="text-xs text-muted-foreground mb-1">감지된 키워드:</p>
              <div className="flex flex-wrap gap-1">
                {detectedKeywords.map((keyword, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-xs rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button 
          onClick={handleAnalyzePurpose}
          disabled={!purpose || isAnalyzing}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isAnalyzing ? '분석 중...' : '스마트 분석 방법 추천'}
        </Button>

        {/* 데이터 정보 표시 */}
        {dataInfo && (
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>데이터 정보: {dataInfo.rowCount}행 × {dataInfo.columnCount}열</p>
              <p>
                {dataInfo.hasNumeric && '수치형 데이터 포함'}
                {dataInfo.hasNumeric && dataInfo.hasCategorical && ', '}
                {dataInfo.hasCategorical && '범주형 데이터 포함'}
              </p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6">
          <h4 className="font-medium mb-3">
            🎯 {purpose ? '맞춤' : '추천'} 분석 방법
          </h4>
          <div className="space-y-3">
            {recommendedMethods.length > 0 ? (
              recommendedMethods.map((method, index) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method)}
                  className={`w-full text-left p-3 bg-white dark:bg-background rounded-lg hover:shadow-md transition-all ${
                    selectedMethod?.id === method.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{method.name}</p>
                        {index === 0 && purpose && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-xs rounded">
                            최적 추천
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                분석 목적을 입력하면 최적의 방법을 추천해드립니다
              </p>
            )}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">💡 도움말</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 자연어로 편하게 입력하세요</li>
            <li>• <strong className="text-foreground">키워드 기반</strong>으로 최적의 방법을 추천합니다</li>
            <li>• 실시간으로 입력 내용을 분석합니다</li>
            <li>• 데이터 특성도 함께 고려됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}