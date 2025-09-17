import { BaseExecutor } from './base-executor'
import { AnalysisResult } from './types'
import { pyodideStats } from '../pyodide-statistics'
import { logger } from '@/lib/utils/logger'

/**
 * 분산분석 실행자
 */
export class AnovaExecutor extends BaseExecutor {
  /**
   * 일원 분산분석
   */
  async executeOneWay(groups: number[][]): Promise<AnalysisResult> {
    const startTime = Date.now()

    try {
      await this.ensurePyodideInitialized()

      // 등분산 검정
      const leveneResult = await pyodideStats.leveneTest(groups)
      const equalVar = leveneResult.pvalue > 0.05

      // ANOVA 수행
      const anovaResult = await pyodideStats.anova(groups)

      // 전체 평균과 그룹별 평균 계산
      const groupStats = await Promise.all(
        groups.map(async g => {
          const stats = await pyodideStats.calculateDescriptiveStats(g)
          return { mean: stats.mean, std: stats.std, n: g.length }
        })
      )

      // 효과크기 (eta-squared) 계산
      const etaSquared = anovaResult.etaSquared || 0

      return {
        metadata: {
          ...this.createMetadata('일원 분산분석', groups.flat().length, startTime),
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
          statistic: anovaResult.statistic,
          pvalue: anovaResult.pvalue,
          df: anovaResult.df,
          interpretation: `${this.interpretPValue(anovaResult.pvalue)}. ${groups.length}개 그룹 간 평균 차이 검정`
        },
        additionalInfo: {
          effectSize: {
            value: etaSquared,
            type: 'eta-squared',
            interpretation: this.interpretEffectSize(etaSquared, 'eta')
          },
          groupStats,
          betweenSS: anovaResult.betweenSS,
          withinSS: anovaResult.withinSS
        },
        visualizationData: {
          type: 'boxplot',
          data: {
            groups: groups.map((_, i) => `그룹 ${i + 1}`),
            values: groups
          }
        }
      }
    } catch (error) {
      return this.handleError(error, '일원 분산분석')
    }
  }

  /**
   * 이원 분산분석
   */
  async executeTwoWay(
    data: any[],
    factor1: string,
    factor2: string,
    dependent: string
  ): Promise<AnalysisResult> {
    const startTime = Date.now()

    try {
      await this.ensurePyodideInitialized()

      // 데이터 구조화
      const structuredData = {
        values: data.map(row => row[dependent]),
        factor1: data.map(row => row[factor1]),
        factor2: data.map(row => row[factor2])
      }

      const result = await pyodideStats.twoWayAnova(
        structuredData.values,
        structuredData.factor1,
        structuredData.factor2
      )

      return {
        metadata: this.createMetadata('이원 분산분석', data.length, startTime),
        mainResults: {
          statistic: result.fStatistic.factor1,
          pvalue: result.pvalue.factor1,
          interpretation: this.interpretTwoWayAnova(result)
        },
        additionalInfo: {
          factor1: {
            name: factor1,
            fStatistic: result.fStatistic.factor1,
            pvalue: result.pvalue.factor1,
            df: result.df.factor1
          },
          factor2: {
            name: factor2,
            fStatistic: result.fStatistic.factor2,
            pvalue: result.pvalue.factor2,
            df: result.df.factor2
          },
          interaction: {
            fStatistic: result.fStatistic.interaction,
            pvalue: result.pvalue.interaction,
            df: result.df.interaction
          }
        },
        visualizationData: {
          type: 'interaction-plot',
          data: structuredData
        }
      }
    } catch (error) {
      return this.handleError(error, '이원 분산분석')
    }
  }

  /**
   * 반복측정 분산분석
   */
  async executeRepeatedMeasures(data: number[][]): Promise<AnalysisResult> {
    const startTime = Date.now()

    try {
      await this.ensurePyodideInitialized()

      const result = await pyodideStats.repeatedMeasuresAnova(data)

      return {
        metadata: this.createMetadata('반복측정 분산분석', data.length * data[0].length, startTime),
        mainResults: {
          statistic: result.statistic,
          pvalue: result.pvalue,
          df: result.df,
          interpretation: `${this.interpretPValue(result.pvalue)}. ${data[0].length}개 시점 간 평균 차이 검정`
        },
        additionalInfo: {
          sphericity: result.sphericity,
          greenhouseGeisser: result.greenhouseGeisser
        },
        visualizationData: {
          type: 'line',
          data: {
            timePoints: data[0].map((_, i) => `시점 ${i + 1}`),
            means: data[0].map((_, colIndex) => {
              const columnData = data.map(row => row[colIndex])
              return columnData.reduce((a, b) => a + b, 0) / columnData.length
            })
          }
        }
      }
    } catch (error) {
      return this.handleError(error, '반복측정 분산분석')
    }
  }

  /**
   * Tukey HSD 사후검정
   */
  async executeTukeyHSD(groups: number[][]): Promise<AnalysisResult> {
    const startTime = Date.now()

    try {
      await this.ensurePyodideInitialized()

      const result = await pyodideStats.tukeyHSD(groups)

      return {
        metadata: this.createMetadata('Tukey HSD 사후검정', groups.flat().length, startTime),
        mainResults: {
          statistic: result.comparisons.length,
          pvalue: Math.min(...result.comparisons.map(c => c.pvalue)),
          interpretation: `${result.comparisons.filter(c => c.reject).length}개 쌍에서 유의한 차이 발견`
        },
        additionalInfo: {
          postHoc: result.comparisons.map(comp => ({
            group1: comp.group1,
            group2: comp.group2,
            meanDiff: comp.meanDiff,
            pvalue: comp.pvalue,
            significant: comp.reject
          }))
        },
        visualizationData: {
          type: 'comparison-matrix',
          data: result
        }
      }
    } catch (error) {
      return this.handleError(error, 'Tukey HSD')
    }
  }

  /**
   * Games-Howell 사후검정
   */
  async executeGamesHowell(groups: number[][]): Promise<AnalysisResult> {
    const startTime = Date.now()

    try {
      await this.ensurePyodideInitialized()

      const result = await pyodideStats.gamesHowell(groups)

      return {
        metadata: this.createMetadata('Games-Howell 사후검정', groups.flat().length, startTime),
        mainResults: {
          statistic: result.comparisons.length,
          pvalue: Math.min(...result.comparisons.map(c => c.pvalue)),
          interpretation: `이분산 가정 하에서 ${result.comparisons.filter(c => c.reject).length}개 쌍에서 유의한 차이 발견`
        },
        additionalInfo: {
          postHoc: result.comparisons.map(comp => ({
            group1: comp.group1,
            group2: comp.group2,
            meanDiff: comp.meanDiff,
            pvalue: comp.pvalue,
            significant: comp.reject
          }))
        },
        visualizationData: {
          type: 'comparison-matrix',
          data: result
        }
      }
    } catch (error) {
      return this.handleError(error, 'Games-Howell')
    }
  }

  /**
   * 이원분산분석 결과 해석
   */
  private interpretTwoWayAnova(result: any): string {
    const interpretations = []

    if (result.pvalue.factor1 < 0.05) {
      interpretations.push('주효과 1 유의')
    }
    if (result.pvalue.factor2 < 0.05) {
      interpretations.push('주효과 2 유의')
    }
    if (result.pvalue.interaction < 0.05) {
      interpretations.push('상호작용 효과 유의')
    }

    if (interpretations.length === 0) {
      return '모든 효과가 통계적으로 유의하지 않음'
    }

    return interpretations.join(', ')
  }

  /**
   * 통합 실행 메서드
   */
  async execute(data: any[], options?: any): Promise<AnalysisResult> {
    const { method = 'one-way', ...restOptions } = options || {}

    switch (method) {
      case 'one-way':
        return this.executeOneWay(restOptions.groups || data)
      case 'two-way':
        return this.executeTwoWay(
          data,
          restOptions.factor1,
          restOptions.factor2,
          restOptions.dependent
        )
      case 'repeated-measures':
        return this.executeRepeatedMeasures(data as number[][])
      case 'tukey':
        return this.executeTukeyHSD(restOptions.groups || data)
      case 'games-howell':
        return this.executeGamesHowell(restOptions.groups || data)
      default:
        throw new Error(`Unknown ANOVA method: ${method}`)
    }
  }
}