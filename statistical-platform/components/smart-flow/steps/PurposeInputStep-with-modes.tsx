'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Sparkles, Zap, Brain, Info, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { StatisticalMethod } from '@/types/smart-flow'
import { KeywordBasedRecommender } from '@/lib/services/keyword-based-recommender'
import { hybridRecommender } from '@/lib/services/hybrid-recommender'

type RecommendMode = 'quick' | 'smart' | 'auto'

interface PurposeInputStepWithModesProps {
  onPurposeSubmit: (purpose: string, method: StatisticalMethod) => void
  dataInfo?: {
    columnCount: number
    rowCount: number
    hasNumeric: boolean
    hasCategorical: boolean
  }
}

export function PurposeInputStepWithModes({ 
  onPurposeSubmit,
  dataInfo 
}: PurposeInputStepWithModesProps) {
  const [purpose, setPurpose] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<StatisticalMethod | null>(null)
  const [recommendedMethods, setRecommendedMethods] = useState<StatisticalMethod[]>([])
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // 추천 모드
  const [mode, setMode] = useState<RecommendMode>('auto')
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null)
  const [llmInsights, setLlmInsights] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(0)

  // Ollama 상태 확인
  useEffect(() => {
    checkOllamaStatus()
  }, [])

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags')
      setOllamaAvailable(response.ok)
    } catch {
      setOllamaAvailable(false)
    }
  }

  // 기본 추천 방법 설정
  useEffect(() => {
    const defaultMethods = KeywordBasedRecommender.recommendMethods('', dataInfo)
    setRecommendedMethods(defaultMethods)
  }, [dataInfo])

  const handleAnalyzePurpose = async () => {
    if (!purpose.trim()) return

    setIsAnalyzing(true)
    setLlmInsights('')
    
    try {
      // 모드에 따른 분석
      if (mode === 'quick' || (mode === 'auto' && !ollamaAvailable)) {
        // 키워드 기반만
        await analyzeWithKeywords()
      } else if (mode === 'smart' || (mode === 'auto' && ollamaAvailable)) {
        // 하이브리드 (키워드 + LLM)
        await analyzeWithHybrid()
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      // 오류 시 키워드 폴백
      await analyzeWithKeywords()
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeWithKeywords = async () => {
    // 키워드 추출
    const keywords = KeywordBasedRecommender.extractKeywords(purpose)
    setDetectedKeywords(keywords)

    // 추천 방법 생성
    const recommendations = KeywordBasedRecommender.recommendMethods(purpose, dataInfo)
    setRecommendedMethods(recommendations)
    setConfidence(0.6 + (keywords.length * 0.05))
  }

  const analyzeWithHybrid = async () => {
    // 1. 즉시 키워드 결과
    const keywords = KeywordBasedRecommender.extractKeywords(purpose)
    setDetectedKeywords(keywords)
    
    const keywordRecommendations = KeywordBasedRecommender.recommendMethods(purpose, dataInfo)
    setRecommendedMethods(keywordRecommendations)
    
    // 2. LLM 분석 (백그라운드)
    const result = await hybridRecommender.recommend(
      purpose,
      dataInfo,
      {
        onImmediate: (immediate) => {
          // 이미 키워드로 표시됨
        },
        onEnhanced: (enhanced) => {
          if (enhanced?.methods) {
            setRecommendedMethods(enhanced.methods)
            setLlmInsights(enhanced.insights || '')
            setConfidence(enhanced.confidence)
          }
        },
        onFinal: (final) => {
          setRecommendedMethods(final.methods)
          setConfidence(final.confidence)
        }
      }
    )
  }

  const handleMethodSelect = (method: StatisticalMethod) => {
    setSelectedMethod(method)
    onPurposeSubmit(purpose || '분석 목적 미입력', method)
  }

  // 실시간 분석 (디바운싱)
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
      {/* 추천 모드 선택 */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">추천 모드</h4>
            {ollamaAvailable !== null && (
              <Badge variant={ollamaAvailable ? 'default' : 'secondary'}>
                {ollamaAvailable ? 'AI 사용 가능' : 'AI 사용 불가'}
              </Badge>
            )}
          </div>
          
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as RecommendMode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quick" id="quick" />
              <Label htmlFor="quick" className="flex items-center gap-2 cursor-pointer">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>빠른 추천</span>
                <span className="text-xs text-muted-foreground">(키워드 기반, 즉시)</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="smart" 
                id="smart"
                disabled={!ollamaAvailable}
              />
              <Label 
                htmlFor="smart" 
                className={`flex items-center gap-2 cursor-pointer ${
                  !ollamaAvailable ? 'opacity-50' : ''
                }`}
              >
                <Brain className="w-4 h-4 text-blue-500" />
                <span>스마트 추천</span>
                <span className="text-xs text-muted-foreground">(AI 분석, 2-3초)</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto" id="auto" />
              <Label htmlFor="auto" className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>자동 선택</span>
                <span className="text-xs text-muted-foreground">(최적 방법 자동 선택)</span>
              </Label>
            </div>
          </RadioGroup>

          {mode === 'auto' && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              {ollamaAvailable 
                ? '✨ AI를 사용하여 더 정확한 분석을 제공합니다'
                : '⚡ 키워드 기반으로 빠른 분석을 제공합니다'}
            </div>
          )}
        </div>
      </Card>

      {/* 분석 목적 입력 */}
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
          {mode === 'quick' ? (
            <Zap className="w-4 h-4 mr-2" />
          ) : mode === 'smart' ? (
            <Brain className="w-4 h-4 mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {isAnalyzing ? '분석 중...' : '분석 방법 추천받기'}
        </Button>

        {/* AI 인사이트 표시 */}
        {llmInsights && (
          <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">AI 분석 인사이트</p>
                <p className="text-sm text-muted-foreground">{llmInsights}</p>
              </div>
            </div>
          </Card>
        )}

        {/* 추천 결과 */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">
              🎯 {purpose ? '맞춤' : '추천'} 분석 방법
            </h4>
            {confidence > 0 && (
              <Badge variant={confidence > 0.8 ? 'default' : confidence > 0.6 ? 'secondary' : 'outline'}>
                신뢰도 {(confidence * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
          
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

        {/* Ollama 설치 안내 */}
        {!ollamaAvailable && (
          <Card className="p-4 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">AI 분석을 사용하려면</p>
                <ol className="text-xs text-muted-foreground space-y-1">
                  <li>1. <a href="https://ollama.ai" target="_blank" className="underline">Ollama 설치</a></li>
                  <li>2. 터미널에서: <code className="bg-muted px-1">ollama pull llama3.2:1b</code></li>
                  <li>3. 실행: <code className="bg-muted px-1">ollama serve</code></li>
                </ol>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}