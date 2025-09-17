/**
 * 스마트 플로우 네비게이션을 위한 공통 인터페이스
 */

import { StatisticalMethod } from './smart-flow'

// 변수 매핑 타입 정의
export interface VariableMapping {
  dependent?: string[]
  independent?: string[]
  group?: string
  time?: string
  variables?: string[]
}

export interface StepNavigationProps {
  /** 다음 단계로 이동 */
  onNext?: () => void
  /** 이전 단계로 이동 */
  onPrevious?: () => void
  /** 다음 단계로 이동 가능 여부 */
  canGoNext?: boolean
  /** 이전 단계로 이동 가능 여부 */
  canGoPrevious?: boolean
  /** 현재 단계 번호 */
  currentStep?: number
  /** 전체 단계 수 */
  totalSteps?: number
}

export interface DataUploadStepProps extends StepNavigationProps {
  onUploadComplete: (file: File, data: any[]) => void
}

export interface DataValidationStepProps extends StepNavigationProps {
  validationResults: any
  data: any[] | null
}

export interface PurposeInputStepProps extends StepNavigationProps {
  onPurposeSubmit: (purpose: string, method: any) => void
  validationResults?: any
  data?: any[] | null
}

export interface AnalysisExecutionStepProps extends StepNavigationProps {
  selectedMethod: StatisticalMethod | null
  variableMapping: VariableMapping | null
  data?: any[] | null
  onAnalysisComplete?: (results: any) => void
}

export interface ResultsActionStepProps extends StepNavigationProps {
  analysisResults: any
  onNewAnalysis: () => void
  onExport: () => void
}