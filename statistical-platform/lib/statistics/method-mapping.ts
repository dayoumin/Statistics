/**
 * 29개 통계 방법 매핑 및 카테고리 정의
 */

export interface StatisticalMethod {
  id: string
  name: string
  description: string
  category: string
  subcategory?: string
  requirements?: {
    minSampleSize?: number
    variableTypes?: string[]
    assumptions?: string[]
  }
}

export const QUESTION_TYPES = [
  {
    id: 'comparison',
    name: '차이/비교 분석',
    icon: '📊',
    description: '두 개 이상 그룹 간 차이 검정',
    methods: ['t-test', 'anova', 'nonparametric']
  },
  {
    id: 'relationship',
    name: '관계/예측 분석',
    icon: '📈',
    description: '변수 간 관계 파악 및 예측',
    methods: ['correlation', 'regression']
  },
  {
    id: 'frequency',
    name: '빈도/분포 분석',
    icon: '📋',
    description: '범주형 자료 분석 및 적합도',
    methods: ['chi-square', 'descriptive']
  },
  {
    id: 'advanced',
    name: '고급/특수 분석',
    icon: '🔬',
    description: '차원축소, 군집, 시계열 등',
    methods: ['pca', 'clustering', 'timeseries', 'survival']
  }
]

export const STATISTICAL_METHODS: StatisticalMethod[] = [
  // 기술통계 (3개)
  {
    id: 'descriptive-stats',
    name: '기술통계량',
    description: '평균, 중앙값, 표준편차 등 기본 통계',
    category: 'descriptive',
    requirements: {
      minSampleSize: 1,
      variableTypes: ['numeric']
    }
  },
  {
    id: 'normality-test',
    name: 'Shapiro-Wilk 정규성 검정',
    description: '데이터의 정규분포 여부 검정',
    category: 'descriptive',
    requirements: {
      minSampleSize: 3,
      variableTypes: ['numeric']
    }
  },
  {
    id: 'homogeneity-test',
    name: 'Levene 등분산성 검정',
    description: '그룹 간 분산의 동일성 검정',
    category: 'descriptive',
    requirements: {
      minSampleSize: 4,
      variableTypes: ['numeric', 'categorical']
    }
  },

  // T-검정 (4개)
  {
    id: 'one-sample-t',
    name: '일표본 t-검정',
    description: '한 그룹의 평균이 특정값과 다른지 검정',
    category: 't-test',
    requirements: {
      minSampleSize: 2,
      variableTypes: ['numeric'],
      assumptions: ['정규성']
    }
  },
  {
    id: 'two-sample-t',
    name: '독립표본 t-검정',
    description: '두 독립 그룹 간 평균 차이 검정',
    category: 't-test',
    requirements: {
      minSampleSize: 4,
      variableTypes: ['numeric', 'categorical'],
      assumptions: ['정규성', '등분산성']
    }
  },
  {
    id: 'paired-t',
    name: '대응표본 t-검정',
    description: '같은 대상의 전후 차이 검정',
    category: 't-test',
    requirements: {
      minSampleSize: 2,
      variableTypes: ['numeric'],
      assumptions: ['정규성']
    }
  },
  {
    id: 'welch-t',
    name: "Welch's t-검정",
    description: '등분산 가정 없는 두 그룹 비교',
    category: 't-test',
    requirements: {
      minSampleSize: 4,
      variableTypes: ['numeric', 'categorical'],
      assumptions: ['정규성']
    }
  },

  // ANOVA & 사후검정 (5개)
  {
    id: 'one-way-anova',
    name: '일원분산분석',
    description: '3개 이상 그룹 간 평균 차이 검정',
    category: 'anova',
    requirements: {
      minSampleSize: 6,
      variableTypes: ['numeric', 'categorical'],
      assumptions: ['정규성', '등분산성']
    }
  },
  {
    id: 'two-way-anova',
    name: '이원분산분석',
    description: '2개 요인의 효과 분석',
    category: 'anova',
    requirements: {
      minSampleSize: 8,
      variableTypes: ['numeric', 'categorical'],
      assumptions: ['정규성', '등분산성']
    }
  },
  {
    id: 'tukey-hsd',
    name: 'Tukey HSD',
    description: 'ANOVA 후 다중비교',
    category: 'anova',
    subcategory: 'posthoc',
    requirements: {
      minSampleSize: 6,
      variableTypes: ['numeric', 'categorical']
    }
  },
  {
    id: 'bonferroni',
    name: 'Bonferroni 보정',
    description: '다중비교 보정',
    category: 'anova',
    subcategory: 'posthoc',
    requirements: {
      minSampleSize: 6,
      variableTypes: ['numeric', 'categorical']
    }
  },
  {
    id: 'games-howell',
    name: 'Games-Howell',
    description: '등분산 가정 없는 사후검정',
    category: 'anova',
    subcategory: 'posthoc',
    requirements: {
      minSampleSize: 6,
      variableTypes: ['numeric', 'categorical']
    }
  },

  // 회귀 & 상관 (4개)
  {
    id: 'simple-regression',
    name: '단순선형회귀',
    description: '하나의 예측변수로 종속변수 예측',
    category: 'regression',
    requirements: {
      minSampleSize: 10,
      variableTypes: ['numeric'],
      assumptions: ['선형성', '정규성', '등분산성']
    }
  },
  {
    id: 'multiple-regression',
    name: '다중회귀분석',
    description: '여러 예측변수로 종속변수 예측',
    category: 'regression',
    requirements: {
      minSampleSize: 20,
      variableTypes: ['numeric'],
      assumptions: ['선형성', '정규성', '등분산성', '다중공선성']
    }
  },
  {
    id: 'logistic-regression',
    name: '로지스틱 회귀',
    description: '이진 종속변수 예측',
    category: 'regression',
    requirements: {
      minSampleSize: 50,
      variableTypes: ['numeric', 'categorical']
    }
  },
  {
    id: 'correlation',
    name: '상관분석',
    description: 'Pearson/Spearman 상관계수',
    category: 'correlation',
    requirements: {
      minSampleSize: 3,
      variableTypes: ['numeric']
    }
  },

  // 비모수 검정 (5개)
  {
    id: 'mann-whitney',
    name: 'Mann-Whitney U',
    description: '독립 두 그룹 비모수 검정',
    category: 'nonparametric',
    requirements: {
      minSampleSize: 4,
      variableTypes: ['numeric', 'categorical']
    }
  },
  {
    id: 'wilcoxon',
    name: 'Wilcoxon 부호순위',
    description: '대응표본 비모수 검정',
    category: 'nonparametric',
    requirements: {
      minSampleSize: 5,
      variableTypes: ['numeric']
    }
  },
  {
    id: 'kruskal-wallis',
    name: 'Kruskal-Wallis',
    description: '3개 이상 그룹 비모수 검정',
    category: 'nonparametric',
    requirements: {
      minSampleSize: 6,
      variableTypes: ['numeric', 'categorical']
    }
  },
  {
    id: 'dunn-test',
    name: 'Dunn 검정',
    description: 'Kruskal-Wallis 사후검정',
    category: 'nonparametric',
    subcategory: 'posthoc',
    requirements: {
      minSampleSize: 6,
      variableTypes: ['numeric', 'categorical']
    }
  },
  {
    id: 'chi-square',
    name: '카이제곱 검정',
    description: '범주형 변수 독립성 검정',
    category: 'chi-square',
    requirements: {
      minSampleSize: 20,
      variableTypes: ['categorical']
    }
  },

  // 고급 분석 (6개)
  {
    id: 'pca',
    name: '주성분분석',
    description: '차원 축소 및 변수 요약',
    category: 'pca',
    requirements: {
      minSampleSize: 30,
      variableTypes: ['numeric']
    }
  },
  {
    id: 'k-means',
    name: 'K-평균 군집',
    description: '데이터 그룹화',
    category: 'clustering',
    requirements: {
      minSampleSize: 30,
      variableTypes: ['numeric']
    }
  },
  {
    id: 'hierarchical',
    name: '계층적 군집',
    description: '계층구조 군집 분석',
    category: 'clustering',
    requirements: {
      minSampleSize: 20,
      variableTypes: ['numeric']
    }
  },
  {
    id: 'time-decomposition',
    name: '시계열 분해',
    description: '추세, 계절성, 잔차 분석',
    category: 'timeseries',
    requirements: {
      minSampleSize: 50,
      variableTypes: ['numeric', 'date']
    }
  },
  {
    id: 'arima',
    name: 'ARIMA 예측',
    description: '시계열 예측 모델',
    category: 'timeseries',
    requirements: {
      minSampleSize: 100,
      variableTypes: ['numeric', 'date']
    }
  },
  {
    id: 'kaplan-meier',
    name: 'Kaplan-Meier 생존분석',
    description: '생존 확률 추정',
    category: 'survival',
    requirements: {
      minSampleSize: 20,
      variableTypes: ['numeric', 'categorical']
    }
  }
]

/**
 * 질문 유형에 따른 통계 방법 필터링
 */
export function getMethodsByQuestionType(questionType: string): StatisticalMethod[] {
  const question = QUESTION_TYPES.find(q => q.id === questionType)
  if (!question) return []

  return STATISTICAL_METHODS.filter(method =>
    question.methods.includes(method.category) ||
    question.methods.includes(method.subcategory || '')
  )
}

/**
 * 데이터 특성에 따른 통계 방법 추천
 */
export function recommendMethods(dataProfile: {
  numericVars: number
  categoricalVars: number
  totalRows: number
  hasTimeVar: boolean
  hasGroupVar: boolean
  groupLevels?: number
}): StatisticalMethod[] {
  const recommendations: StatisticalMethod[] = []

  // 기본 기술통계는 항상 추천
  recommendations.push(STATISTICAL_METHODS.find(m => m.id === 'descriptive-stats')!)

  // 수치형 변수가 2개 이상이면 상관분석
  if (dataProfile.numericVars >= 2) {
    recommendations.push(STATISTICAL_METHODS.find(m => m.id === 'correlation')!)
  }

  // 그룹 변수가 있고 수치형 변수가 있으면
  if (dataProfile.hasGroupVar && dataProfile.numericVars >= 1) {
    if (dataProfile.groupLevels === 2) {
      recommendations.push(STATISTICAL_METHODS.find(m => m.id === 'two-sample-t')!)
      recommendations.push(STATISTICAL_METHODS.find(m => m.id === 'mann-whitney')!)
    } else if ((dataProfile.groupLevels || 0) >= 3) {
      recommendations.push(STATISTICAL_METHODS.find(m => m.id === 'one-way-anova')!)
      recommendations.push(STATISTICAL_METHODS.find(m => m.id === 'kruskal-wallis')!)
    }
  }

  // 시간 변수가 있으면 시계열 분석
  if (dataProfile.hasTimeVar && dataProfile.totalRows >= 50) {
    recommendations.push(STATISTICAL_METHODS.find(m => m.id === 'time-decomposition')!)
  }

  // 충분한 데이터가 있으면 고급 분석
  if (dataProfile.totalRows >= 30 && dataProfile.numericVars >= 3) {
    recommendations.push(STATISTICAL_METHODS.find(m => m.id === 'pca')!)
  }

  return recommendations.filter(Boolean)
}

/**
 * 통계 방법의 요구사항 확인
 */
export function checkMethodRequirements(
  method: StatisticalMethod,
  dataProfile: any
): { canUse: boolean; warnings: string[] } {
  const warnings: string[] = []
  let canUse = true

  if (!method.requirements) {
    return { canUse, warnings }
  }

  // 최소 샘플 크기 확인
  if (method.requirements.minSampleSize &&
      dataProfile.totalRows < method.requirements.minSampleSize) {
    warnings.push(`최소 ${method.requirements.minSampleSize}개 데이터 필요 (현재: ${dataProfile.totalRows}개)`)
    canUse = false
  }

  // 변수 타입 확인
  if (method.requirements.variableTypes) {
    if (method.requirements.variableTypes.includes('numeric') &&
        dataProfile.numericVars === 0) {
      warnings.push('수치형 변수 필요')
      canUse = false
    }
    if (method.requirements.variableTypes.includes('categorical') &&
        dataProfile.categoricalVars === 0) {
      warnings.push('범주형 변수 필요')
      canUse = false
    }
  }

  // 가정 확인
  if (method.requirements.assumptions) {
    method.requirements.assumptions.forEach(assumption => {
      if (assumption === '정규성' && !dataProfile.normalityPassed) {
        warnings.push('정규성 가정 위반 (비모수 검정 고려)')
      }
      if (assumption === '등분산성' && !dataProfile.homogeneityPassed) {
        warnings.push('등분산성 가정 위반 (Welch 검정 고려)')
      }
    })
  }

  return { canUse, warnings }
}