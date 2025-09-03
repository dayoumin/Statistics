# 📋 구현 계획 (인터랙티브 플로우 반영)
**프로젝트**: 수산과학원 통계분석 도구  
**작성일**: 2025-01-03  
**최종수정**: 2025-01-03 - 인터랙티브 분석 가이드 플로우 통합

---

## 🔄 핵심 변경사항 (인터랙티브 플로우)

### 기존 방식 → 새로운 방식
- ❌ 데이터 입력 → 즉시 분석 실행
- ✅ 데이터 입력 → 자동 검정 → 방법 제안 → 사용자 확인 → 분석 실행

### 주요 특징
- **자동 분석**: 정규성, 등분산성 자동 검정
- **스마트 추천**: 조건에 맞는 최적 검정 방법 제안
- **사용자 확인**: 추천 수락 또는 대안 선택 가능
- **교육적 설명**: 각 단계마다 이유 설명

---

## 🎯 현재 상태

### ✅ 완료된 작업
1. **프로젝트 문서화**
   - PRD, Development Plan, Technical Spec, Test Cases
   - Design System, Modern UI Style
   
2. **빌드 스크립트**
   - Pyodide 번들 생성 스크립트 (`create_pyodide_bundle.py`)
   - 한글 폰트 서브셋 스크립트 (`create_font_subset.py`)
   
3. **기본 HTML/UI 구조**
   - 메인 HTML 파일 (`index.html`)
   - 글라스모피즘 디자인
   - 3단 레이아웃 (입력/결과/시각화)
   - 로딩 화면 UI

---

## 🔨 구현 우선순위 (인터랙티브 플로우 기반)

### Phase 1: **인터랙티브 플로우 기반 구조** [Day 1-2] 🔴 즉시 시작

#### 1.1 상태 관리 시스템
```javascript
// analysis-state.js
class AnalysisState {
  constructor() {
    this.workflow = {
      currentStep: 'data_input',
      steps: ['data_input', 'validation', 'normality', 'homogeneity', 'method_selection', 'execution', 'results'],
      completedSteps: [],
      results: {}
    }
  }
  
  nextStep() { }
  previousStep() { }
  saveStepResult(step, result) { }
}
```

#### 1.2 플로우 컨트롤러
```javascript
// workflow-controller.js
class WorkflowController {
  async processData(data) {
    // 1. 데이터 검증
    const validation = await this.validateData(data);
    
    // 2. 자동 분석 (정규성, 등분산성)
    const assumptions = await this.checkAssumptions(data);
    
    // 3. 방법 추천
    const recommendation = this.recommendMethod(assumptions);
    
    // 4. 사용자 확인 대기
    const userChoice = await this.getUserConfirmation(recommendation);
    
    // 5. 분석 실행
    return this.executeAnalysis(data, userChoice);
  }
}
```

#### 1.3 UI 컴포넌트
```javascript
// ui-components.js
class StepIndicator { }      // 진행 상태 표시
class DecisionCard { }        // 의사결정 카드
class ConfirmDialog { }       // 사용자 확인 다이얼로그
class RecommendationPanel { } // 추천 방법 패널
```

---

### Phase 2: **자동 분석 엔진** [Day 3-4]

#### 2.1 데이터 특성 분석기
```javascript
// data-analyzer.js
class DataAnalyzer {
  detectGroups(data) { }      // 그룹 자동 감지
  countSamples(data) { }       // 샘플 수 계산
  findMissing(data) { }        // 결측치 탐지
  detectOutliers(data) { }     // 이상치 탐지
}
```

#### 2.2 가정 검정 자동화
```javascript
// assumption-checker.js
class AssumptionChecker {
  async checkNormality(data) {
    // n < 50: Shapiro-Wilk
    // n >= 50: Kolmogorov-Smirnov
    return {
      method: selectedMethod,
      results: groupResults,
      interpretation: "모든 그룹이 정규분포를 따릅니다",
      passed: true
    }
  }
  
  async checkHomogeneity(data, isNormal) {
    // 정규: Bartlett's / 비정규: Levene's
    return {
      method: selectedMethod,
      result: testResult,
      interpretation: "등분산 가정을 만족합니다",
      passed: true
    }
  }
}
```

#### 2.3 방법 추천 엔진
```javascript
// method-recommender.js
class MethodRecommender {
  recommend(groupCount, normality, homogeneity) {
    // 조건별 최적 검정 방법 결정 로직
    return {
      primary: { method: 'anova', reason: '정규분포, 등분산 만족' },
      alternatives: [/* 대안 방법들 */]
    }
  }
}
```

---

### Phase 3: **Pyodide 통합 및 Python 환경** [Day 5]

#### 3.1 Pyodide 로더
```javascript
// data-parser.js
class DataParser {
  parseCSV(text) { }
  parseExcel(file) { }  // SheetJS 사용
  parseTSV(text) { }
}
```

#### 2.2 복사/붙여넣기 데이터 처리
```javascript
// 클립보드 데이터 자동 감지
- Tab 구분 (Excel)
- Comma 구분 (CSV)
- 헤더 자동 감지
```

#### 2.3 데이터 검증
```javascript
class DataValidator {
  - 숫자 데이터 확인
  - 결측치 처리
  - 그룹 식별
  - 최소 샘플 수 확인
}
```

#### 2.4 데이터 변환
```javascript
// Python 형식으로 변환
- JavaScript 배열 → Python 리스트
- 그룹별 데이터 구조화
```

---

### 3. **통계 분석 엔진 Python 코드** [4-5시간]

#### 3.1 기술통계
```python
def calculate_descriptive_stats(groups):
    - 평균, 표준편차
    - 중앙값, 사분위수
    - 최소/최대값
    - 95% 신뢰구간
```

#### 3.2 정규성 검정
```python
def test_normality(data):
    - n < 50: Shapiro-Wilk
    - n >= 50: Kolmogorov-Smirnov
    - Q-Q plot 데이터 생성
```

#### 3.3 등분산성 검정
```python
def test_homogeneity(groups):
    - Levene's test
    - Bartlett's test
    - F-test (2그룹)
```

#### 3.4 주 검정 로직
```python
def perform_main_test(groups, assumptions):
    - 2그룹: t-test 계열
    - 3그룹+: ANOVA 계열
    - 비모수: Mann-Whitney, Kruskal-Wallis
```

#### 3.5 효과 크기 계산
```python
def calculate_effect_size():
    - Cohen's d (t-test)
    - Eta-squared (ANOVA)
    - Epsilon-squared (Kruskal-Wallis)
```

---

### 4. **사후분석 알고리즘** [3-4시간]

#### 4.1 Tukey HSD 구현
```python
def tukey_hsd(groups):
    # scipy에 없으므로 직접 구현
    - Studentized range distribution
    - 모든 쌍별 비교
    - 신뢰구간 계산
```

#### 4.2 Bonferroni 보정
```python
def bonferroni_correction(pvalues, alpha=0.05):
    - 다중비교 보정
    - 조정된 p-value
```

#### 4.3 Games-Howell (등분산 가정 위배)
```python
def games_howell(groups):
    - Welch's t-test 기반
    - 자유도 조정
```

#### 4.4 Dunn's test (비모수)
```python
def dunns_test(groups):
    - 순위 기반 검정
    - Z-통계량 계산
```

---

### 5. **Chart.js 통합 및 시각화** [3-4시간]

#### 5.1 Chart.js 라이브러리 임베딩
```javascript
// Chart.js 3.x 버전
- 기본 차트 타입만 포함
- 필요한 플러그인만 선택
```

#### 5.2 Box Plot 구현
```javascript
function createBoxPlot(data):
    - 사분위수 계산
    - 이상치 표시
    - 그룹별 색상 구분
```

#### 5.3 평균 비교 차트
```javascript
function createMeanChart(stats):
    - Bar chart + Error bars
    - 95% 신뢰구간 표시
    - 유의미한 차이 표시
```

#### 5.4 분포 시각화
```javascript
function createDistributionPlot(data):
    - Histogram
    - 정규분포 곡선 오버레이
    - Q-Q plot
```

#### 5.5 사후분석 히트맵
```javascript
function createPostHocHeatmap(results):
    - p-value 매트릭스
    - 색상 그라디언트
    - 유의미한 쌍 하이라이트
```

---

### 6. **Excel/PDF 내보내기** [2-3시간]

#### 6.1 SheetJS 통합
```javascript
// Excel 파일 생성
- 원본 데이터 시트
- 통계 결과 시트
- 사후분석 시트
- 한글 인코딩 처리
```

#### 6.2 jsPDF 통합
```javascript
// PDF 보고서 생성
- 한글 폰트 임베딩
- 차트 이미지 삽입
- 표 생성
- 페이지 레이아웃
```

#### 6.3 다운로드 기능
```javascript
function downloadFile(blob, filename):
    - Blob 생성
    - 다운로드 링크 생성
    - 자동 다운로드 트리거
```

---

### 7. **한글 폰트 임베딩** [1-2시간]

#### 7.1 Pretendard 폰트 Base64 변환
```javascript
// 이미 생성된 font_bundle.json 사용
- Regular, Bold 웨이트
- 한글 2350자 + 영문/숫자
```

#### 7.2 CSS 적용
```css
@font-face {
    font-family: 'Pretendard';
    src: url('data:font/woff2;base64,...');
}
```

#### 7.3 폰트 로딩 최적화
```javascript
// font-display: swap
- FOUT 방지
- 폴백 폰트 설정
```

---

### 8. **에러 처리 및 복구** [2-3시간]

#### 8.1 에러 타입 정의
```javascript
const ErrorTypes = {
    PYODIDE_LOAD_FAILED,
    DATA_INVALID,
    MEMORY_EXCEEDED,
    CALCULATION_FAILED
}
```

#### 8.2 에러 핸들러
```javascript
class ErrorHandler {
    - 사용자 친화적 메시지
    - 해결 방법 제시
    - 재시도 옵션
}
```

#### 8.3 자동 복구
```javascript
async function autoRecover(error):
    - 메모리 정리
    - Pyodide 재시작
    - 상태 복원
```

#### 8.4 에러 로깅
```javascript
// 로컬 스토리지에 에러 기록
- 디버깅용
- 패턴 분석
```

---

### 9. **성능 최적화** [2-3시간]

#### 9.1 코드 분할
```javascript
// 지연 로딩
- 고급 기능은 필요시 로드
- 초기 로딩 최소화
```

#### 9.2 Web Worker 활용
```javascript
// 무거운 계산은 워커에서
- UI 블로킹 방지
- 병렬 처리
```

#### 9.3 메모리 관리
```javascript
// 가비지 컬렉션
- 불필요한 데이터 정리
- 메모리 사용량 모니터링
```

---

### 10. **최종 빌드 및 테스트** [3-4시간]

#### 10.1 번들 생성
```bash
# 모든 리소스 통합
python build_final.py
```

#### 10.2 크기 최적화
- HTML/CSS/JS 압축
- 불필요한 코드 제거
- gzip 압축

#### 10.3 테스트
- 다양한 데이터셋
- 브라우저 호환성
- 메모리 한계 테스트

#### 10.4 문서화
- 사용자 매뉴얼
- 설치 가이드
- FAQ

---

## 📅 작업 순서 및 예상 시간

| 순서 | 작업 항목 | 예상 시간 | 우선순위 |
|------|-----------|-----------|----------|
| 1 | Pyodide 실제 통합 | 3-4시간 | 🔴 필수 |
| 2 | 데이터 파싱 모듈 | 2-3시간 | 🔴 필수 |
| 3 | 통계 엔진 구현 | 4-5시간 | 🔴 필수 |
| 4 | 사후분석 구현 | 3-4시간 | 🔴 필수 |
| 5 | Chart.js 시각화 | 3-4시간 | 🟡 중요 |
| 6 | 한글 폰트 적용 | 1-2시간 | 🟡 중요 |
| 7 | Excel/PDF 내보내기 | 2-3시간 | 🟢 선택 |
| 8 | 에러 처리 | 2-3시간 | 🟡 중요 |
| 9 | 성능 최적화 | 2-3시간 | 🟢 선택 |
| 10 | 최종 빌드 | 3-4시간 | 🔴 필수 |

**총 예상 시간**: 27-37시간 (3-4일)

---

## 🚀 다음 단계

**지금 시작할 작업**: **1. Pyodide 실제 통합 및 로딩**

이유:
- 가장 핵심적인 기능
- 다른 모든 기능의 기반
- 로딩 문제 해결이 우선

준비됐나요?