# 📝 통계 플랫폼 테스트 코드 작성 가이드 (AI 인계용)

## 🎯 프로젝트 개요
- **프로젝트**: Next.js 기반 통계 분석 플랫폼
- **통계 엔진**: Pyodide (Python WebAssembly) + SciPy/NumPy
- **위치**: `D:\Projects\Statics\statistical-platform`

## 📁 주요 파일 구조
```
statistical-platform/
├── lib/services/
│   └── pyodide-statistics.ts    # 통계 서비스 (1200줄, 테스트 대상)
├── __tests__/
│   └── statistics/
│       └── statistical-validation.test.ts  # 기존 테스트 (17개)
├── test-data/
│   ├── datasets/                # 테스트 데이터셋
│   └── reference-results/        # R/SPSS 검증 결과
└── jest.config.js               # Jest 설정
```

## 🔧 테스트 환경 설정

### 현재 문제점
- **Pyodide는 브라우저 전용**: Jest의 jsdom 환경에서 CDN 로드 실패
- **해결 필요**: 모킹 또는 브라우저 테스트 필요

### 설치된 패키지
```json
{
  "devDependencies": {
    "@jest/globals": "^29.7.0",
    "@testing-library/react": "^14.3.1",
    "@types/jest": "^29.5.14"
  }
}
```

## 📊 구현된 통계 함수 목록 (29개)

### 기술통계 (3개)
- `shapiroWilkTest(data: number[])` - 정규성 검정
- `detectOutliers(data: number[])` - 이상치 탐지
- `leveneTest(groups: number[][])` - 등분산성 검정

### T-검정 (1개 함수, 4가지 모드)
- `tTest(group1, group2, options)`
  - 독립표본 (paired: false, equalVar: true)
  - Welch (paired: false, equalVar: false)
  - 대응표본 (paired: true)

### 분산분석 (2개)
- `anova(groups: number[][])` - 일원분산분석
- `tukeyHSD(groups: number[][])` - 사후검정

### 상관/회귀 (2개)
- `correlation(x: number[], y: number[])` - Pearson/Spearman
- `regression(x: number[], y: number[])` - 선형회귀

### 비모수 검정 (3개)
- `mannWhitneyU(group1, group2)`
- `wilcoxon(group1, group2)`
- `kruskalWallis(groups: number[][])`

### 고급 분석 (6개)
- `chiSquareTest(table: number[][])`
- `cronbachAlpha(items: number[][])`
- `pca(data: number[][])`
- `factorAnalysis(data: number[][], nFactors: number)`
- `clusterAnalysis(data: number[][], options)`
- `timeSeriesAnalysis(data: number[], options)`

## ✅ 현재 테스트 커버리지
```
✓ T-test (독립/대응/Welch)
✓ 일원 ANOVA + Tukey HSD
✓ 상관분석 (Pearson/Spearman)
✓ 선형회귀
✓ Shapiro-Wilk, Levene
✓ Mann-Whitney U, Wilcoxon, Kruskal-Wallis
✓ 카이제곱, 기술통계, 이상치

❌ 미구현:
- PCA, 요인분석, 군집분석
- Cronbach's Alpha
- 시계열분석
- 이원 ANOVA (함수 자체가 미구현)
```

## 🎯 테스트 작성 요청사항

### 1. 단위 테스트 보강
```typescript
// 예시: lib/services/__tests__/pyodide-statistics.test.ts
describe('PyodideStatisticsService', () => {
  // Pyodide 모킹 필요
  beforeAll(() => {
    global.loadPyodide = jest.fn().mockResolvedValue({
      runPythonAsync: jest.fn().mockResolvedValue(
        JSON.stringify({ statistic: 1.23, pvalue: 0.05 })
      ),
      globals: { set: jest.fn(), delete: jest.fn() },
      loadPackage: jest.fn()
    })
  })

  describe('고급 분석 함수', () => {
    test('PCA - 주성분 분석', async () => {
      const service = PyodideStatisticsService.getInstance()
      const data = [[1,2,3], [4,5,6], [7,8,9]]
      const result = await service.pca(data)

      expect(result).toHaveProperty('explainedVariance')
      expect(result).toHaveProperty('components')
    })
  })
})
```

### 2. 통합 테스트 (브라우저)
```typescript
// e2e/statistics.spec.ts (Playwright 사용)
import { test, expect } from '@playwright/test'

test('통계 함수 전체 플로우', async ({ page }) => {
  await page.goto('/test-pyodide')

  // Pyodide 초기화 대기
  await page.waitForFunction(() => window.pyodide !== undefined)

  // 실제 계산 테스트
  const result = await page.evaluate(async () => {
    const service = new PyodideStatisticsService()
    await service.initialize()
    return await service.cronbachAlpha([[1,2,3], [4,5,6]])
  })

  expect(result.alpha).toBeGreaterThan(0.7)
})
```

### 3. 레퍼런스 데이터 검증
```typescript
// R/SPSS 결과와 비교
const ReferenceResults = {
  pca: {
    data: [[1,2,3], [4,5,6], [7,8,9]],
    expected: {
      explainedVariance: [1.0, 0.0, 0.0],
      totalVariance: 1.0
    }
  },
  cronbachAlpha: {
    data: [[1,2,3], [2,3,4], [3,4,5]],
    expected: { alpha: 0.85 }
  }
}
```

## 🚨 주의사항

1. **Pyodide 로딩 이슈**
   - Jest에서는 모킹 필수
   - 실제 테스트는 브라우저 환경 필요

2. **비동기 처리**
   - 모든 통계 함수는 `async/await`
   - 초기화: `await service.initialize()`

3. **타입 체크**
   - TypeScript 엄격 모드
   - `any` 타입 사용 중 (개선 필요)

4. **정확도 허용치**
   ```typescript
   expect(result.pvalue).toBeCloseTo(expected, 4) // 소수점 4자리
   ```

## 🔗 참고 자료

- **기존 테스트**: `__tests__/statistics/statistical-validation.test.ts`
- **테스트 데이터**: `test-data/datasets/standard-datasets.ts`
- **서비스 코드**: `lib/services/pyodide-statistics.ts`
- **문서**: `docs/technical/TESTING_GUIDE.md`

## 💬 추가 컨텍스트

### 최근 수정사항
1. `runPython` → `runPythonAsync` 변경
2. JavaScript 배열 → Python 변환 수정
3. JSON 직렬화 오류 해결
4. `json.dumps(result) = {...}` 문법 오류 수정

### 테스트 실행 방법
```bash
# 단위 테스트 (모킹 필요)
npm test

# 브라우저 테스트 페이지
npm run dev
# http://localhost:3000/test-results
```

### 목표
- 29개 함수 모두 테스트 커버리지 100%
- R/SPSS 결과와 0.0001 오차 이내
- CI/CD 파이프라인 통합 가능한 테스트

---

이 문서를 다른 AI에게 제공하면 테스트 코드 작성을 이어갈 수 있습니다.