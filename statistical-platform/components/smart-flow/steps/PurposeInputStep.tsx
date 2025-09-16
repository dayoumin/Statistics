'use client'

import { useState } from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatisticalMethod } from '@/types/smart-flow'

interface PurposeInputStepProps {
  onPurposeSubmit: (purpose: string, method: StatisticalMethod) => void
}

export function PurposeInputStep({ onPurposeSubmit }: PurposeInputStepProps) {
  const [purpose, setPurpose] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<StatisticalMethod | null>(null)

  const recommendedMethods: StatisticalMethod[] = [
    {
      id: 'independent-t-test',
      name: '독립표본 t-검정',
      description: '두 그룹 간 평균 차이 검정',
      category: 't-test'
    },
    {
      id: 'correlation',
      name: '상관분석',
      description: '변수 간 관계 분석',
      category: 'regression'
    },
    {
      id: 'regression',
      name: '회귀분석',
      description: '영향 관계 분석 및 예측',
      category: 'regression'
    },
    {
      id: 'anova',
      name: '분산분석 (ANOVA)',
      description: '세 그룹 이상의 평균 차이 검정',
      category: 'anova'
    }
  ]

  const handleMethodSelect = (method: StatisticalMethod) => {
    setSelectedMethod(method)
    if (purpose) {
      onPurposeSubmit(purpose, method)
    }
  }

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
그룹 간 평균 차이를 비교하고 싶어요"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>

        <Button 
          onClick={() => {
            // AI 추천 로직 실행 (추후 구현)
            console.log('분석 목적:', purpose)
          }}
          disabled={!purpose}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI 분석 방법 추천받기
        </Button>

        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6">
          <h4 className="font-medium mb-3">🎯 추천 분석 방법</h4>
          <div className="space-y-3">
            {recommendedMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => handleMethodSelect(method)}
                className={`w-full text-left p-3 bg-white dark:bg-background rounded-lg hover:shadow-md transition-all ${
                  selectedMethod?.id === method.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">💡 도움말</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 자연어로 편하게 입력하세요</li>
            <li>• AI가 데이터 특성을 고려해 최적의 방법을 추천합니다</li>
            <li>• 추천된 방법 중 하나를 선택하거나 직접 방법을 선택할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}