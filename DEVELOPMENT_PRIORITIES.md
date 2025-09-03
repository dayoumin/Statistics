# 개발 우선순위 및 일정

## 🎯 즉시 개발 (1주 내)

### 1. 핵심 통계 모듈 완성
- [ ] **Two-way ANOVA** 
  - `src/js/statistics/anova-advanced.js`
  - 두 독립변수의 상호작용 효과 분석
  - 수산과학원 실험 데이터 분석에 필수

- [ ] **상관분석 모듈**
  - `src/js/statistics/correlation.js`
  - Pearson, Spearman, Kendall 상관계수
  - 편상관분석 (제3변수 통제)

### 2. CPUE 분석 UI 구현
- [ ] **CPUE 입력 폼**
  - `src/components/fisheries/cpue-input.html`
  - 어획량/어획노력 데이터 입력
  - 시계열 데이터 지원

- [ ] **CPUE 결과 시각화**
  - `src/components/fisheries/cpue-results.html`
  - 추세 그래프, 계절성 차트
  - 해역별 비교 맵

## 📊 단기 개발 (2주)

### 3. 회귀분석 모듈
```javascript
// src/js/statistics/regression.js
- 단순 선형 회귀
- 다중 회귀분석
- 로지스틱 회귀
- 잔차 분석 및 진단
```

### 4. 성장분석 모듈
```javascript
// src/js/fisheries/growth-analysis.js
- von Bertalanffy 성장 모델
- 길이-무게 관계 (W = aL^b)
- 성장률 계산 (SGR, DGR)
- 조건지수 (K factor)
```

### 5. 시계열 분석 기초
```javascript
// src/js/statistics/time-series-basic.js
- 이동평균 (MA)
- 지수평활 (Exponential Smoothing)
- 추세 분해
- 계절성 검정
```

## 🚀 중기 개발 (1개월)

### 6. 자원평가 모델
- **Schaefer 생산 모델**
  - MSY (최대지속생산량) 계산
  - 최적 어획노력 추정

- **Fox 모델**
  - 로그 변환 생산 모델
  - 소규모 어업 자원 평가

### 7. 수질 데이터 분석
- **수질 지표 상관분석**
  - DO, pH, 수온, 염분 관계
  - 시공간 패턴 분석

- **이상치 탐지**
  - Isolation Forest
  - DBSCAN 클러스터링

### 8. 고급 시각화
- **인터랙티브 차트**
  - Plotly.js 통합
  - 3D 산점도
  - 히트맵

## 📈 장기 개발 (2-3개월)

### 9. 베이지안 통계
- 베이지안 t-test
- 베이지안 ANOVA
- MCMC 시뮬레이션

### 10. 생존분석
- Kaplan-Meier 추정
- Cox 비례위험모델
- 양식 생존율 분석

### 11. 메타분석
- 효과 크기 계산
- Forest plot
- 출판 편향 검정

## 💡 개발 전략

### 모듈별 개발 순서
1. **통계 엔진 (Python)** → 2. **UI 컴포넌트** → 3. **통합 테스트**

### 각 모듈 체크리스트
- [ ] Python 함수 구현 (Pyodide)
- [ ] JavaScript 래퍼 작성
- [ ] HTML 컴포넌트 생성
- [ ] 단위 테스트 작성
- [ ] 문서화 (JSDoc)
- [ ] 샘플 데이터 준비
- [ ] 사용자 가이드 작성

### 테스트 데이터셋
```
/test-data/
├── fisheries/
│   ├── cpue_monthly.csv      # 월별 CPUE 데이터
│   ├── growth_yellowtail.csv # 방어 성장 데이터
│   ├── catch_by_area.csv     # 해역별 어획량
│   └── aquaculture_survival.csv # 양식 생존율
├── water-quality/
│   ├── do_temperature.csv    # DO-수온 관계
│   └── seasonal_params.csv   # 계절별 수질
└── general/
    ├── anova_3groups.csv     # ANOVA 테스트
    └── regression_multi.csv  # 다중회귀 테스트
```

## 🔍 품질 관리

### 정확도 목표
- 통계 계산: R/SPSS 대비 99.99% 일치
- p-value: 소수점 4자리까지 정확
- 신뢰구간: ±0.0001 오차

### 성능 목표
- 1000개 데이터: < 1초
- 10000개 데이터: < 5초
- 100000개 데이터: < 30초

### 코드 품질
- ESLint 규칙 준수
- 테스트 커버리지 > 80%
- 문서화 100%

## 📅 주간 스프린트

### Week 1 (즉시)
- Mon-Tue: Two-way ANOVA
- Wed-Thu: 상관분석
- Fri: CPUE UI

### Week 2
- Mon-Tue: 회귀분석
- Wed-Thu: von Bertalanffy
- Fri: 시계열 기초

### Week 3
- Mon-Tue: Schaefer/Fox 모델
- Wed-Thu: 수질 분석
- Fri: 통합 테스트

### Week 4
- Mon-Tue: 고급 시각화
- Wed-Thu: 성능 최적화
- Fri: 문서화 및 배포

## ✅ 완료 기준

### MVP (Minimum Viable Product)
- [x] 기본 통계 (t-test, ANOVA)
- [ ] 상관/회귀 분석
- [ ] CPUE 분석
- [ ] 성장 모델
- [ ] Excel 입출력

### Version 1.0
- [ ] 모든 기본 통계
- [ ] 수산과학 핵심 기능
- [ ] 시계열 분석
- [ ] PDF 보고서
- [ ] 완전 오프라인

### Version 2.0
- [ ] 베이지안 통계
- [ ] 고급 자원평가
- [ ] 머신러닝 통합
- [ ] 다국어 지원
- [ ] 클라우드 동기화

---

*우선순위는 사용자 피드백에 따라 조정될 수 있습니다.*
*최종 수정: 2024년 12월*