# 테스트 케이스 문서 (Test Cases)
**프로젝트**: 수산과학원 통계분석 도구  
**버전**: 1.0  
**작성일**: 2025-01-03

---

## 1. 테스트 개요

### 1.1 테스트 범위
- 데이터 입력/파싱
- 통계 계산 정확도
- 사후분석 자동화
- 시각화 출력
- 파일 내보내기
- 성능 및 안정성

### 1.2 테스트 환경
- 브라우저: Chrome 120+, Firefox 120+, Edge 120+, Safari 17+
- OS: Windows 10/11, macOS 13+, Ubuntu 22.04+
- 메모리: 4GB / 8GB / 16GB

---

## 2. 기능 테스트 케이스

### TC-001: 데이터 입력 - 복사/붙여넣기
**목적**: Excel에서 복사한 데이터가 올바르게 파싱되는지 확인

**테스트 데이터**:
```
그룹	값
A	23.5
A	24.1
A	22.9
B	26.8
B	27.2
B	26.5
C	21.3
C	20.9
C	21.7
```

**기대 결과**:
- 3개 그룹 감지
- 각 그룹 3개 데이터
- 탭 구분자 자동 인식

**검증 방법**:
```javascript
assert(parsedData.groups.length === 3);
assert(parsedData.groups[0].length === 3);
assert(parsedData.labels.deepEqual(['A', 'B', 'C']));
```

---

### TC-002: 데이터 입력 - CSV 파일 업로드
**목적**: CSV 파일 업로드 및 파싱 확인

**테스트 파일**: `test_data.csv`
```csv
treatment,measurement
Control,45.2
Control,44.8
Control,45.5
Drug_A,48.3
Drug_A,49.1
Drug_A,48.7
Drug_B,51.2
Drug_B,50.8
Drug_B,51.5
```

**기대 결과**:
- 파일 읽기 성공
- 쉼표 구분자 인식
- 헤더 행 자동 감지

---

### TC-003: 정규성 검정 - Shapiro-Wilk
**목적**: 소규모 데이터(n<50) 정규성 검정

**테스트 데이터**:
```javascript
const normalData = [
    23.5, 24.1, 22.9, 24.5, 23.8,
    24.2, 23.7, 24.0, 23.6, 24.3
]; // 정규분포 따름

const skewedData = [
    10, 11, 12, 13, 14,
    15, 16, 17, 50, 100
]; // 정규분포 따르지 않음
```

**기대 결과**:
- normalData: p > 0.05 (정규성 만족)
- skewedData: p < 0.05 (정규성 위배)

---

### TC-004: 등분산성 검정 - Levene's Test
**목적**: 그룹 간 분산 동일성 검정

**테스트 데이터**:
```javascript
const equalVar = {
    group1: [23.5, 24.1, 22.9, 24.5, 23.8],
    group2: [23.2, 24.3, 22.7, 24.8, 23.5],
    group3: [23.9, 24.0, 22.5, 24.2, 23.7]
};

const unequalVar = {
    group1: [23.5, 23.6, 23.4, 23.5, 23.6],
    group2: [20.1, 27.8, 22.3, 26.5, 23.0],
    group3: [30.2, 31.5, 15.8, 25.3, 22.1]
};
```

**기대 결과**:
- equalVar: p > 0.05 (등분산성 만족)
- unequalVar: p < 0.05 (등분산성 위배)

---

### TC-005: 2그룹 비교 - t-test 자동 선택
**목적**: 가정에 따른 적절한 검정 방법 자동 선택

**시나리오 1**: 정규성O, 등분산성O → Independent t-test
```javascript
const scenario1 = {
    group1: [23.5, 24.1, 22.9, 24.5, 23.8, 24.2, 23.7],
    group2: [25.2, 26.3, 25.7, 26.8, 25.5, 26.1, 25.9]
};
```

**시나리오 2**: 정규성O, 등분산성X → Welch's t-test
```javascript
const scenario2 = {
    group1: [23.5, 23.6, 23.4, 23.5, 23.6],
    group2: [28.1, 32.8, 26.3, 30.5, 27.0]
};
```

**시나리오 3**: 정규성X → Mann-Whitney U test
```javascript
const scenario3 = {
    group1: [10, 11, 12, 13, 100],
    group2: [15, 16, 17, 18, 150]
};
```

**기대 결과**:
- 각 시나리오에서 올바른 검정 방법 선택
- p-value 계산 정확도 ±0.001

---

### TC-006: 3그룹 이상 비교 - ANOVA
**목적**: One-way ANOVA 정확도 검증

**테스트 데이터** (수산과학 예제):
```javascript
// 3개 양식장 용존산소 농도 (mg/L)
const farmData = {
    farm_A: [7.2, 7.5, 7.1, 7.3, 7.4, 7.2, 7.6],
    farm_B: [6.8, 6.5, 6.9, 6.7, 6.6, 6.8, 6.4],
    farm_C: [7.8, 8.1, 7.9, 8.0, 7.7, 8.2, 7.9]
};
```

**기대 결과** (R/SPSS 비교):
```
F-statistic: 24.83
p-value: 0.000008
결론: 유의미한 차이 존재 (p < 0.05)
```

---

### TC-007: 사후분석 - Tukey HSD
**목적**: ANOVA 후 자동 사후분석 실행

**전제조건**: TC-006 데이터 사용 (p < 0.05)

**기대 결과**:
```
비교 쌍        평균차이    p-value    결과
A vs B        0.71       0.0002     유의미
A vs C       -0.64       0.0008     유의미  
B vs C       -1.36       0.0000     유의미
```

---

### TC-008: 비모수 검정 - Kruskal-Wallis
**목적**: 정규성 가정 위배 시 비모수 검정

**테스트 데이터**:
```javascript
// 어종별 기생충 감염 개체수 (비정규 분포)
const parasiteData = {
    species_A: [0, 0, 1, 0, 2, 0, 0, 15],
    species_B: [3, 5, 4, 6, 4, 5, 3, 4],
    species_C: [8, 12, 9, 10, 11, 9, 35, 10]
};
```

**기대 결과**:
- Kruskal-Wallis test 자동 선택
- H-statistic 계산
- Dunn's test 사후분석 실행

---

### TC-009: 시각화 - Box Plot
**목적**: 데이터 분포 시각화 확인

**검증 항목**:
- [ ] 상자 위치 (Q1, 중앙값, Q3)
- [ ] 수염 길이 (1.5 × IQR)
- [ ] 이상치 표시 (빨간 점)
- [ ] 그룹 라벨 표시
- [ ] 유의미한 차이 표시선 (*)

---

### TC-010: 결과 내보내기 - Excel
**목적**: Excel 파일 생성 및 내용 확인

**검증 항목**:
- [ ] 파일 생성 성공
- [ ] Sheet 1: 원본 데이터
- [ ] Sheet 2: 기술통계
- [ ] Sheet 3: 가정 검정 결과
- [ ] Sheet 4: 주 검정 결과
- [ ] Sheet 5: 사후분석 (있는 경우)
- [ ] 한글 인코딩 정상

---

## 3. 성능 테스트 케이스

### PT-001: 초기 로딩 시간
**목적**: Pyodide 로딩 시간 측정

**테스트 조건**:
- 첫 실행 (캐시 없음)
- 네트워크: 오프라인

**합격 기준**:
- 4GB RAM: < 45초
- 8GB RAM: < 30초
- 16GB RAM: < 20초

---

### PT-002: 대용량 데이터 처리
**목적**: 대량 데이터 처리 성능

**테스트 데이터**:
- 10 그룹 × 1,000개 데이터 = 10,000개

**합격 기준**:
- 계산 시간: < 5초
- 메모리 사용: < 500MB
- 브라우저 응답성 유지

---

### PT-003: 동시 분석
**목적**: 여러 분석 연속 실행

**시나리오**:
1. ANOVA 실행
2. 즉시 새 데이터로 t-test 실행
3. 다시 ANOVA 실행

**합격 기준**:
- 각 분석 독립적 실행
- 메모리 누수 없음
- 결과 혼선 없음

---

## 4. 예외 처리 테스트

### ET-001: 빈 데이터 입력
**입력**: 빈 텍스트 영역에서 [분석 시작] 클릭

**기대 결과**:
- 에러 메시지: "데이터를 입력해주세요"
- 프로그램 중단 없음

---

### ET-002: 잘못된 형식의 데이터
**입력**:
```
그룹 값
A 숫자아님
B 23.5
C @#$%
```

**기대 결과**:
- 에러 메시지: "숫자가 아닌 데이터가 포함되어 있습니다"
- 문제 위치 표시

---

### ET-003: 불충분한 데이터
**입력**: 각 그룹 1개 데이터만

**기대 결과**:
- 에러 메시지: "각 그룹은 최소 2개 이상의 데이터가 필요합니다"

---

### ET-004: 메모리 부족
**시나리오**: 100만 개 데이터 입력 시도

**기대 결과**:
- 경고 메시지: "데이터가 너무 큽니다. 최대 100,000개까지 처리 가능합니다"
- 브라우저 크래시 방지

---

## 5. 브라우저 호환성 테스트

### BT-001: Chrome
**버전**: 120+
**테스트 항목**:
- [ ] Pyodide 로딩
- [ ] 통계 계산
- [ ] 차트 렌더링
- [ ] 파일 다운로드

### BT-002: Firefox
**버전**: 120+
**테스트 항목**: BT-001과 동일

### BT-003: Edge
**버전**: 120+
**테스트 항목**: BT-001과 동일

### BT-004: Safari
**버전**: 17+
**특별 확인사항**:
- [ ] WebAssembly 지원
- [ ] 파일 다운로드 권한

---

## 6. 사용성 테스트

### UT-001: 3클릭 테스트
**목표**: 데이터 입력부터 결과까지 3클릭 이내

**시나리오**:
1. 데이터 붙여넣기 (1클릭)
2. [분석 시작] 버튼 (2클릭)
3. 결과 확인 (스크롤만)

**합격 기준**: 3클릭 이내 완료

---

### UT-002: 비IT 사용자 테스트
**대상**: 통계 지식은 있지만 IT 비전문가

**테스트 과제**:
1. 파일 실행
2. 데이터 입력
3. 분석 실행
4. 결과 해석
5. Excel 다운로드

**합격 기준**:
- 매뉴얼 없이 5분 내 완료
- 주요 기능 직관적 이해

---

## 7. 수산과학 특화 테스트

### FT-001: 어획량 데이터 분석
**데이터**: 월별 어획량 (12개월)
```javascript
const catchData = {
    month: [1,2,3,4,5,6,7,8,9,10,11,12],
    tonnage: [120,135,145,168,195,220,235,240,225,180,150,130]
};
```

**검증**:
- 회귀분석으로 트렌드 파악
- 계절성 패턴 인식

---

### FT-002: 양식장 수질 모니터링
**데이터**: DO, pH, 수온, 암모니아
```javascript
const waterQuality = {
    DO: [7.2, 7.5, 7.1, 7.3, 7.4],
    pH: [7.8, 7.9, 7.7, 8.0, 7.8],
    temp: [15.2, 15.5, 15.3, 15.4, 15.6],
    NH3: [0.02, 0.03, 0.02, 0.04, 0.03]
};
```

**검증**:
- 상관분석 매트릭스
- 다중회귀 분석

---

### FT-003: 어종별 성장률 비교
**데이터**: 3개 어종, 2개 사료
```javascript
const growthRate = {
    species_A_feed1: [2.3, 2.5, 2.4, 2.6, 2.3],
    species_A_feed2: [2.8, 3.0, 2.9, 3.1, 2.8],
    species_B_feed1: [1.8, 1.9, 1.7, 2.0, 1.8],
    species_B_feed2: [2.2, 2.4, 2.3, 2.5, 2.2],
    species_C_feed1: [3.1, 3.3, 3.2, 3.4, 3.1],
    species_C_feed2: [3.5, 3.7, 3.6, 3.8, 3.5]
};
```

**검증**:
- Two-way ANOVA (어종 × 사료)
- 상호작용 효과 검정

---

## 8. 회귀 테스트 체크리스트

### 매 버전 업데이트 시 확인
- [ ] TC-001 ~ TC-010: 기본 기능
- [ ] PT-001 ~ PT-003: 성능
- [ ] ET-001 ~ ET-004: 예외 처리
- [ ] BT-001 ~ BT-004: 브라우저 호환성
- [ ] FT-001 ~ FT-003: 수산과학 특화

---

## 9. 테스트 자동화 스크립트

### 단위 테스트
```javascript
// test.js
import { StatisticalAnalyzer } from './statistics.js';

describe('Statistical Analyzer', () => {
    let analyzer;
    
    beforeEach(() => {
        analyzer = new StatisticalAnalyzer();
    });
    
    test('TC-001: Parse tab-delimited data', () => {
        const input = "그룹\t값\nA\t23.5\nA\t24.1";
        const result = analyzer.parseData(input);
        expect(result.groups.length).toBe(1);
        expect(result.groups[0]).toEqual([23.5, 24.1]);
    });
    
    test('TC-005: Auto-select t-test', () => {
        const data = {
            group1: [23.5, 24.1, 22.9, 24.5, 23.8],
            group2: [25.2, 26.3, 25.7, 26.8, 25.5]
        };
        const result = analyzer.analyze(data);
        expect(result.main_test.test_type).toBe('Independent t-test');
    });
});
```

### E2E 테스트
```javascript
// e2e.test.js
describe('End-to-End Tests', () => {
    beforeEach(async () => {
        await page.goto('file:///path/to/통계분석도구.html');
        await page.waitForSelector('#ready-indicator', { timeout: 30000 });
    });
    
    test('Complete analysis workflow', async () => {
        // 데이터 입력
        await page.fill('#data-input', testData);
        
        // 분석 실행
        await page.click('#analyze-button');
        
        // 결과 대기
        await page.waitForSelector('.results-container');
        
        // 결과 확인
        const pValue = await page.textContent('.p-value');
        expect(parseFloat(pValue)).toBeLessThan(0.05);
    });
});
```

---

## 10. 테스트 결과 기록 양식

### 테스트 실행 기록
```markdown
## 테스트 일자: 2025-01-XX

### 환경
- OS: Windows 11
- Browser: Chrome 120.0.6099.130
- RAM: 8GB

### 결과 요약
- 통과: XX개
- 실패: X개
- 건너뜀: X개

### 실패 항목
- TC-XXX: [실패 이유]
- PT-XXX: [실패 이유]

### 조치 사항
- [수정 내용]
- [재테스트 필요 항목]

### 서명
테스터: ___________
날짜: 2025-01-XX
```

---

*마지막 업데이트: 2025-01-03*
*다음 테스트: Phase 1 완료 후*