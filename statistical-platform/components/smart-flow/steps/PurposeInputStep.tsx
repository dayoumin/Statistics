'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronRight, AlertCircle, Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MethodSelector } from './purpose/MethodSelector'
import { VariableMappingDisplay } from './purpose/VariableMappingDisplay'
import { RecommendedMethods } from './purpose/RecommendedMethods'
import {
  QUESTION_TYPES,
  STATISTICAL_METHODS,
  getMethodsByQuestionType,
  recommendMethods,
  checkMethodRequirements,
  type StatisticalMethod
} from '@/lib/statistics/method-mapping'
import {
  autoMapVariables,
  validateVariableMapping,
  getVariableSuggestions,
  type VariableMapping,
  type ColumnInfo
} from '@/lib/statistics/variable-mapping'
import type { PurposeInputStepProps } from '@/types/smart-flow-navigation'
import { logger } from '@/lib/utils/logger'

export function PurposeInputStep({
  onPurposeSubmit,
  validationResults,
  data,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious
}: PurposeInputStepProps) {
  const [purpose, setPurpose] = useState('')
  const [selectedQuestionType, setSelectedQuestionType] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<StatisticalMethod | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [variableMapping, setVariableMapping] = useState<VariableMapping | null>(null)
  const [showVariableMapping, setShowVariableMapping] = useState(false)

  // 데이터 프로파일 생성
  const dataProfile = useMemo(() => {
    if (!validationResults || !data) return null

    interface ColumnData {
      type: string
      uniqueValues?: number
      name: string
      missing?: number
    }

    const numericVars = validationResults.columns?.filter(
      (col: ColumnData) => col.type === 'numeric'
    ).length || 0

    const categoricalVars = validationResults.columns?.filter(
      (col: ColumnData) => col.type === 'categorical'
    ).length || 0

    const hasTimeVar = validationResults.columns?.some(
      (col: ColumnData) => col.type === 'date'
    ) || false

    const hasGroupVar = categoricalVars > 0
    const groupLevels = validationResults.columns?.find(
      (col: ColumnData) => col.type === 'categorical'
    )?.uniqueValues || 0

    return {
      numericVars,
      categoricalVars,
      totalRows: data.length,
      hasTimeVar,
      hasGroupVar,
      groupLevels,
      normalityPassed: validationResults.normalityTest?.isNormal || false,
      homogeneityPassed: validationResults.homogeneityTest?.equalVariance || false
    }
  }, [validationResults, data])

  // 추천 방법 가져오기
  const recommendedMethods = useMemo(() => {
    if (!dataProfile) return []
    return recommendMethods(dataProfile)
  }, [dataProfile])

  // 선택된 질문 유형에 따른 방법들
  const filteredMethods = useMemo(() => {
    if (!selectedQuestionType) return []
    return getMethodsByQuestionType(selectedQuestionType)
  }, [selectedQuestionType])

  // 방법 선택 시 요구사항 체크
  const methodRequirements = useMemo(() => {
    if (!selectedMethod || !dataProfile) return null
    return checkMethodRequirements(selectedMethod, dataProfile)
  }, [selectedMethod, dataProfile])

  const handleQuestionTypeSelect = (typeId: string) => {
    setSelectedQuestionType(typeId)
    setSelectedMethod(null) // 질문 유형 변경시 선택된 방법 초기화
  }

  const handleMethodSelect = (method: StatisticalMethod) => {
    if (!dataProfile) return

    const requirements = checkMethodRequirements(method, dataProfile)
    if (!requirements.canUse) {
      // 요구사항 미충족시 경고만 표시, 선택은 가능
      logger.warn('Method requirements not met', { warnings: requirements.warnings })
    }

    setSelectedMethod(method)

    // 변수 자동 매핑
    if (validationResults?.columns) {
      const columnInfo: ColumnInfo[] = validationResults.columns.map((col: ColumnData) => ({
        name: col.name,
        type: col.type,
        uniqueValues: col.uniqueValues,
        missing: col.missing
      }))

      const mapping = autoMapVariables(method, columnInfo)
      setVariableMapping(mapping)
      setShowVariableMapping(true)
    }
  }

  const handleSubmit = () => {
    if (selectedMethod && onPurposeSubmit) {
      onPurposeSubmit(purpose || '데이터 분석', selectedMethod)
    }
    if (onNext) {
      onNext()
    }
  }

  // 다음 단계 이동 가능 여부 업데이트
  useEffect(() => {
    const canProceed = selectedMethod !== null
    if (canGoNext !== canProceed) {
      // 상태 업데이트가 필요한 경우에만 처리
    }
  }, [selectedMethod, canGoNext])

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>Step 3: 분석 목표 설정</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-6">
          {/* 분석 목적 입력 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              무엇을 알고 싶으신가요? (선택사항)
            </label>
            <textarea
              className="w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예: 남녀 간 키 차이가 있는지 알고 싶어요..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          {/* AI 추천 방법 */}
          <RecommendedMethods
            methods={recommendedMethods}
            selectedMethod={selectedMethod}
            showRecommendations={showRecommendations}
            onToggle={() => setShowRecommendations(!showRecommendations)}
            onMethodSelect={handleMethodSelect}
            onQuestionTypeChange={setSelectedQuestionType}
          />

          {/* 2단계 선택 UI */}
          <Tabs value={selectedQuestionType || undefined} onValueChange={handleQuestionTypeSelect}>
            <TabsList className="grid grid-cols-4 w-full">
              {QUESTION_TYPES.map((type) => (
                <TabsTrigger key={type.id} value={type.id} className="text-xs">
                  <span className="mr-1">{type.icon}</span>
                  <span className="hidden md:inline">{type.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {QUESTION_TYPES.map((type) => (
              <TabsContent key={type.id} value={type.id} className="space-y-3 mt-4">
                <p className="text-sm text-muted-foreground">{type.description}</p>

                <MethodSelector
                  methods={filteredMethods}
                  selectedMethod={selectedMethod}
                  dataProfile={dataProfile}
                  onMethodSelect={handleMethodSelect}
                  checkMethodRequirements={checkMethodRequirements}
                />
              </TabsContent>
            ))}
          </Tabs>

          {/* 선택된 방법 정보 */}
          {selectedMethod && (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200">
              <Check className="h-4 w-4" />
              <AlertDescription>
                <strong>선택된 방법:</strong> {selectedMethod.name}
                {selectedMethod.requirements && (
                  <div className="mt-2 text-sm">
                    <strong>요구사항:</strong>
                    <ul className="mt-1 ml-4 list-disc">
                      {selectedMethod.requirements.minSampleSize && (
                        <li>최소 {selectedMethod.requirements.minSampleSize}개 샘플 필요</li>
                      )}
                      {selectedMethod.requirements.assumptions?.map((assumption, idx) => (
                        <li key={idx}>{assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 변수 자동 매핑 결과 */}
          {selectedMethod && variableMapping && showVariableMapping && (
            <VariableMappingDisplay
              mapping={variableMapping}
              onClose={() => setShowVariableMapping(false)}
            />
          )}

          {/* 데이터 정보 없을 때 경고 */}
          {!dataProfile && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                데이터 검증이 완료되지 않았습니다. 일부 추천 기능이 제한될 수 있습니다.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex justify-between w-full">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 단계
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!selectedMethod}
          >
            다음 단계
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}