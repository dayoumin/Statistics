/**
 * 통계 실행자 모듈 통합 export
 */

export { BaseExecutor } from './base-executor'
export { DescriptiveExecutor } from './descriptive-executor'
export { TTestExecutor } from './t-test-executor'
export { AnovaExecutor } from './anova-executor'
export { RegressionExecutor } from './regression-executor'
export { NonparametricExecutor } from './nonparametric-executor'
export { AdvancedExecutor } from './advanced-executor'
export type { AnalysisResult } from './types'

// 메인 통계 실행자
export { StatisticalExecutor } from './statistical-executor'