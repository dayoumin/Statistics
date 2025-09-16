'use client'

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { ValidationResults } from '@/types/smart-flow'

interface DataValidationStepProps {
  validationResults: ValidationResults | null
  data: any[] | null
}

export function DataValidationStep({ validationResults, data }: DataValidationStepProps) {
  if (!validationResults || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">데이터를 먼저 업로드해주세요.</p>
      </div>
    )
  }

  const hasErrors = validationResults.errors.length > 0
  const hasWarnings = validationResults.warnings.length > 0

  return (
    <div className="space-y-6">
      <div className={`rounded-lg p-6 ${
        hasErrors ? 'bg-red-50 dark:bg-red-950/20' : 
        hasWarnings ? 'bg-yellow-50 dark:bg-yellow-950/20' : 
        'bg-green-50 dark:bg-green-950/20'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          {hasErrors ? (
            <XCircle className="w-6 h-6 text-red-600" />
          ) : hasWarnings ? (
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
          <h3 className="text-lg font-semibold">
            {hasErrors ? '데이터 검증 실패' : 
             hasWarnings ? '데이터 검증 완료 (경고 있음)' : 
             '데이터 검증 완료'}
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white dark:bg-background rounded p-3">
            <p className="text-sm text-muted-foreground">총 행 수</p>
            <p className="text-2xl font-bold">{validationResults.totalRows}</p>
          </div>
          <div className="bg-white dark:bg-background rounded p-3">
            <p className="text-sm text-muted-foreground">변수 수</p>
            <p className="text-2xl font-bold">{validationResults.columnCount}</p>
          </div>
          <div className="bg-white dark:bg-background rounded p-3">
            <p className="text-sm text-muted-foreground">결측값</p>
            <p className="text-2xl font-bold">{validationResults.missingValues}</p>
          </div>
          <div className="bg-white dark:bg-background rounded p-3">
            <p className="text-sm text-muted-foreground">데이터 타입</p>
            <p className="text-2xl font-bold">{validationResults.dataType}</p>
          </div>
        </div>

        {validationResults.variables.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">발견된 변수:</p>
            <div className="flex flex-wrap gap-2">
              {validationResults.variables.map((variable, index) => (
                <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {variable}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasErrors && (
        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-red-900 dark:text-red-100">❌ 오류</h4>
          <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
            {validationResults.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {hasWarnings && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4">
          <h4 className="font-medium mb-2">⚠️ 경고</h4>
          <ul className="text-sm space-y-1">
            {validationResults.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {!hasErrors && !hasWarnings && (
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
          <h4 className="font-medium mb-2">✅ 확인사항</h4>
          <ul className="text-sm space-y-1">
            <li>• 모든 데이터가 정상적으로 로드되었습니다</li>
            <li>• 통계 분석을 진행할 준비가 되었습니다</li>
          </ul>
        </div>
      )}
    </div>
  )
}