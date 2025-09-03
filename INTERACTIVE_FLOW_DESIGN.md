# 인터랙티브 분석 가이드 플로우 설계

## 개요
사용자가 데이터를 입력하면 자동으로 데이터 특성을 분석하고, 단계별로 최적의 통계 검정 방법을 제안하는 인터랙티브 가이드 시스템

## 핵심 원칙
- **자동 분석, 사용자 확인**: 시스템이 먼저 분석하고 제안, 사용자는 확인만
- **단계별 진행**: 이전 결과에 따라 다음 단계 자동 결정
- **투명한 의사결정**: 왜 이 검정을 선택했는지 명확히 설명
- **되돌리기 가능**: 각 단계에서 다른 옵션 선택 가능

## 플로우 차트

```
1. 데이터 입력
   ↓
2. 데이터 검증 및 기초 분석
   - 데이터 형식 확인
   - 결측치/이상치 탐지
   - 기술통계 계산
   ↓
3. 그룹 구조 분석
   - 그룹 수 자동 감지
   - 샘플 크기 확인
   ↓
4. 정규성 검정 (자동)
   - n < 50: Shapiro-Wilk
   - n ≥ 50: Kolmogorov-Smirnov
   ↓
5. 등분산성 검정 (자동)
   - 정규분포: Bartlett's test
   - 비정규분포: Levene's test
   ↓
6. 검정 방법 제안
   - 모든 조건 고려하여 최적 방법 제안
   - 대안 방법도 함께 제시
   ↓
7. 사용자 확인
   - 제안 수락 또는 다른 방법 선택
   ↓
8. 통계 검정 실행
   ↓
9. 사후분석 필요성 판단
   - ANOVA/Kruskal-Wallis 유의한 경우 자동 진행
   ↓
10. 결과 해석 및 시각화
```

## 단계별 상세 설계

### 1단계: 데이터 입력 직후
```javascript
{
  "status": "데이터 분석 중...",
  "results": {
    "dataPoints": 150,
    "groups": 3,
    "variables": 1,
    "missingValues": 0,
    "outliers": 2
  },
  "message": "3개 그룹, 150개 데이터를 감지했습니다.",
  "nextStep": "정규성 검정을 진행하시겠습니까?"
}
```

### 2단계: 정규성 검정 결과
```javascript
{
  "status": "정규성 검정 완료",
  "results": {
    "method": "Shapiro-Wilk test (n < 50)",
    "group1": { "statistic": 0.95, "pValue": 0.15, "normal": true },
    "group2": { "statistic": 0.94, "pValue": 0.12, "normal": true },
    "group3": { "statistic": 0.93, "pValue": 0.08, "normal": true }
  },
  "interpretation": "모든 그룹이 정규분포를 따릅니다 (p > 0.05)",
  "recommendation": "정규분포 가정을 만족하므로 ANOVA 사용 가능",
  "nextStep": "등분산성 검정을 진행하시겠습니까?"
}
```

### 3단계: 등분산성 검정 결과
```javascript
{
  "status": "등분산성 검정 완료",
  "results": {
    "method": "Bartlett's test (정규분포 데이터)",
    "statistic": 2.34,
    "pValue": 0.31,
    "equalVariance": true
  },
  "interpretation": "그룹 간 분산이 동일합니다 (p > 0.05)",
  "nextStep": "검정 방법 선택"
}
```

### 4단계: 검정 방법 제안
```javascript
{
  "status": "최적 검정 방법 제안",
  "recommendation": {
    "primary": {
      "method": "One-way ANOVA",
      "reason": "3개 그룹, 정규분포, 등분산 만족",
      "postHoc": "Tukey HSD"
    },
    "alternatives": [
      {
        "method": "Welch's ANOVA",
        "reason": "등분산 가정에 민감하지 않은 경우"
      },
      {
        "method": "Kruskal-Wallis test",
        "reason": "비모수적 방법을 선호하는 경우"
      }
    ]
  },
  "userAction": "제안된 방법으로 진행하시겠습니까?"
}
```

### 5단계: 사용자 확인 UI
```javascript
{
  "confirmationDialog": {
    "title": "분석 방법 확인",
    "summary": [
      "✓ 데이터: 3개 그룹, 150개 샘플",
      "✓ 정규성: 만족 (Shapiro-Wilk)",
      "✓ 등분산성: 만족 (Bartlett's)",
      "→ 추천: One-way ANOVA + Tukey HSD"
    ],
    "buttons": [
      { "text": "추천 방법으로 진행", "action": "proceed", "primary": true },
      { "text": "다른 방법 선택", "action": "showAlternatives" },
      { "text": "처음부터 다시", "action": "restart" }
    ]
  }
}
```

## UI/UX 디자인 원칙

### 진행 표시기
```
[1.데이터] → [2.정규성] → [3.등분산] → [4.검정선택] → [5.실행] → [6.결과]
    ✓           진행중          대기           대기          대기       대기
```

### 결과 카드 디자인
- **헤더**: 검정 이름과 상태 아이콘
- **본문**: 주요 통계량과 p-value
- **해석**: 평이한 한글로 결과 설명
- **액션**: 다음 단계 또는 대안 선택 버튼

### 의사결정 트리 시각화
```
         데이터 입력
              │
         그룹 수 확인
         ╱    │    ╲
      2그룹  3+그룹  1그룹
        │      │      │
    정규성?  정규성?  [단일표본]
    ╱  ╲    ╱  ╲
   Y    N   Y    N
   │    │   │    │
등분산? M-W 등분산? K-W
 ╱ ╲        ╱ ╲
Y   N      Y   N
│   │      │   │
t  Welch ANOVA Welch
```

## 구현 우선순위

1. **Phase 1: 기본 플로우**
   - 데이터 검증 및 그룹 감지
   - 정규성/등분산성 자동 검정
   - 검정 방법 자동 선택 로직

2. **Phase 2: 사용자 인터랙션**
   - 단계별 확인 다이얼로그
   - 대안 방법 선택 UI
   - 진행 상태 표시기

3. **Phase 3: 고급 기능**
   - 의사결정 과정 시각화
   - 검정 가정 위반 시 경고
   - 교육적 설명 추가

## 기술적 구현 고려사항

### 상태 관리
```javascript
const analysisState = {
  currentStep: 'normality',
  data: { /* 원본 데이터 */ },
  results: {
    dataValidation: { /* 검증 결과 */ },
    normality: { /* 정규성 검정 결과 */ },
    homogeneity: { /* 등분산성 검정 결과 */ },
    recommendation: { /* 추천 검정 방법 */ }
  },
  userChoices: {
    acceptedNormality: true,
    selectedMethod: 'anova',
    confirmations: []
  }
}
```

### 자동 진행 vs 수동 확인
```javascript
// 자동으로 진행되는 단계
const autoSteps = ['dataValidation', 'normality', 'homogeneity'];

// 사용자 확인이 필요한 단계
const confirmationSteps = ['methodSelection', 'postHocSelection'];

// 각 단계별 타임아웃 (자동 진행 시)
const stepTimeout = {
  dataValidation: 0,    // 즉시
  normality: 500,       // 0.5초 후
  homogeneity: 500,     // 0.5초 후
  methodSelection: null // 사용자 입력 대기
};
```

## 예상 사용 시나리오

### 시나리오 1: 모든 가정 만족
1. 데이터 붙여넣기
2. 자동: "3개 그룹 감지"
3. 자동: "정규분포 확인"
4. 자동: "등분산 확인"
5. 제안: "ANOVA + Tukey HSD 추천"
6. 사용자: [진행] 클릭
7. 결과 표시

### 시나리오 2: 정규성 위반
1. 데이터 붙여넣기
2. 자동: "3개 그룹 감지"
3. 자동: "정규분포 위반 (p < 0.05)"
4. 제안: "Kruskal-Wallis 추천"
5. 사용자: [다른 방법] 클릭
6. 옵션: "변환 후 ANOVA" 또는 "그대로 진행"
7. 사용자 선택 후 결과 표시

### 시나리오 3: 초보자 모드
1. 데이터 붙여넣기
2. 시스템: "데이터를 분석했습니다. 어떤 것을 알고 싶으신가요?"
3. 옵션: "그룹 간 차이", "상관관계", "시간에 따른 변화"
4. 사용자: "그룹 간 차이" 선택
5. 자동으로 적절한 검정 수행
6. 결과를 쉬운 언어로 설명

## 예상 효과

1. **사용자 편의성**: 통계 지식 없이도 올바른 검정 선택
2. **교육적 가치**: 왜 이 검정을 사용하는지 학습
3. **신뢰성**: 자동화된 가정 검정으로 오류 감소
4. **유연성**: 전문가는 수동으로 다른 방법 선택 가능
5. **투명성**: 모든 의사결정 과정 추적 가능