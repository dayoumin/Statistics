/**
 * Pyodide 통계 서비스 - Export Wrapper
 *
 * 기존 코드 호환성을 위한 래퍼 파일입니다.
 * 실제 구현은 ./pyodide/ 디렉토리의 모듈화된 파일들에 있습니다.
 *
 * 모든 통계 계산은 Python의 SciPy/NumPy를 통해 수행되어야 합니다.
 * JavaScript 통계 라이브러리는 신뢰성이 검증되지 않았으므로 사용하지 않습니다.
 */

// 새로운 모듈화된 구현을 import
import { PyodideStatisticsService as ModularPyodideStatisticsService } from './pyodide'

// 기존 import 경로 호환성을 위해 re-export
export { PyodideStatisticsService } from './pyodide'
export default ModularPyodideStatisticsService

// 기존 코드와의 호환성을 위한 인스턴스 export
export const pyodideStats = ModularPyodideStatisticsService.getInstance()

// 타입들도 re-export
export type {
  PyodideInterface,
  StatisticalTestResult,
  DescriptiveStatsResult,
  NormalityTestResult,
  OutlierResult,
  CorrelationResult,
  HomogeneityTestResult,
  ANOVAResult,
  TukeyHSDResult,
  RegressionResult,
  PCAResult,
  ClusteringResult,
  TimeSeriesResult
} from './pyodide/types'

// 개별 서비스들도 re-export (필요한 경우)
export {
  DescriptiveService,
  HypothesisService,
  ANOVAService,
  RegressionService,
  NonparametricService,
  AdvancedService
} from './pyodide'

/**
 * 마이그레이션 노트:
 *
 * 이 파일은 기존 코드와의 호환성을 위한 wrapper입니다.
 * 새로운 코드에서는 다음과 같이 import하는 것을 권장합니다:
 *
 * ```typescript
 * import { PyodideStatisticsService } from '@/lib/services/pyodide'
 * // 또는 개별 서비스
 * import { DescriptiveService, HypothesisService } from '@/lib/services/pyodide'
 * ```
 *
 * 기존 코드는 변경 없이 계속 작동합니다:
 *
 * ```typescript
 * import { PyodideStatisticsService } from '@/lib/services/pyodide-statistics'
 * ```
 *
 * 주요 개선사항:
 * 1. 모듈화: 9개 파일로 분리하여 유지보수성 향상
 * 2. 타입 안전성: 완전한 TypeScript 타입 지원
 * 3. 성능: 필요한 모듈만 로드 가능
 * 4. 확장성: 새로운 통계 기능 추가 용이
 * 5. 테스트: 개별 모듈 단위 테스트 가능
 */