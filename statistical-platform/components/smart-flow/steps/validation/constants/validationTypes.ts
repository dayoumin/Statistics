import { ValidationResults, ExtendedValidationResults, ColumnStatistics } from '@/types/smart-flow'

export interface DataValidationStepProps {
  validationResults: ValidationResults | ExtendedValidationResults | null
  data: any[] | null
}

export interface CorrelationMatrixData {
  matrix: number[][]
  labels: string[]
}

export interface ChartModalState {
  column: ColumnStatistics | null
  isOpen: boolean
}

// Type guard for ExtendedValidationResults
export function hasColumnStats(results: ValidationResults | null): results is ExtendedValidationResults {
  return results !== null && 'columnStats' in results
}

// Check if column is numeric
export function isNumericColumn(column: ColumnStatistics): boolean {
  return column.type === 'numeric'
}

// Check if column is categorical
export function isCategoricalColumn(column: ColumnStatistics): boolean {
  return column.type === 'categorical' || column.uniqueValues <= 20
}