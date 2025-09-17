'use client'

import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatisticalMethod } from '@/lib/statistics/method-mapping'
import { QUESTION_TYPES } from '@/lib/statistics/method-mapping'

interface RecommendedMethodsProps {
  methods: StatisticalMethod[]
  selectedMethod: StatisticalMethod | null
  showRecommendations: boolean
  onToggle: () => void
  onMethodSelect: (method: StatisticalMethod) => void
  onQuestionTypeChange: (typeId: string) => void
}

export function RecommendedMethods({
  methods,
  selectedMethod,
  showRecommendations,
  onToggle,
  onMethodSelect,
  onQuestionTypeChange
}: RecommendedMethodsProps) {
  return (
    <>
      {/* AI 추천 버튼 */}
      <div className="flex gap-2">
        <Button onClick={onToggle} variant="outline" className="flex-1">
          <Sparkles className="w-4 h-4 mr-2" />
          AI 추천 방법 {showRecommendations ? '숨기기' : '보기'}
          {methods.length > 0 && `(${methods.length}개)`}
        </Button>
      </div>

      {/* AI 추천 방법 표시 */}
      {showRecommendations && methods.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm mb-2">🤖 데이터 특성 기반 추천</h4>
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => {
                onMethodSelect(method)
                // 해당 카테고리로 이동
                const questionType = QUESTION_TYPES.find(
                  q => q.methods.includes(method.category)
                )
                if (questionType) {
                  onQuestionTypeChange(questionType.id)
                }
              }}
              className={`w-full text-left p-2 bg-white dark:bg-background rounded hover:shadow-sm transition-all ${
                selectedMethod?.id === method.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{method.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{method.description}</span>
                </div>
                {selectedMethod?.id === method.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}