# 통합 파일 분리 작업 계획 (statistical-analysis-platform.html)

## 목표
- `statistical-analysis-platform.html`(~4,417줄)을 기능별 모듈로 분리
- DOM/UI, 상태, 데이터, 통계로직, Pyodide 초기화의 관심사 분리
- ES Module(`type="module"`) 기반 로드 순서/의존성 명확화

## 최종 파일 구조(제안)
- src/js/app.js — 엔트리포인트(초기화, 이벤트 바인딩, 단계 전환 오케스트레이션)
- src/js/state/analysis-state.js — 전역 상태 저장소(currentStep, analysisResults, currentData)
- src/js/pyodide/init.js — Pyodide 로딩/패키지 준비(비동기 초기화)
- src/js/data/loader.js  파일 업로드/SheetJS 파싱 통일(CSV/XLSX)
- src/js/data/validation.js  기본 검증, 타입/결측/요약/표 미리보기 생성
- src/js/analysis/assumptions.js  정규성/등분산 검정(Pyodide+SciPy 호출)
- src/js/analysis/recommendation.js  의사결정 트리 규칙 매핑 방법 추천
- src/js/analysis/execute.js  t-test/ANOVA/비모수 실행(표준 스키마로 반환)
- src/js/analysis/posthoc.js  Tukey/Games-Howell/Dunn(향후 구현; 현재 비활성)
- src/js/ui/steps.js  단계 전환/버튼 활성화/가드 처리
- src/js/ui/renderers.js  검증/가정/추천/결과 섹션 렌더 전담
- src/js/ui/tooltip.js, src/js/ui/toast.js  부가 UI 유틸
- src/components/*.html  단계별 큰 섹션 템플릿 파일(fetch로 주입)
- src/css/styles.css  커스텀 스타일(다크 모드 변수 연동 유지)

## 단계별 진행(4 스프린트)
### 1주차: 엔트리/상태/데이터
- app.js, state/analysis-state.js, data/loader.js, data/validation.js 분리
- HTML에서 inline 스크립트 제거, `<script type="module" src="src/js/app.js">`로 교체
- 검증 섹션 렌더를 ui/renderers.js로 이관

### 2주차: Pyodide/가정 검정
- pyodide/init.js, analysis/assumptions.js 도입
- 정규성/등분산 UI 렌더를 ui/renderers.js로 이관
- 가정 결과 스키마 확정: { test, stat, p, isNormal/isHomogeneous, interpretation }

### 3주차: 추천/실행/결과
- analysis/recommendation.js, analysis/execute.js 분리
- `STATISTICAL_DECISION_TREE.md`와 1:1 규칙 매핑 테이블로 추천 구현
- 결과 렌더/내보내기를 ui/renderers.js로 통합

### 4주차: 컴포넌트/정리
- src/components/step*.html로 큰 섹션 분리 후 fetch 주입
- analysis/posthoc.js 비활성 버튼/안내 적용(실제 계산 전)
- 리팩토링/죽은 코드 제거/주석 정리

## 의존성/로드 순서
- HTML: Tailwind CDN 유지
- `<script type="module" src="src/js/app.js"></script>` 하나만 남김(나머지 inline 제거)
- app.js import 순서: state  pyodide.init  data.loader/validation  ui.renderers/steps  analysis.*

## 인터페이스 계약(모듈 간)
- state/analysis-state.js
  - getState(), setState(partial), resetState()
- analysis/assumptions.js
  - runNormality(dataByVar) -> Array<NormalityResult>
  - runHomogeneity(groupedData) -> Array<HomogeneityResult>
- analysis/recommendation.js
  - recommend({normality, homogeneity, design}) -> { primary, alternatives, reasoning[] }
- analysis/execute.js
  - run(methodSpec, data) -> AnalysisResult(표준 통계량/해석/메타)

## 테스트/검증 기준
- 기능 테스트: 기존 `validation-test.html`, `test-functionality.html`로 단계별 점검
- 샘플 데이터 3세트(2그룹3그룹범주형)로 검증
- 회귀 방지: 동일 데이터 결과/표현 이전과 동일(또는 개선)
- 성능/UX: Pyodide 로딩 스피너/상태 표시 유지, 단계 전환 지연 없음

## 리스크/대응
- 모듈 경로 오류: 상대경로 통일(`../../`)
- DOM id 의존: ui/renderers.js에서만 DOM id 참조, 나머지는 순수 함수
- Pyodide 비동기: app.js에서 init await 후 이벤트 바인딩

## 완료 기준(산출물)
- 메인 HTML ~800줄 이하
- JS 모듈 10여 개로 분리, 함수형 구성 유지
- 의사결정 트리 규칙과 추천 로직의 1:1 매핑 주석/문서화
