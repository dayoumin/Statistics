/**
 * 통계 방법에 따른 변수 자동 매핑
 */

import { StatisticalMethod } from './method-mapping'

export interface VariableMapping {
  independentVar?: string | string[] // 독립변수
  dependentVar?: string // 종속변수
  groupVar?: string // 그룹 변수
  timeVar?: string // 시간 변수
  variables?: string[] // 일반 변수들
}

export interface ColumnInfo {
  name: string
  type: 'numeric' | 'categorical' | 'date' | 'text'
  uniqueValues?: number
  missing?: number
  min?: number
  max?: number
}

/**
 * 통계 방법에 따른 변수 자동 매핑
 */
export function autoMapVariables(
  method: StatisticalMethod,
  columns: ColumnInfo[]
): VariableMapping {
  const numericColumns = columns.filter(c => c.type === 'numeric')
  const categoricalColumns = columns.filter(c => c.type === 'categorical')
  const dateColumns = columns.filter(c => c.type === 'date')

  const mapping: VariableMapping = {}

  switch (method.category) {
    case 't-test':
      // t-test: 수치형 변수 1개 + (그룹 변수 1개)
      if (method.id === 'one-sample-t') {
        // 일표본 t-검정: 수치형 변수 1개
        if (numericColumns.length > 0) {
          mapping.dependentVar = numericColumns[0].name
        }
      } else if (method.id === 'paired-t') {
        // 대응표본 t-검정: 수치형 변수 2개 (전/후)
        if (numericColumns.length >= 2) {
          mapping.variables = [numericColumns[0].name, numericColumns[1].name]
        }
      } else {
        // 독립표본 t-검정: 수치형 변수 1개 + 그룹 변수 1개 (2 수준)
        if (numericColumns.length > 0) {
          mapping.dependentVar = numericColumns[0].name
        }
        if (categoricalColumns.length > 0) {
          // 2개 수준을 가진 범주형 변수 우선 선택
          const binaryVar = categoricalColumns.find(c => c.uniqueValues === 2)
          mapping.groupVar = binaryVar ? binaryVar.name : categoricalColumns[0].name
        }
      }
      break

    case 'anova':
      // ANOVA: 수치형 변수 1개 + 그룹 변수 1개 이상
      if (numericColumns.length > 0) {
        mapping.dependentVar = numericColumns[0].name
      }
      if (method.id === 'two-way-anova') {
        // 이원분산분석: 2개의 그룹 변수 필요
        if (categoricalColumns.length >= 2) {
          mapping.groupVar = `${categoricalColumns[0].name},${categoricalColumns[1].name}`
        } else if (categoricalColumns.length === 1) {
          mapping.groupVar = categoricalColumns[0].name
        }
      } else {
        // 일원분산분석
        if (categoricalColumns.length > 0) {
          mapping.groupVar = categoricalColumns[0].name
        }
      }
      break

    case 'regression':
      // 회귀분석: 종속변수 1개 + 독립변수 1개 이상
      if (method.id === 'logistic-regression') {
        // 로지스틱 회귀: 이진 종속변수 + 독립변수들
        const binaryVar = categoricalColumns.find(c => c.uniqueValues === 2)
        if (binaryVar) {
          mapping.dependentVar = binaryVar.name
          mapping.independentVar = numericColumns.map(c => c.name)
        }
      } else if (method.id === 'multiple-regression') {
        // 다중회귀: 수치형 종속변수 1개 + 여러 독립변수
        if (numericColumns.length >= 2) {
          mapping.dependentVar = numericColumns[0].name
          mapping.independentVar = numericColumns.slice(1).map(c => c.name)
        }
      } else {
        // 단순회귀: 수치형 변수 2개
        if (numericColumns.length >= 2) {
          mapping.dependentVar = numericColumns[0].name
          mapping.independentVar = numericColumns[1].name
        }
      }
      break

    case 'correlation':
      // 상관분석: 수치형 변수 2개 이상
      if (numericColumns.length >= 2) {
        mapping.variables = numericColumns.slice(0, 5).map(c => c.name) // 최대 5개
      }
      break

    case 'nonparametric':
      // 비모수 검정
      if (method.id === 'chi-square') {
        // 카이제곱: 범주형 변수 2개
        if (categoricalColumns.length >= 2) {
          mapping.variables = [categoricalColumns[0].name, categoricalColumns[1].name]
        }
      } else if (method.id === 'wilcoxon') {
        // Wilcoxon: 대응표본, 수치형 2개
        if (numericColumns.length >= 2) {
          mapping.variables = [numericColumns[0].name, numericColumns[1].name]
        }
      } else {
        // Mann-Whitney, Kruskal-Wallis: 수치형 + 그룹
        if (numericColumns.length > 0) {
          mapping.dependentVar = numericColumns[0].name
        }
        if (categoricalColumns.length > 0) {
          mapping.groupVar = categoricalColumns[0].name
        }
      }
      break

    case 'pca':
      // 주성분분석: 모든 수치형 변수
      mapping.variables = numericColumns.map(c => c.name)
      break

    case 'clustering':
      // 군집분석: 수치형 변수들
      mapping.variables = numericColumns.map(c => c.name)
      break

    case 'timeseries':
      // 시계열: 시간 변수 + 수치형 변수
      if (dateColumns.length > 0) {
        mapping.timeVar = dateColumns[0].name
      }
      if (numericColumns.length > 0) {
        mapping.dependentVar = numericColumns[0].name
      }
      break

    case 'survival':
      // 생존분석: 시간 변수 + 이벤트 변수 + 그룹 변수
      if (numericColumns.length > 0) {
        mapping.timeVar = numericColumns[0].name // 생존 시간
      }
      const eventVar = categoricalColumns.find(c => c.uniqueValues === 2)
      if (eventVar) {
        mapping.dependentVar = eventVar.name // 이벤트 발생 여부
      }
      if (categoricalColumns.length > 1) {
        mapping.groupVar = categoricalColumns.find(c => c !== eventVar)?.name
      }
      break

    default:
      // 기본: 첫 번째 수치형 변수
      if (numericColumns.length > 0) {
        mapping.variables = [numericColumns[0].name]
      }
  }

  return mapping
}

/**
 * 변수 매핑 검증
 */
export function validateVariableMapping(
  method: StatisticalMethod,
  mapping: VariableMapping,
  columns: ColumnInfo[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 필수 변수 확인
  switch (method.category) {
    case 't-test':
      if (!mapping.dependentVar && method.id !== 'paired-t') {
        errors.push('종속변수(수치형)를 선택해주세요')
      }
      if (method.id === 'two-sample-t' && !mapping.groupVar) {
        errors.push('그룹 변수(범주형)를 선택해주세요')
      }
      if (method.id === 'paired-t' && (!mapping.variables || mapping.variables.length < 2)) {
        errors.push('비교할 두 변수를 선택해주세요')
      }
      break

    case 'anova':
      if (!mapping.dependentVar) {
        errors.push('종속변수(수치형)를 선택해주세요')
      }
      if (!mapping.groupVar) {
        errors.push('그룹 변수(범주형)를 선택해주세요')
      }
      break

    case 'regression':
      if (!mapping.dependentVar) {
        errors.push('종속변수를 선택해주세요')
      }
      if (!mapping.independentVar) {
        errors.push('독립변수를 선택해주세요')
      }
      break

    case 'correlation':
      if (!mapping.variables || mapping.variables.length < 2) {
        errors.push('상관분석을 위해 최소 2개의 수치형 변수가 필요합니다')
      }
      break

    case 'chi-square':
      if (!mapping.variables || mapping.variables.length < 2) {
        errors.push('카이제곱 검정을 위해 2개의 범주형 변수가 필요합니다')
      }
      break
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 변수 유형별 추천 메시지
 */
export function getVariableSuggestions(
  method: StatisticalMethod,
  columns: ColumnInfo[]
): string[] {
  const suggestions: string[] = []
  const numericCount = columns.filter(c => c.type === 'numeric').length
  const categoricalCount = columns.filter(c => c.type === 'categorical').length

  switch (method.category) {
    case 't-test':
      if (method.id === 'two-sample-t') {
        suggestions.push('💡 두 그룹 간 평균을 비교합니다')
        suggestions.push('종속변수: 비교할 수치형 변수 (예: 키, 몸무게)')
        suggestions.push('그룹변수: 2개 그룹을 구분하는 범주형 변수 (예: 성별)')
      }
      break

    case 'regression':
      if (method.id === 'simple-regression') {
        suggestions.push('💡 한 변수가 다른 변수에 미치는 영향을 분석합니다')
        suggestions.push('종속변수: 예측하려는 변수 (Y)')
        suggestions.push('독립변수: 영향을 미치는 변수 (X)')
      }
      break

    case 'correlation':
      suggestions.push('💡 변수 간의 선형적 관계를 분석합니다')
      suggestions.push(`현재 ${numericCount}개의 수치형 변수 사용 가능`)
      break
  }

  return suggestions
}