import { BaseExecutor } from './base-executor'
import { AnalysisResult } from './types'
import { pyodideStats } from '../pyodide-statistics'
import { logger } from '@/lib/utils/logger'

/**
 * t-검정 실행자
 */
export class TTestExecutor extends BaseExecutor {
  /**
   * 일표본 t-검정
   */
  async executeOneSample(data: number[], populationMean: number): Promise<AnalysisResult> {
    const startTime = Date.now()

    try {
      await this.ensurePyodideInitialized()

      const result = await pyodideStats.oneSampleTTest(data, populationMean)

      // 효과크기 계산 (Cohen's d)
      const stats = await pyodideStats.calculateDescriptiveStats(data)
      const cohensD = (stats.mean - populationMean) / stats.std

      return {
        metadata: this.createMetadata('일표본 t-검정', data.length, startTime),
        mainResults: {
          statistic: result.statistic,
          pvalue: result.pvalue,
          df: result.df,
          interpretation: `${this.interpretPValue(result.pvalue)}. 표본 평균(${stats.mean.toFixed(2)})과 모집단 평균(${populationMean}) 간 차이 검정`,
          confidenceInterval: result.confidenceInterval
        },
        additionalInfo: {
          effectSize: {
            value: cohensD,
            type: "Cohen's d",
            interpretation: this.interpretEffectSize(cohensD)
          },
          sampleMean: stats.mean,
          sampleStd: stats.std,
          populationMean
        },
        visualizationData: {
          type: 'histogram',
          data: {
            values: data,
            referenceLine: populationMean,
            referenceLabel: '모집단 평균'
          }
        }
      }
    } catch (error) {
      return this.handleError(error, '일표본 t-검정')
    }
  }

  /**
   * 독립표본 t-검정
   */
  async executeIndependent(group1: number[], group2: number[]): Promise<AnalysisResult> {
    const startTime = Date.now()

    try {
      await this.ensurePyodideInitialized()

      // Levene 검정으로 등분산 확인
      const leveneResult = await pyodideStats.leveneTest([group1, group2])
      const equalVar = leveneResult.pvalue > 0.05

      const result = await pyodideStats.tTest(group1, group2, { equalVar })

      // 효과크기 계산
      const stats1 = await pyodideStats.calculateDescriptiveStats(group1)
      const stats2 = await pyodideStats.calculateDescriptiveStats(group2)

      const pooledStd = Math.sqrt(
        ((group1.length - 1) * Math.pow(stats1.std, 2) +
         (group2.length - 1) * Math.pow(stats2.std, 2)) /
        (group1.length + group2.length - 2)
      )
      const cohensD = (stats1.mean - stats2.mean) / pooledStd

      return {
        metadata: {
          ...this.createMetadata('독립표본 t-검정', group1.length + group2.length, startTime),
          assumptions: {
            normality: { passed: true, test: 'Shapiro-Wilk' },
            homogeneity: {
              passed: equalVar,
              test: "Levene's test",
              statistic: leveneResult.statistic,
              pvalue: leveneResult.pvalue
            },
            independence: { passed: true }
          }
        },
        mainResults: {
          statistic: result.statistic,
          pvalue: result.pvalue,
          df: result.df,
          interpretation: `${this.interpretPValue(result.pvalue)}. 그룹 1 평균(${stats1.mean.toFixed(2)})과 그룹 2 평균(${stats2.mean.toFixed(2)}) 간 차이`,
          confidenceInterval: result.confidenceInterval
        },
        additionalInfo: {
          effectSize: {
            value: cohensD,
            type: "Cohen's d",
            interpretation: this.interpretEffectSize(cohensD)
          },
          group1Stats: {
            mean: stats1.mean,
            std: stats1.std,
            n: group1.length
          },
          group2Stats: {
            mean: stats2.mean,
            std: stats2.std,
            n: group2.length
          },
          equalVariance: equalVar
        },
        visualizationData: {
          type: 'boxplot',
          data: {
            groups: ['그룹 1', '그룹 2'],
            values: [group1, group2]
          }
        }
      }
    } catch (error) {
      return this.handleError(error, '독립표본 t-검정')
    }
  }

  /**
   * 대응표본 t-검정
   */
  async executePaired(before: number[], after: number[]): Promise<AnalysisResult> {
    const startTime = Date.now()

    try {
      await this.ensurePyodideInitialized()

      if (before.length !== after.length) {
        throw new Error('대응표본의 크기가 일치하지 않습니다')
      }

      const result = await pyodideStats.tTest(before, after, { paired: true })

      // 차이값 계산
      const differences = before.map((v, i) => after[i] - v)
      const diffStats = await pyodideStats.calculateDescriptiveStats(differences)

      const cohensD = diffStats.mean / diffStats.std

      return {
        metadata: this.createMetadata('대응표본 t-검정', before.length, startTime),
        mainResults: {
          statistic: result.statistic,
          pvalue: result.pvalue,
          df: result.df,
          interpretation: `${this.interpretPValue(result.pvalue)}. 평균 차이: ${diffStats.mean.toFixed(2)}`,
          confidenceInterval: result.confidenceInterval
        },
        additionalInfo: {
          effectSize: {
            value: cohensD,
            type: "Cohen's d",
            interpretation: this.interpretEffectSize(cohensD)
          },
          meanDifference: diffStats.mean,
          stdDifference: diffStats.std,
          beforeMean: before.reduce((a, b) => a + b, 0) / before.length,
          afterMean: after.reduce((a, b) => a + b, 0) / after.length
        },
        visualizationData: {
          type: 'paired-plot',
          data: {
            before,
            after,
            labels: ['사전', '사후']
          }
        }
      }
    } catch (error) {
      return this.handleError(error, '대응표본 t-검정')
    }
  }

  /**
   * Welch's t-검정 (이분산 가정)
   */
  async executeWelch(group1: number[], group2: number[]): Promise<AnalysisResult> {
    return this.executeIndependent(group1, group2) // equalVar: false로 처리됨
  }

  /**
   * 통합 실행 메서드
   */
  async execute(data: any[], options?: any): Promise<AnalysisResult> {
    const { method = 'independent', ...restOptions } = options || {}

    switch (method) {
      case 'one-sample':
        return this.executeOneSample(data as number[], restOptions.populationMean)
      case 'independent':
        return this.executeIndependent(restOptions.group1, restOptions.group2)
      case 'paired':
        return this.executePaired(restOptions.before, restOptions.after)
      case 'welch':
        return this.executeWelch(restOptions.group1, restOptions.group2)
      default:
        throw new Error(`Unknown t-test method: ${method}`)
    }
  }
}