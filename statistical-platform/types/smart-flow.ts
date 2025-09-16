import { LucideIcon } from 'lucide-react'

export interface StepConfig {
  id: number
  name: string
  icon: LucideIcon
  description: string
}

export interface ValidationResults {
  isValid: boolean
  totalRows: number
  columnCount: number
  missingValues: number
  dataType: string
  variables: string[]
  errors: string[]
  warnings: string[]
}

export interface AnalysisConfig {
  purpose: string
  selectedMethod: StatisticalMethod | null
  parameters?: Record<string, any>
}

export interface StatisticalMethod {
  id: string
  name: string
  description: string
  category: 'descriptive' | 't-test' | 'anova' | 'regression' | 'nonparametric' | 'advanced'
}

export interface AnalysisResult {
  method: string
  statistic: number
  pValue: number
  effectSize?: number
  confidence?: {
    lower: number
    upper: number
  }
  interpretation: string
  nextActions?: NextAction[]
}

export interface NextAction {
  id: string
  title: string
  description: string
  icon?: LucideIcon
  action: () => void
}

export interface SmartFlowState {
  currentStep: number
  completedSteps: number[]
  uploadedFile: File | null
  uploadedData: any[] | null
  validationResults: ValidationResults | null
  analysisConfig: AnalysisConfig | null
  analysisResults: AnalysisResult | null
  isLoading: boolean
  error: string | null
}