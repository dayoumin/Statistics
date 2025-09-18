/**
 * Pyodide 관련 타입 정의
 */

export interface PyodideInterface {
  loadPackage: (packages: string | string[]) => Promise<void>
  runPython: (code: string) => any
  runPythonAsync: (code: string) => Promise<any>
  globals: any
  FS: any
  loadedPackages: Record<string, string>
  isPyProxy: (obj: any) => boolean
  version: string
}

export interface StatisticalTestResult {
  statistic: number
  pvalue: number
  df?: number
  interpretation?: string
  effectSize?: number
  confidenceInterval?: [number, number]
}

export interface DescriptiveStatsResult {
  mean: number
  median: number
  std: number
  variance: number
  min: number
  max: number
  q1: number
  q3: number
  iqr: number
  skew: number
  kurtosis: number
  cv: number
  count: number
}

export interface NormalityTestResult {
  statistic: number
  pValue: number
  isNormal: boolean
  interpretation: string
}

export interface OutlierResult {
  outliers: number[]
  outlierIndices: number[]
  lowerBound: number
  upperBound: number
}

export interface CorrelationResult {
  correlation: number
  pValue: number
  interpretation: string
  strength: string
}

export interface HomogeneityTestResult {
  statistic: number
  pValue: number
  isHomogeneous: boolean
  method: string
}

export interface ANOVAResult {
  fStatistic: number
  pValue: number
  dfBetween: number
  dfWithin: number
  interpretation: string
}

export interface TukeyHSDResult {
  comparison: string
  meanDiff: number
  pAdj: number
  lower: number
  upper: number
  significant: boolean
}

export interface RegressionResult {
  slope: number
  intercept: number
  rValue: number
  rSquared: number
  pValue: number
  stdErr: number
  equation: string
}