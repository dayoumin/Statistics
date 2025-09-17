/**
 * 통계 분석 결과 표준 인터페이스
 */
export interface AnalysisResult {
  metadata: {
    method: string
    timestamp: string
    duration: number
    dataSize: number
    assumptions?: {
      normality?: {
        passed: boolean
        test?: string
        statistic?: number
        pvalue?: number
      }
      homogeneity?: {
        passed: boolean
        test?: string
        statistic?: number
        pvalue?: number
      }
      independence?: {
        passed: boolean
        test?: string
      }
    }
  }

  mainResults: {
    statistic: number
    pvalue: number
    interpretation: string
    df?: number
    confidenceInterval?: {
      lower: number
      upper: number
      level: number
    }
  }

  additionalInfo: {
    effectSize?: {
      value: number
      type: string
      interpretation: string
    }
    postHoc?: Array<{
      group1: string
      group2: string
      meanDiff: number
      pvalue: number
      significant: boolean
    }>
    residuals?: number[]
    coefficients?: Array<{
      name: string
      value: number
      stdError: number
      tValue: number
      pvalue: number
    }>
    [key: string]: any
  }

  visualizationData?: {
    type: string
    data: any
    options?: any
  }
}