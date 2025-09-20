/**
 * Pyodide 통계 서비스 메인 통합 클래스
 *
 * 모든 통계 계산은 Python의 SciPy/NumPy를 통해 수행되어야 합니다.
 * JavaScript 통계 라이브러리는 신뢰성이 검증되지 않았으므로 사용하지 않습니다.
 */

import { DescriptiveService } from './descriptive'
import { HypothesisService } from './hypothesis'
import { ANOVAService } from './anova'
import { RegressionService } from './regression'
import { NonparametricService } from './nonparametric'
import { AdvancedService } from './advanced'

import type {
  DescriptiveStatsResult,
  NormalityTestResult,
  HomogeneityTestResult,
  OutlierResult,
  StatisticalTestResult,
  CorrelationResult,
  ANOVAResult,
  TukeyHSDResult,
  RegressionResult,
  PCAResult,
  ClusteringResult,
  TimeSeriesResult
} from './types'

export class PyodideStatisticsService {
  private static instance: PyodideStatisticsService | null = null

  // 각 서비스 모듈의 인스턴스
  private descriptiveService: DescriptiveService
  private hypothesisService: HypothesisService
  private anovaService: ANOVAService
  private regressionService: RegressionService
  private nonparametricService: NonparametricService
  private advancedService: AdvancedService

  private constructor() {
    this.descriptiveService = DescriptiveService.getInstance()
    this.hypothesisService = HypothesisService.getInstance()
    this.anovaService = ANOVAService.getInstance()
    this.regressionService = RegressionService.getInstance()
    this.nonparametricService = NonparametricService.getInstance()
    this.advancedService = AdvancedService.getInstance()
  }

  static getInstance(): PyodideStatisticsService {
    if (!PyodideStatisticsService.instance) {
      PyodideStatisticsService.instance = new PyodideStatisticsService()
    }
    return PyodideStatisticsService.instance
  }

  /**
   * Pyodide 초기화
   */
  async initialize(): Promise<void> {
    // 모든 서비스는 같은 Pyodide 인스턴스를 공유하므로 하나만 초기화하면 됨
    await this.descriptiveService.initialize()
  }

  // =================
  // 기술통계 메서드들
  // =================

  async calculateDescriptiveStats(data: number[]): Promise<DescriptiveStatsResult> {
    return this.descriptiveService.calculateDescriptiveStats(data)
  }

  async calculateDescriptiveStatistics(data: number[]): Promise<DescriptiveStatsResult> {
    return this.descriptiveService.calculateDescriptiveStats(data)
  }

  async descriptiveStats(data: number[]): Promise<DescriptiveStatsResult> {
    return this.descriptiveService.calculateDescriptiveStats(data)
  }

  async normalityTest(data: number[], alpha?: number): Promise<NormalityTestResult> {
    return this.descriptiveService.normalityTest(data, alpha)
  }

  async testNormality(data: number[], alpha?: number): Promise<NormalityTestResult> {
    return this.descriptiveService.normalityTest(data, alpha)
  }

  async homogeneityTest(groups: number[][], method?: string): Promise<HomogeneityTestResult> {
    return this.descriptiveService.homogeneityTest(groups, method)
  }

  async testHomogeneity(groups: number[][], method?: string): Promise<HomogeneityTestResult> {
    return this.descriptiveService.homogeneityTest(groups, method)
  }

  async outlierDetection(data: number[]): Promise<OutlierResult> {
    return this.descriptiveService.outlierDetection(data)
  }

  // 기존 API 호환성 메서드들
  async shapiroWilkTest(data: number[]): Promise<{ statistic: number; pValue: number; isNormal: boolean }> {
    return this.descriptiveService.shapiroWilkTest(data)
  }

  async detectOutliersIQR(data: number[]): Promise<{ q1: number; q3: number; iqr: number; lowerBound: number; upperBound: number; mildOutliers: number[]; extremeOutliers: number[] }> {
    return this.descriptiveService.detectOutliersIQR(data)
  }

  async leveneTest(groups: number[][]): Promise<{ statistic: number; pValue: number; isHomogeneous: boolean }> {
    return this.descriptiveService.leveneTest(groups)
  }

  async bartlettTest(groups: number[][]): Promise<{ statistic: number; pValue: number; isHomogeneous: boolean }> {
    return this.descriptiveService.bartlettTest(groups)
  }

  async kolmogorovSmirnovTest(data: number[]): Promise<{ statistic: number; pValue: number; isNormal: boolean }> {
    return this.descriptiveService.kolmogorovSmirnovTest(data)
  }

  // =================
  // 가설검정 메서드들
  // =================

  async oneSampleTTest(data: number[], popmean: number, alternative?: string): Promise<StatisticalTestResult> {
    return this.hypothesisService.oneSampleTTest(data, popmean, alternative)
  }

  async twoSampleTTest(group1: number[], group2: number[], equalVar?: boolean): Promise<StatisticalTestResult> {
    return this.hypothesisService.twoSampleTTest(group1, group2, equalVar)
  }

  async pairedTTest(values1: number[], values2: number[], alternative?: string): Promise<StatisticalTestResult> {
    return this.hypothesisService.pairedTTest(values1, values2, alternative)
  }

  async correlation(x: number[], y: number[], method?: string): Promise<CorrelationResult> {
    return this.hypothesisService.correlation(x, y, method)
  }

  async partialCorrelation(data: number[][], xCol: number, yCol: number, controlCols: number[]): Promise<CorrelationResult> {
    return this.hypothesisService.partialCorrelation(data, xCol, yCol, controlCols)
  }

  async calculateCorrelation(columnsData: Record<string, number[]>, method?: string): Promise<any> {
    return this.hypothesisService.calculateCorrelation(columnsData, method)
  }

  // =================
  // ANOVA 및 사후검정
  // =================

  async oneWayANOVA(groups: number[][]): Promise<ANOVAResult> {
    return this.anovaService.oneWayANOVA(groups)
  }

  async twoWayANOVA(data: number[][], factor1: string[], factor2: string[]): Promise<ANOVAResult> {
    return this.anovaService.twoWayANOVA(data, factor1, factor2)
  }

  async repeatedMeasuresANOVA(data: number[][]): Promise<ANOVAResult> {
    return this.anovaService.repeatedMeasuresANOVA(data)
  }

  async tukeyHSD(groups: number[][], groupNames?: string[], alpha?: number): Promise<TukeyHSDResult> {
    return this.anovaService.tukeyHSD(groups, groupNames, alpha)
  }

  async gamesHowell(groups: number[][], groupNames?: string[], alpha?: number): Promise<TukeyHSDResult> {
    return this.anovaService.gamesHowell(groups, groupNames, alpha)
  }

  async bonferroni(groups: number[][], groupNames?: string[], alpha?: number): Promise<TukeyHSDResult> {
    return this.anovaService.bonferroni(groups, groupNames, alpha)
  }

  async performBonferroni(groups: number[][], groupNames: string[], alpha?: number): Promise<TukeyHSDResult> {
    return this.anovaService.bonferroni(groups, groupNames, alpha)
  }

  async gamesHowellTest(groups: number[][], groupNames?: string[], alpha?: number): Promise<TukeyHSDResult> {
    return this.anovaService.gamesHowell(groups, groupNames, alpha)
  }

  // =================
  // 회귀분석 메서드들
  // =================

  async simpleRegression(xValues: number[], yValues: number[]): Promise<RegressionResult> {
    return this.regressionService.simpleRegression(xValues, yValues)
  }

  async simpleLinearRegression(xValues: number[], yValues: number[]): Promise<RegressionResult> {
    return this.regressionService.simpleRegression(xValues, yValues)
  }

  async multipleRegression(xMatrix: number[][], yValues: number[], variableNames?: string[]): Promise<RegressionResult> {
    return this.regressionService.multipleRegression(xMatrix, yValues, variableNames)
  }

  async logisticRegression(xMatrix: number[][], yValues: number[], variableNames?: string[]): Promise<RegressionResult> {
    return this.regressionService.logisticRegression(xMatrix, yValues, variableNames)
  }

  // =================
  // 비모수 검정 메서드들
  // =================

  async mannWhitneyU(group1: number[], group2: number[], alternative?: string): Promise<StatisticalTestResult> {
    return this.nonparametricService.mannWhitneyU(group1, group2, alternative)
  }

  async wilcoxonSignedRank(values1: number[], values2: number[], alternative?: string): Promise<StatisticalTestResult> {
    return this.nonparametricService.wilcoxonSignedRank(values1, values2, alternative)
  }

  async kruskalWallis(groups: number[][]): Promise<StatisticalTestResult> {
    return this.nonparametricService.kruskalWallis(groups)
  }

  async friedman(data: number[][]): Promise<StatisticalTestResult> {
    return this.nonparametricService.friedman(data)
  }

  async chiSquareTest(observedMatrix: number[][], correction?: boolean): Promise<StatisticalTestResult> {
    return this.nonparametricService.chiSquareTest(observedMatrix, correction)
  }

  async dunnTest(groups: number[][], groupNames?: string[], alpha?: number): Promise<any> {
    return this.nonparametricService.dunnTest(groups, groupNames, alpha)
  }

  // 기존 API 호환성 메서드들
  async wilcoxon(group1: number[], group2: number[]): Promise<{ statistic: number; pvalue: number }> {
    const result = await this.nonparametricService.wilcoxonSignedRank(group1, group2)
    return { statistic: result.statistic, pvalue: result.pValue }
  }

  async chiSquare(contingencyTable: number[][]): Promise<{ statistic: number; pvalue: number; df: number }> {
    const result = await this.nonparametricService.chiSquareTest(contingencyTable)
    return { statistic: result.statistic, pvalue: result.pValue, df: result.df || 0 }
  }

  // =================
  // 고급 분석 메서드들
  // =================

  async pca(dataMatrix: number[][], columns?: string[], nComponents?: number, standardize?: boolean): Promise<PCAResult> {
    return this.advancedService.pca(dataMatrix, columns, nComponents, standardize)
  }

  async performPCA(dataMatrix: number[][], columns: string[], nComponents?: number, standardize?: boolean): Promise<PCAResult> {
    return this.advancedService.pca(dataMatrix, columns, nComponents, standardize)
  }

  async clustering(data: number[][], nClusters: number, method?: string): Promise<ClusteringResult> {
    return this.advancedService.clustering(data, nClusters, method)
  }

  async timeSeriesDecomposition(data: number[], period?: number): Promise<TimeSeriesResult> {
    return this.advancedService.timeSeriesDecomposition(data, period)
  }

  async cronbachAlpha(items: number[][]): Promise<{ alpha: number; itemTotalCorrelations: number[]; alphaIfDeleted: number[]; nItems: number; nObservations: number }> {
    return this.advancedService.cronbachAlpha(items)
  }

  // =================
  // 기존 내부 메서드들 (호환성)
  // =================

  async tTest(group1: number[], group2: number[], options: any = {}): Promise<any> {
    if (options.type === 'one-sample') {
      return this.oneSampleTTest(group1, options.mu || 0, options.alternative)
    } else if (options.paired || options.type === 'paired') {
      return this.pairedTTest(group1, group2, options.alternative)
    } else {
      return this.twoSampleTTest(group1, group2, options.equal_var !== false)
    }
  }

  async anova(groups: number[][], options: any = {}): Promise<any> {
    return this.oneWayANOVA(groups)
  }

  async regression(x: number[], y: number[], options: any = {}): Promise<any> {
    const result = await this.simpleRegression(x, y)
    return {
      slope: result.slope,
      intercept: result.intercept,
      rSquared: result.rSquared,
      pvalue: result.pValues?.[1] || 0,
      fStatistic: result.fStatistic,
      tStatistic: result.tStatistics?.[1] || 0,
      predictions: result.fitted,
      df: result.degreesOfFreedom
    }
  }

  // =================
  // 상태 관리 메서드들
  // =================

  isInitialized(): boolean {
    return this.descriptiveService.isInitialized()
  }

  dispose(): void {
    this.descriptiveService.dispose()
    this.hypothesisService.dispose()
    this.anovaService.dispose()
    this.regressionService.dispose()
    this.nonparametricService.dispose()
    this.advancedService.dispose()
  }
}

// 기본 export
export default PyodideStatisticsService

// 타입들도 re-export
export type {
  DescriptiveStatsResult,
  NormalityTestResult,
  HomogeneityTestResult,
  OutlierResult,
  StatisticalTestResult,
  CorrelationResult,
  ANOVAResult,
  TukeyHSDResult,
  RegressionResult,
  PCAResult,
  ClusteringResult,
  TimeSeriesResult
}

// 개별 서비스들도 export (필요한 경우)
export {
  DescriptiveService,
  HypothesisService,
  ANOVAService,
  RegressionService,
  NonparametricService,
  AdvancedService
}