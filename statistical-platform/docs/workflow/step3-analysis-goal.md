# Step 3: 분석 목표 설정 - 상세 명세

**버전**: 1.0.0
**최종 수정일**: 2025-01-17
**단계 번호**: 3/5

[← 전체 워크플로우로 돌아가기](./README.md) | [← Step 2](./STEP2_DATA_VALIDATION_SPEC.md) | [Step 4 →](./STEP4_ANALYSIS_EXECUTION_SPEC.md)

---

## 🎯 단계 개요

| 항목 | 내용 |
|-----|------|
| **목적** | 연구 질문을 통계적 가설로 변환하고 최적 분석 방법 선택 |
| **설명** | 답을 찾고 싶은 질문 정의 |
| **아이콘** | Sparkles |
| **예상 소요시간** | 1-3분 (사용자 선택) |
| **선행 조건** | Step 2 완료 (데이터 검증) |
| **다음 단계** | Step 4: 분석 수행 |
| **핵심 원칙** | "올바른 질문이 올바른 답을 만든다" |

## 3.1 버전 전략

### 3.1.1 기본 버전 (내부 업무망용)
- **환경**: 오프라인, 폐쇄망
- **배포**: HTML 파일 직접 실행
- **AI**: 없음 (규칙 기반 추천)
- **대상**: 보안 환경 기관/기업

### 3.1.2 향후 확장 버전
- **데스크탑**: Tauri 앱 + Ollama 로컬 AI
- **클라우드**: 웹 서비스 + OpenAI/Claude API
- **하이브리드**: 선택적 AI 활성화

## 3.2 인터페이스 구성 (AI 없는 버전)

### 3.2.1 2단계 선택 방식

#### Level 1: 질문 유형 선택
```
무엇을 알고 싶으신가요?

┌─────────────────────────────────┐
│ 📊 차이/비교 분석                │
│ 두 개 이상 그룹 간 차이 검정     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📈 관계/예측 분석                │
│ 변수 간 관계 파악 및 예측        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📋 빈도/분포 분석                │
│ 범주형 자료 분석 및 적합도       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🔬 고급/특수 분석                │
│ 차원축소, 군집, 시계열 등        │
└─────────────────────────────────┘
```

#### Level 2: 구체적 방법 선택

**차이/비교 선택 시:**
```
어떤 비교를 하시겠습니까?

t-검정 계열:
□ 한 그룹의 평균이 특정값과 다른가? → 일표본 t-test
□ 두 독립 그룹 간 평균 차이가 있는가? → 독립표본 t-test
□ 같은 대상의 전후 차이가 있는가? → 대응표본 t-test
□ 두 그룹의 분산이 다를 때 평균 비교 → Welch's t-test

분산분석 계열:
□ 3개 이상 그룹 간 평균 차이 → 일원분산분석
□ 2개 요인의 효과 분석 → 이원분산분석
□ 사후검정 필요 → Tukey/Bonferroni/Games-Howell

비모수 검정:
□ 정규성 가정 불만족 시 대안 → Mann-Whitney/Wilcoxon/Kruskal-Wallis
```

### 3.2.2 전체 통계 방법 목록 (29개)

```
📊 기술통계 & 검정 (3개)
├─ calculateDescriptiveStats - 기본 통계량
├─ normalityTest - Shapiro-Wilk 정규성 검정
└─ homogeneityTest - Levene 등분산성 검정

📈 t-검정 (4개)
├─ oneSampleTTest - 일표본 t-검정
├─ twoSampleTTest - 독립표본 t-검정
├─ pairedTTest - 대응표본 t-검정
└─ welchTTest - Welch's t-검정

📉 분산분석 & 사후검정 (5개)
├─ oneWayANOVA - 일원분산분석
├─ twoWayANOVA - 이원분산분석
├─ tukeyHSD - Tukey 정직유의차
├─ bonferroniPostHoc - Bonferroni 보정
└─ gamesHowellPostHoc - Games-Howell

📊 회귀 & 상관 (4개)
├─ simpleLinearRegression - 단순선형회귀
├─ multipleRegression - 다중회귀분석
├─ logisticRegression - 로지스틱 회귀
└─ correlationAnalysis - 상관분석

📋 비모수 검정 (5개)
├─ mannWhitneyU - Mann-Whitney U
├─ wilcoxonSignedRank - Wilcoxon 부호순위
├─ kruskalWallis - Kruskal-Wallis
├─ dunnTest - Dunn 다중비교
└─ chiSquareTest - 카이제곱 검정

🔬 고급 분석 (6개)
├─ principalComponentAnalysis - 주성분분석
├─ kMeansClustering - K-평균 군집
├─ hierarchicalClustering - 계층적 군집
├─ timeSeriesDecomposition - 시계열 분해
├─ arimaForecast - ARIMA 예측
└─ kaplanMeierSurvival - Kaplan-Meier 생존
```

## 3.3 규칙 기반 자동 추천 (AI 없이)

### 3.3.1 데이터 특성 기반 추천

```javascript
// Step 2 데이터를 활용한 규칙 기반 추천
function recommendMethods(dataProfile) {
  const recommendations = []

  // 규칙 1: 수치형 2개 → 상관분석
  if (dataProfile.numericVars >= 2) {
    recommendations.push({
      method: 'correlationAnalysis',
      reason: '수치형 변수 2개 이상',
      priority: 1
    })
  }

  // 규칙 2: 그룹변수 + 수치형 → t-test/ANOVA
  if (dataProfile.hasGroupVar && dataProfile.numericVars >= 1) {
    if (dataProfile.groupLevels == 2) {
      recommendations.push({
        method: 'twoSampleTTest',
        reason: '2개 그룹 비교 가능',
        priority: 1
      })
    } else if (dataProfile.groupLevels >= 3) {
      recommendations.push({
        method: 'oneWayANOVA',
        reason: '3개 이상 그룹 비교',
        priority: 1
      })
    }
  }

  // 규칙 3: 시간 변수 → 시계열
  if (dataProfile.hasTimeVar) {
    recommendations.push({
      method: 'timeSeriesDecomposition',
      reason: '시간 변수 존재',
      priority: 2
    })
  }

  return recommendations
}
```

### 3.3.2 변수 자동 매핑

```
선택한 방법: 독립표본 t-test

자동 감지된 변수 조합:
┌────────────────────────────────┐
│ 그룹 변수 (2개 수준 필요)        │
│ ⚪ Gender (Male/Female)         │
│ ⚪ Treatment (A/B)              │
│                                │
│ 비교할 변수 (수치형)            │
│ ⚪ Income                       │
│ ⚪ Score                        │
│ ⚪ Age                          │
└────────────────────────────────┘

[자동 선택] [수동 선택]
```

## 3.4 방법별 요구사항 검증

### 3.4.1 실시간 가능성 체크

```javascript
const methodRequirements = {
  // t-검정 계열
  oneSampleTTest: {
    필수: {
      변수: ['수치형 1개'],
      입력: ['비교값'],
      최소N: 2
    },
    권장: {
      정규성: true,
      최소N: 30
    }
  },

  twoSampleTTest: {
    필수: {
      변수: ['그룹변수 1개(2수준)', '수치형 1개'],
      최소N: 4 // 각 그룹 2개
    },
    권장: {
      정규성: true,
      등분산성: true,
      최소N: 30 // 각 그룹
    }
  },

  // 고급 분석
  principalComponentAnalysis: {
    필수: {
      변수: ['수치형 3개 이상'],
      최소N: '변수수 × 3'
    },
    권장: {
      상관성: '변수 간 상관 > 0.3',
      KMO: '> 0.6'
    }
  },

  kaplanMeierSurvival: {
    필수: {
      변수: ['생존시간', '사건발생(0/1)'],
      최소N: 20
    },
    권장: {
      중도절단: '정보 포함',
      최소N: 50
    }
  }

  // ... 29개 모든 방법
}
```

### 3.4.2 불가능 경고

```
❌ 선택 불가: ARIMA 예측

필수 조건 미충족:
• 필요: 시계열 데이터 (날짜/시간)
• 현재: 시간 변수 없음
• 필요: 최소 50개 시점
• 현재: 해당 없음

대안 추천:
→ 회귀분석 (예측이 목적이라면)
→ 추세분석 (패턴 파악이 목적이라면)
```

## 3.5 가설 설정 인터페이스

### 3.5.1 자동 가설 생성

```
선택: 독립표본 t-test (Gender × Income)

📝 통계적 가설 (자동 생성):

귀무가설 (H₀):
남성과 여성의 평균 소득에 차이가 없다
μ_male = μ_female

대립가설 (H₁):
남성과 여성의 평균 소득에 차이가 있다
μ_male ≠ μ_female

[수정] [확인]
```

### 3.5.2 세부 옵션

```
⚙️ 분석 옵션

유의수준 (α):
⚪ 0.10  ⚫ 0.05  ⚪ 0.01  ⚪ 0.001

검정 방향:
⚫ 양측 검정 (≠)
⚪ 단측 검정 - 크다 (>)
⚪ 단측 검정 - 작다 (<)

추가 계산:
☑ 효과크기 (Cohen's d)
☑ 95% 신뢰구간
☑ 검정력 분석
□ Bootstrap (1000회)

결측값 처리:
⚫ 목록별 제거 (listwise)
⚪ 쌍별 제거 (pairwise)
⚪ 평균 대체
```

## 3.6 분석 계획 요약

### 3.6.1 최종 확인 화면

```
📋 분석 계획 확인

분석 목표: 성별에 따른 소득 차이 검정
통계 방법: 독립표본 t-test

변수 설정:
• 독립변수: Gender (Male: n=45, Female: n=53)
• 종속변수: Income (평균: 52,340, SD: 23,450)

데이터 체크: (Step 2 결과)
⚠️ Income 정규성 위반 (p<0.001)
✅ 표본 크기 충분 (n>30)
⚠️ 등분산성 위반 (p=0.003)

권장 조정:
→ Welch's t-test 사용 (등분산 가정 불필요)
또는
→ Mann-Whitney U test (비모수)

[조정 적용] [그대로 진행] [뒤로]
```

## 3.7 AI 지원 (선택적 확장)

### 3.7.1 향후 AI 통합 위치
```markdown
<!-- 주석: AI 버전에서만 활성화 -->
<!--
[AI 추천 받기] 버튼
- 로컬: Ollama (Gemma 2B)
- 클라우드: OpenAI API
- 자연어 → 통계 방법 매핑
-->
```

### 3.7.2 AI 없이도 충분한 이유
- 29개 방법 체계적 분류
- 데이터 기반 자동 필터링
- 규칙 기반 추천 시스템
- 실시간 요구사항 검증

## 3.8 진행 조건 및 검증

### 3.8.1 필수 선택 항목
- ✅ 통계 방법 선택
- ✅ 변수 매핑 완료
- ✅ 가설 확인

### 3.8.2 자동 설정 항목
- 유의수준: 0.05 (기본)
- 검정방향: 양측 (기본)
- 결측처리: 목록별 제거 (기본)

## 3.9 오류 방지 시스템

### 3.9.1 실시간 검증

선택 시마다 자동으로:
- 필수 조건 충족 확인
- 권장 사항 체크
- 경고/오류 메시지 표시

## 3.10 성능 고려사항

### 3.10.1 HTML 단독 실행 최적화
- 외부 의존성 없음
- 모든 로직 JavaScript로 구현
- 파일 크기: < 100KB
- 로딩 시간: < 1초

---

[다음: Step 4 - 분석 수행 →](./STEP4_ANALYSIS_EXECUTION_SPEC.md)