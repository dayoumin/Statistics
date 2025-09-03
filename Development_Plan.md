# 통계 분석 웹앱 개발 계획서
**프로젝트명**: 수산과학원 통계분석 도구  
**개발 기간**: 4주 (2025년 1월 - 2월)  
**대상**: 국립수산과학원 연구자

---

## 📊 개발 개요

### 핵심 목표
- **ANOVA + 사후분석 완전 자동화**
- **단일 HTML 파일 (40MB 이내)**
- **오프라인 100% 작동**
- **3클릭 이내 결과 도출**

### 기술 스택 결정
```
통계 계산: Pyodide (scipy.stats)
시각화: Chart.js
데이터 처리: JavaScript + Python
UI: Vanilla JS + CSS Grid
```

---

## 🗓️ Phase 1: 기초 구축 (Week 1)

### Day 1-2: Pyodide 번들 생성
```javascript
// 1. Pyodide 코어 다운로드
// 2. 필수 패키지만 선택
const packages = [
    'scipy',      // 10MB
    'numpy',      // 5MB  
    'pandas',     // 8MB
    'statsmodels' // 7MB (선택적)
];

// 3. Base64 인코딩 및 HTML 임베딩
// 4. 로딩 최적화 (Web Worker 고려)
```

**체크포인트**:
- [ ] Pyodide 오프라인 로딩 성공
- [ ] scipy.stats.f_oneway() 테스트
- [ ] 30초 이내 초기 로딩

### Day 3-4: 데이터 입력 UI
```html
<!-- 데이터 입력 영역 -->
<div id="data-input">
    <!-- 옵션 1: 복사/붙여넣기 -->
    <textarea id="paste-area" 
              placeholder="엑셀에서 복사한 데이터를 붙여넣으세요">
    </textarea>
    
    <!-- 옵션 2: 파일 업로드 -->
    <input type="file" accept=".csv,.xlsx">
    
    <!-- 옵션 3: 직접 입력 테이블 -->
    <table id="input-table" contenteditable="true">
</div>
```

**데이터 파싱 로직**:
```javascript
function parseData(input) {
    // TSV/CSV 자동 감지
    // 그룹 컬럼 식별
    // 숫자 데이터 검증
    // Python 형식으로 변환
}
```

### Day 5: 기본 UI/UX 프레임워크
```css
/* 모바일 반응형 디자인 */
.container {
    display: grid;
    grid-template-areas:
        "header"
        "input"
        "analysis"
        "results";
}

/* 진행 상태 표시 */
.progress-bar {
    width: 0%;
    transition: width 0.5s;
}
```

---

## 🔬 Phase 2: 핵심 통계 기능 (Week 2 - 2.5)

### Day 6-7: 가정 검정 구현
```python
# Pyodide 내부 실행 코드
def check_assumptions(groups):
    """정규성과 등분산성 자동 검정"""
    
    # 1. 정규성 검정
    normality_tests = []
    for group in groups:
        n = len(group)
        if n < 50:
            stat, p = stats.shapiro(group)
            test_name = "Shapiro-Wilk"
        else:
            stat, p = stats.kstest(group, 'norm', 
                                  args=(np.mean(group), np.std(group)))
            test_name = "Kolmogorov-Smirnov"
        
        normality_tests.append({
            'test': test_name,
            'statistic': stat,
            'p_value': p,
            'is_normal': p > 0.05
        })
    
    # 2. 등분산성 검정
    stat_levene, p_levene = stats.levene(*groups)
    stat_bartlett, p_bartlett = stats.bartlett(*groups)
    
    return {
        'normality': normality_tests,
        'homogeneity': {
            'levene': {'stat': stat_levene, 'p': p_levene},
            'bartlett': {'stat': stat_bartlett, 'p': p_bartlett}
        }
    }
```

### Day 8-9: ANOVA 구현
```python
def perform_anova(groups, assumptions):
    """ANOVA 또는 대안 검정 자동 선택"""
    
    all_normal = all(test['is_normal'] for test in assumptions['normality'])
    equal_var = assumptions['homogeneity']['levene']['p'] > 0.05
    
    if all_normal and equal_var:
        # Parametric ANOVA
        f_stat, p_value = stats.f_oneway(*groups)
        test_type = "One-way ANOVA"
        
        # 효과 크기 계산
        df_between = len(groups) - 1
        df_within = sum(len(g) - 1 for g in groups)
        eta_squared = (f_stat * df_between) / (f_stat * df_between + df_within)
        
    elif all_normal and not equal_var:
        # Welch's ANOVA
        f_stat, p_value = stats.f_oneway(*groups)  # scipy 1.9+에서 Welch 옵션
        test_type = "Welch's ANOVA"
        eta_squared = None
        
    else:
        # Non-parametric
        h_stat, p_value = stats.kruskal(*groups)
        test_type = "Kruskal-Wallis"
        f_stat = h_stat
        eta_squared = None
    
    return {
        'test': test_type,
        'statistic': f_stat,
        'p_value': p_value,
        'effect_size': eta_squared,
        'significant': p_value < 0.05
    }
```

### Day 10-12: 사후분석 구현
```python
def post_hoc_analysis(groups, test_type):
    """자동 사후분석 선택 및 실행"""
    
    if test_type == "One-way ANOVA":
        # Tukey HSD
        from scipy.stats import tukey_hsd
        result = tukey_hsd(*groups)
        
        # Bonferroni도 계산
        from itertools import combinations
        pairs = list(combinations(range(len(groups)), 2))
        bonferroni_alpha = 0.05 / len(pairs)
        
        return {
            'method': 'Tukey HSD',
            'pvalues': result.pvalue,
            'confidence_intervals': result.confidence_interval(),
            'bonferroni_alpha': bonferroni_alpha
        }
        
    elif test_type == "Kruskal-Wallis":
        # Dunn's test 구현
        from scipy.stats import rankdata
        
        # 전체 순위 계산
        all_data = np.concatenate(groups)
        all_ranks = rankdata(all_data)
        
        # 그룹별 평균 순위
        group_ranks = []
        start = 0
        for group in groups:
            end = start + len(group)
            group_ranks.append(np.mean(all_ranks[start:end]))
            start = end
        
        # Dunn's test 수행
        # ... (상세 구현)
        
    return post_hoc_results
```

---

## 📈 Phase 3: 시각화 및 결과 (Week 3)

### Day 13-14: Chart.js 통합
```javascript
// Box Plot with significance markers
function createBoxPlot(data, postHocResults) {
    const ctx = document.getElementById('boxplot').getContext('2d');
    
    new Chart(ctx, {
        type: 'boxplot',  // chartjs-chart-box-and-violin-plot 플러그인
        data: {
            labels: data.groupNames,
            datasets: [{
                label: 'Distribution',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                data: data.groups.map(calculateBoxplotStats),
                outlierColor: 'red'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                // 유의미한 차이 표시
                annotation: {
                    annotations: createSignificanceLines(postHocResults)
                }
            }
        }
    });
}

// 평균 ± 95% CI 바차트
function createMeanChart(statistics) {
    const means = statistics.map(s => s.mean);
    const errors = statistics.map(s => s.ci95);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: [{
                data: means,
                errorBars: errors  // chartjs-plugin-error-bars
            }]
        }
    });
}
```

### Day 15-16: 결과 해석 엔진
```javascript
function generateInterpretation(results) {
    const interpretation = {
        korean: [],
        english: []
    };
    
    // 1. 가정 검정 해석
    if (results.assumptions.all_normal) {
        interpretation.korean.push(
            "✓ 모든 그룹이 정규분포를 따릅니다."
        );
    } else {
        interpretation.korean.push(
            "⚠ 일부 그룹이 정규분포를 따르지 않아 비모수 검정을 사용했습니다."
        );
    }
    
    // 2. 주 검정 결과 해석
    if (results.anova.p_value < 0.05) {
        interpretation.korean.push(
            `✓ 그룹 간 유의미한 차이가 있습니다 (p = ${results.anova.p_value.toFixed(4)})`
        );
        
        // 3. 사후분석 해석
        const sigPairs = results.postHoc.filter(p => p.pvalue < 0.05);
        interpretation.korean.push(
            `✓ ${sigPairs.length}개 그룹 쌍에서 유의미한 차이 발견:`
        );
        
        sigPairs.forEach(pair => {
            interpretation.korean.push(
                `  - ${pair.group1} vs ${pair.group2}: p = ${pair.pvalue.toFixed(4)}`
            );
        });
    }
    
    // 4. 효과 크기 해석
    if (results.anova.effect_size) {
        const eta = results.anova.effect_size;
        let magnitude = eta < 0.06 ? "작은" : eta < 0.14 ? "중간" : "큰";
        interpretation.korean.push(
            `📊 효과 크기: η² = ${eta.toFixed(3)} (${magnitude} 효과)`
        );
    }
    
    return interpretation;
}
```

### Day 17-18: 결과 내보내기
```javascript
// Excel 파일 생성 (SheetJS 사용)
function exportToExcel(results) {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: 원본 데이터
    const ws1 = XLSX.utils.aoa_to_sheet(results.rawData);
    XLSX.utils.book_append_sheet(wb, ws1, "원본데이터");
    
    // Sheet 2: 통계 결과
    const ws2 = XLSX.utils.json_to_sheet([
        { 검정방법: results.test, F통계량: results.f_stat, p값: results.p_value }
    ]);
    XLSX.utils.book_append_sheet(wb, ws2, "통계결과");
    
    // Sheet 3: 사후분석
    if (results.postHoc) {
        const ws3 = XLSX.utils.json_to_sheet(results.postHoc);
        XLSX.utils.book_append_sheet(wb, ws3, "사후분석");
    }
    
    XLSX.writeFile(wb, "통계분석결과.xlsx");
}

// PDF 보고서 생성 (jsPDF 사용)
function exportToPDF(results, charts) {
    const doc = new jsPDF();
    
    // 제목
    doc.setFontSize(20);
    doc.text('통계 분석 보고서', 20, 20);
    
    // 결과 요약
    doc.setFontSize(12);
    doc.text(results.interpretation.korean.join('\n'), 20, 40);
    
    // 차트 이미지 추가
    charts.forEach((chart, i) => {
        const imgData = chart.toBase64Image();
        doc.addImage(imgData, 'PNG', 20, 80 + (i * 60), 170, 50);
    });
    
    doc.save('통계분석보고서.pdf');
}
```

---

## 🚀 Phase 4: 최적화 및 배포 (Week 4)

### Day 19-20: 성능 최적화
```javascript
// 1. Web Worker로 무거운 계산 분리
const worker = new Worker('statistics-worker.js');

// 2. 점진적 로딩
async function loadPyodideProgressive() {
    // 코어 먼저 로드
    await loadPyodide({ indexURL: "pyodide/" });
    
    // 필수 패키지 순차 로드
    await pyodide.loadPackage("numpy");
    updateProgress(30);
    
    await pyodide.loadPackage("scipy");
    updateProgress(60);
    
    // 선택적 패키지는 나중에
    setTimeout(() => {
        pyodide.loadPackage("pandas");
    }, 1000);
}

// 3. 결과 캐싱
const cache = new Map();
function memoizedANOVA(data) {
    const key = JSON.stringify(data);
    if (cache.has(key)) return cache.get(key);
    
    const result = performANOVA(data);
    cache.set(key, result);
    return result;
}
```

### Day 21-22: 테스트
```javascript
// 테스트 시나리오
const testCases = [
    {
        name: "정규분포 3그룹",
        data: generateNormalGroups(3, 30),
        expected: "One-way ANOVA"
    },
    {
        name: "비정규분포 4그룹",
        data: generateSkewedGroups(4, 25),
        expected: "Kruskal-Wallis"
    },
    {
        name: "불균형 데이터",
        data: [[1,2,3], [4,5,6,7,8,9,10], [11,12]],
        expected: "Welch's ANOVA"
    }
];

// 브라우저 호환성 테스트
const browsers = ['Chrome', 'Firefox', 'Edge', 'Safari'];
browsers.forEach(browser => {
    console.log(`Testing on ${browser}...`);
    runAllTests();
});
```

### Day 23-24: 최종 번들링
```bash
# 1. HTML 파일 생성
python bundle_pyodide.py

# 2. 압축 및 최적화
html-minifier index.html -o 통계분석도구.html \
    --collapse-whitespace \
    --remove-comments \
    --minify-js \
    --minify-css

# 3. 파일 크기 확인
du -h 통계분석도구.html
# Expected: 35-40MB

# 4. 테스트
python -m http.server 8000
# 브라우저에서 localhost:8000/통계분석도구.html 접속
```

---

## 📋 체크리스트

### 필수 기능 완성도
- [ ] 데이터 입력 3가지 방법 모두 작동
- [ ] 2그룹 t-test 정확도 100%
- [ ] 3그룹 이상 ANOVA 정확도 100%
- [ ] 사후분석 자동 실행
- [ ] 한글 결과 해석
- [ ] Excel/PDF 내보내기

### 성능 목표
- [ ] 초기 로딩 < 30초
- [ ] 1000행 데이터 처리 < 5초
- [ ] 파일 크기 < 40MB

### 사용성
- [ ] 3클릭 이내 결과 확인
- [ ] 모바일 화면 지원
- [ ] 오프라인 100% 작동

---

## 🔄 리스크 관리

### 잠재적 문제점과 대응
1. **Pyodide 로딩 실패**
   - 대안: 사전 빌드된 WASM 파일 직접 임베딩
   
2. **파일 크기 초과**
   - 대안: 핵심 기능만 포함한 Lite 버전 제공
   
3. **브라우저 호환성**
   - 대안: Polyfill 추가 또는 최소 요구사항 명시

4. **메모리 부족**
   - 대안: 청크 단위 처리, 데이터 크기 제한

---

## 📝 일일 진행 상황 체크

```markdown
## Week 1
- [ ] Day 1: Pyodide 번들 생성 시작
- [ ] Day 2: Pyodide 오프라인 테스트
- [ ] Day 3: 데이터 입력 UI 개발
- [ ] Day 4: 데이터 파싱 로직
- [ ] Day 5: 기본 UI 프레임워크

## Week 2
- [ ] Day 6: 정규성 검정 구현
- [ ] Day 7: 등분산성 검정 구현
- [ ] Day 8: ANOVA 기본 구현
- [ ] Day 9: ANOVA 검증
- [ ] Day 10: Tukey HSD 구현
- [ ] Day 11: Bonferroni 구현
- [ ] Day 12: 비모수 사후분석

## Week 3
- [ ] Day 13: Box plot 구현
- [ ] Day 14: 시각화 완성
- [ ] Day 15: 결과 해석 엔진
- [ ] Day 16: 한글화
- [ ] Day 17: Excel 내보내기
- [ ] Day 18: PDF 생성

## Week 4
- [ ] Day 19: 성능 최적화
- [ ] Day 20: 로딩 속도 개선
- [ ] Day 21: 통합 테스트
- [ ] Day 22: 버그 수정
- [ ] Day 23: 최종 번들링
- [ ] Day 24: 배포 및 문서화
```

---

*마지막 업데이트: 2025-01-03*
*다음 마일스톤: Week 1 완료 (2025-01-10)*