/**
 * Pyodide 통계 서비스 타입 정의
 */

export interface PyodideInterface {
  loadPackage: (packages: string | string[]) => Promise<void>
  runPython: (code: string) => any
  globals: {
    get: (name: string) => any
    set: (name: string, value: any) => void
  }
  toPy: (obj: any) => any
  FS: {
    writeFile: (filename: string, data: string | Uint8Array) => void
    readFile: (filename: string, options?: { encoding?: string }) => string | Uint8Array
  }
}

export interface StatisticalTestResult {
  statistic: number
  pValue: number
  alternative?: string
  method?: string
  [key: string]: any
}

export interface DescriptiveStatsResult {
  count: number
  mean: number
  std: number
  min: number
  max: number
  q25: number
  median: number
  q75: number
  skewness: number
  kurtosis: number
  variance: number
  sem: number
  cv: number
  range: number
  iqr: number
  [key: string]: any
}

export interface NormalityTestResult {
  shapiroWilk: {
    statistic: number
    pValue: number
    isNormal: boolean
  }
  andersonDarling: {
    statistic: number
    criticalValues: number[]
    significanceLevels: number[]
    isNormal: boolean
  }
  jarqueBera: {
    statistic: number
    pValue: number
    isNormal: boolean
  }
  [key: string]: any
}

export interface OutlierResult {
  outlierIndices: number[]
  outlierValues: number[]
  method: string
  threshold?: number
  bounds?: {
    lower: number
    upper: number
  }
  [key: string]: any
}

export interface CorrelationResult {
  coefficient: number
  pValue: number
  method: string
  confidenceInterval?: [number, number]
  [key: string]: any
}

export interface HomogeneityTestResult {
  statistic: number
  pValue: number
  method: string
  isHomogeneous: boolean
  [key: string]: any
}

export interface ANOVAResult {
  fStatistic: number
  pValue: number
  dfBetween: number
  dfWithin: number
  dfTotal: number
  msBetween: number
  msWithin: number
  ssBetween: number
  ssWithin: number
  ssTotal: number
  etaSquared: number
  omegaSquared: number
  partialEtaSquared: number
  [key: string]: any
}

export interface TukeyHSDResult {
  comparisons: Array<{
    group1: string
    group2: string
    meanDiff: number
    pValue: number
    reject: boolean
    lowerCI: number
    upperCI: number
  }>
  criticalValue: number
  alpha: number
  [key: string]: any
}

export interface RegressionResult {
  coefficients: number[]
  intercept: number
  rSquared: number
  adjustedRSquared: number
  fStatistic: number
  fPValue: number
  residuals: number[]
  fitted: number[]
  standardErrors: number[]
  tStatistics: number[]
  pValues: number[]
  confidenceIntervals: Array<[number, number]>
  [key: string]: any
}

export interface PCAResult {
  components: number[][]
  explainedVariance: number[]
  explainedVarianceRatio: number[]
  cumulativeVarianceRatio: number[]
  loadings: number[][]
  scores: number[][]
  eigenvalues: number[]
  [key: string]: any
}

export interface ClusteringResult {
  labels: number[]
  centers: number[][]
  inertia: number
  silhouetteScore: number
  [key: string]: any
}

export interface TimeSeriesResult {
  trend: number[]
  seasonal: number[]
  residual: number[]
  period: number
  [key: string]: any
}

// 각 모듈별 서비스 인터페이스
export interface IDescriptiveService {
  calculateDescriptiveStats(data: number[]): Promise<DescriptiveStatsResult>
  normalityTest(data: number[], alpha?: number): Promise<NormalityTestResult>
  homogeneityTest(groups: number[][], method?: string): Promise<HomogeneityTestResult>
  outlierDetection(data: number[]): Promise<OutlierResult>
}

export interface IHypothesisService {
  oneSampleTTest(data: number[], popmean: number, alternative?: string): Promise<StatisticalTestResult>
  twoSampleTTest(group1: number[], group2: number[], equalVar?: boolean): Promise<StatisticalTestResult>
  pairedTTest(values1: number[], values2: number[], alternative?: string): Promise<StatisticalTestResult>
  correlation(x: number[], y: number[], method?: string): Promise<CorrelationResult>
  partialCorrelation(data: number[][], xCol: number, yCol: number, controlCols: number[]): Promise<CorrelationResult>
}

export interface IANOVAService {
  oneWayANOVA(groups: number[][]): Promise<ANOVAResult>
  twoWayANOVA(data: number[][], factor1: string[], factor2: string[]): Promise<ANOVAResult>
  repeatedMeasuresANOVA(data: number[][]): Promise<ANOVAResult>
  tukeyHSD(groups: number[][], groupNames?: string[], alpha?: number): Promise<TukeyHSDResult>
  gamesHowell(groups: number[][], groupNames?: string[], alpha?: number): Promise<TukeyHSDResult>
  bonferroni(groups: number[][], groupNames?: string[], alpha?: number): Promise<TukeyHSDResult>
}

export interface IRegressionService {
  simpleRegression(xValues: number[], yValues: number[]): Promise<RegressionResult>
  multipleRegression(xMatrix: number[][], yValues: number[], variableNames?: string[]): Promise<RegressionResult>
  logisticRegression(xMatrix: number[][], yValues: number[], variableNames?: string[]): Promise<RegressionResult>
}

export interface INonparametricService {
  mannWhitneyU(group1: number[], group2: number[], alternative?: string): Promise<StatisticalTestResult>
  wilcoxonSignedRank(values1: number[], values2: number[], alternative?: string): Promise<StatisticalTestResult>
  kruskalWallis(groups: number[][]): Promise<StatisticalTestResult>
  friedman(data: number[][]): Promise<StatisticalTestResult>
  chiSquareTest(observedMatrix: number[][], correction?: boolean): Promise<StatisticalTestResult>
}

export interface IAdvancedService {
  pca(dataMatrix: number[][], columns?: string[], nComponents?: number, standardize?: boolean): Promise<PCAResult>
  clustering(data: number[][], nClusters: number, method?: string): Promise<ClusteringResult>
  timeSeriesDecomposition(data: number[], period?: number): Promise<TimeSeriesResult>
}

declare global {
  interface Window {
    pyodide?: PyodideInterface
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>
  }
}