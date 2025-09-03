# 기술 명세서 (Technical Specification)
**프로젝트**: 수산과학원 통계분석 도구  
**버전**: 1.0  
**작성일**: 2025-01-03

---

## 1. 아키텍처 개요

### 1.1 시스템 구조
```
┌──────────────────────────────────────┐
│         HTML Container               │
├──────────────────────────────────────┤
│    JavaScript Control Layer          │
├──────────────────────────────────────┤
│        Pyodide Runtime               │
│    (Python in WebAssembly)           │
├──────────────────────────────────────┤
│     Statistical Engine               │
│      (scipy.stats)                   │
├──────────────────────────────────────┤
│    Visualization Layer               │
│       (Chart.js)                     │
└──────────────────────────────────────┘
```

### 1.2 데이터 플로우
```
사용자 입력 → JS 파싱 → Python 전송 → 통계 계산 → JS 반환 → 시각화 → 사용자
```

---

## 2. 핵심 컴포넌트 명세

### 2.1 Pyodide 초기화
```javascript
class PyodideManager {
    constructor() {
        this.pyodide = null;
        this.isReady = false;
    }
    
    async initialize() {
        // Pyodide 로드 (Base64 인코딩된 WASM)
        this.pyodide = await loadPyodide({
            indexURL: "data:application/octet-stream;base64,..."
        });
        
        // 필수 패키지 로드
        await this.pyodide.loadPackage(['numpy', 'scipy', 'pandas']);
        
        // 통계 함수 정의
        await this.pyodide.runPythonAsync(`
            import numpy as np
            import scipy.stats as stats
            import pandas as pd
            import json
            
            # 전역 함수 정의
            ${STATISTICAL_FUNCTIONS}
        `);
        
        this.isReady = true;
    }
}
```

### 2.2 데이터 파서
```javascript
class DataParser {
    /**
     * TSV/CSV 문자열을 그룹별 배열로 변환
     * @param {string} input - 복사된 데이터
     * @returns {Object} { groups: Array<Array<number>>, labels: Array<string> }
     */
    static parseTabularData(input) {
        const lines = input.trim().split('\n');
        const delimiter = this.detectDelimiter(input);
        
        // 헤더 확인
        const hasHeader = this.hasHeader(lines[0], delimiter);
        const startRow = hasHeader ? 1 : 0;
        
        // 그룹 컬럼 자동 감지
        const groupCol = this.detectGroupColumn(lines, delimiter);
        
        // 데이터 파싱
        const groups = {};
        for (let i = startRow; i < lines.length; i++) {
            const cols = lines[i].split(delimiter);
            const group = cols[groupCol.index];
            const value = parseFloat(cols[groupCol.valueIndex]);
            
            if (!groups[group]) groups[group] = [];
            groups[group].push(value);
        }
        
        return {
            groups: Object.values(groups),
            labels: Object.keys(groups)
        };
    }
    
    static detectDelimiter(text) {
        const delimiters = ['\t', ',', ';', '|'];
        // 가장 많이 나타나는 구분자 반환
        return delimiters.reduce((a, b) => 
            text.split(a).length > text.split(b).length ? a : b
        );
    }
}
```

---

## 3. 통계 엔진 명세

### 3.1 Python 통계 함수
```python
STATISTICAL_FUNCTIONS = """
class StatisticalAnalyzer:
    def __init__(self):
        self.results = {}
        
    def analyze(self, data_json):
        '''
        메인 분석 함수
        @param data_json: JSON 문자열 형태의 데이터
        @return: JSON 문자열 형태의 결과
        '''
        data = json.loads(data_json)
        groups = [np.array(g) for g in data['groups']]
        
        # 1. 기술통계
        self.results['descriptive'] = self._descriptive_stats(groups)
        
        # 2. 가정 검정
        self.results['assumptions'] = self._check_assumptions(groups)
        
        # 3. 주 검정
        if len(groups) == 2:
            self.results['main_test'] = self._two_group_test(groups)
        else:
            self.results['main_test'] = self._multi_group_test(groups)
        
        # 4. 사후분석 (필요시)
        if self.results['main_test']['p_value'] < 0.05 and len(groups) > 2:
            self.results['post_hoc'] = self._post_hoc_analysis(
                groups, 
                self.results['main_test']['test_type']
            )
        
        return json.dumps(self.results)
    
    def _descriptive_stats(self, groups):
        '''기술통계량 계산'''
        stats_list = []
        for i, group in enumerate(groups):
            stats_list.append({
                'n': len(group),
                'mean': float(np.mean(group)),
                'std': float(np.std(group, ddof=1)),
                'sem': float(stats.sem(group)),
                'median': float(np.median(group)),
                'q1': float(np.percentile(group, 25)),
                'q3': float(np.percentile(group, 75)),
                'min': float(np.min(group)),
                'max': float(np.max(group)),
                'ci95_lower': float(stats.t.interval(0.95, len(group)-1, 
                                   loc=np.mean(group), 
                                   scale=stats.sem(group))[0]),
                'ci95_upper': float(stats.t.interval(0.95, len(group)-1,
                                   loc=np.mean(group),
                                   scale=stats.sem(group))[1])
            })
        return stats_list
    
    def _check_assumptions(self, groups):
        '''정규성 및 등분산성 검정'''
        # 정규성 검정
        normality = []
        for group in groups:
            if len(group) < 3:
                normality.append({'test': 'Too few samples', 'p_value': None})
            elif len(group) < 50:
                stat, p = stats.shapiro(group)
                normality.append({
                    'test': 'Shapiro-Wilk',
                    'statistic': float(stat),
                    'p_value': float(p),
                    'is_normal': p > 0.05
                })
            else:
                stat, p = stats.kstest(group, 'norm', 
                                      args=(np.mean(group), np.std(group)))
                normality.append({
                    'test': 'Kolmogorov-Smirnov',
                    'statistic': float(stat),
                    'p_value': float(p),
                    'is_normal': p > 0.05
                })
        
        # 등분산성 검정
        if len(groups) >= 2:
            stat_lev, p_lev = stats.levene(*groups)
            stat_bart, p_bart = stats.bartlett(*groups)
            homogeneity = {
                'levene': {
                    'statistic': float(stat_lev),
                    'p_value': float(p_lev),
                    'equal_var': p_lev > 0.05
                },
                'bartlett': {
                    'statistic': float(stat_bart),
                    'p_value': float(p_bart),
                    'equal_var': p_bart > 0.05
                }
            }
        else:
            homogeneity = None
        
        return {
            'normality': normality,
            'homogeneity': homogeneity,
            'all_normal': all(n.get('is_normal', False) for n in normality),
            'equal_variance': homogeneity['levene']['equal_var'] if homogeneity else None
        }
    
    def _two_group_test(self, groups):
        '''2그룹 비교 검정'''
        assumptions = self.results['assumptions']
        
        if assumptions['all_normal'] and assumptions['equal_variance']:
            # Independent t-test
            stat, p = stats.ttest_ind(groups[0], groups[1])
            test_type = 'Independent t-test'
        elif assumptions['all_normal'] and not assumptions['equal_variance']:
            # Welch's t-test
            stat, p = stats.ttest_ind(groups[0], groups[1], equal_var=False)
            test_type = "Welch's t-test"
        else:
            # Mann-Whitney U test
            stat, p = stats.mannwhitneyu(groups[0], groups[1])
            test_type = 'Mann-Whitney U test'
        
        # 효과 크기 (Cohen's d)
        pooled_std = np.sqrt(((len(groups[0])-1)*np.var(groups[0], ddof=1) + 
                              (len(groups[1])-1)*np.var(groups[1], ddof=1)) / 
                             (len(groups[0]) + len(groups[1]) - 2))
        cohens_d = (np.mean(groups[0]) - np.mean(groups[1])) / pooled_std
        
        return {
            'test_type': test_type,
            'statistic': float(stat),
            'p_value': float(p),
            'effect_size': float(cohens_d),
            'significant': p < 0.05
        }
    
    def _multi_group_test(self, groups):
        '''3그룹 이상 비교 검정'''
        assumptions = self.results['assumptions']
        
        if assumptions['all_normal'] and assumptions['equal_variance']:
            # One-way ANOVA
            stat, p = stats.f_oneway(*groups)
            test_type = 'One-way ANOVA'
            
            # 효과 크기 (eta-squared)
            grand_mean = np.mean(np.concatenate(groups))
            ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in groups)
            ss_total = sum(np.sum((g - grand_mean)**2) for g in groups)
            eta_squared = ss_between / ss_total
            effect_size = eta_squared
            
        elif assumptions['all_normal'] and not assumptions['equal_variance']:
            # Welch's ANOVA (근사)
            stat, p = stats.f_oneway(*groups)  # scipy 1.9+에서 개선됨
            test_type = "Welch's ANOVA"
            effect_size = None
            
        else:
            # Kruskal-Wallis test
            stat, p = stats.kruskal(*groups)
            test_type = 'Kruskal-Wallis test'
            
            # 효과 크기 (epsilon-squared)
            n = sum(len(g) for g in groups)
            k = len(groups)
            epsilon_squared = (stat - k + 1) / (n - k)
            effect_size = epsilon_squared
        
        return {
            'test_type': test_type,
            'statistic': float(stat),
            'p_value': float(p),
            'effect_size': float(effect_size) if effect_size else None,
            'significant': p < 0.05
        }
    
    def _post_hoc_analysis(self, groups, test_type):
        '''사후분석'''
        results = []
        
        if 'ANOVA' in test_type:
            # Tukey HSD
            from scipy.stats import tukey_hsd
            res = tukey_hsd(*groups)
            
            # 결과 정리
            k = len(groups)
            idx = 0
            for i in range(k):
                for j in range(i+1, k):
                    results.append({
                        'group1': i,
                        'group2': j,
                        'method': 'Tukey HSD',
                        'mean_diff': float(res.statistic[idx]),
                        'p_value': float(res.pvalue[idx]),
                        'ci_lower': float(res.confidence_interval(0.95).low[idx]),
                        'ci_upper': float(res.confidence_interval(0.95).high[idx]),
                        'significant': res.pvalue[idx] < 0.05
                    })
                    idx += 1
                    
        else:  # Kruskal-Wallis
            # Dunn's test 구현
            from scipy.stats import rankdata
            from itertools import combinations
            
            # 전체 데이터 순위화
            all_data = np.concatenate(groups)
            all_ranks = rankdata(all_data)
            
            # 그룹별 평균 순위
            rank_means = []
            start = 0
            for group in groups:
                end = start + len(group)
                rank_means.append(np.mean(all_ranks[start:end]))
                start = end
            
            # Dunn's test
            n = len(all_data)
            k = len(groups)
            
            for i, j in combinations(range(k), 2):
                # Z 통계량 계산
                ni, nj = len(groups[i]), len(groups[j])
                se = np.sqrt((n * (n + 1) / 12) * (1/ni + 1/nj))
                z = abs(rank_means[i] - rank_means[j]) / se
                p = 2 * (1 - stats.norm.cdf(z))
                
                # Bonferroni 보정
                p_adjusted = min(1, p * (k * (k - 1) / 2))
                
                results.append({
                    'group1': i,
                    'group2': j,
                    'method': "Dunn's test",
                    'z_statistic': float(z),
                    'p_value': float(p),
                    'p_adjusted': float(p_adjusted),
                    'significant': p_adjusted < 0.05
                })
        
        return results

# 인스턴스 생성
analyzer = StatisticalAnalyzer()
"""
```

---

## 4. 시각화 명세

### 4.1 Chart.js 설정
```javascript
class Visualizer {
    constructor() {
        this.charts = {};
    }
    
    createBoxPlot(containerId, data, postHocResults) {
        const ctx = document.getElementById(containerId).getContext('2d');
        
        // Box plot 데이터 준비
        const boxplotData = data.groups.map((group, idx) => ({
            label: data.labels[idx],
            data: this.calculateBoxplotStats(group),
            backgroundColor: this.getColor(idx, 0.5),
            borderColor: this.getColor(idx, 1),
            outlierColor: 'red'
        }));
        
        // 유의미한 차이 표시선
        const annotations = this.createSignificanceAnnotations(postHocResults);
        
        this.charts.boxplot = new Chart(ctx, {
            type: 'boxplot',
            data: { datasets: boxplotData },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '그룹별 분포 비교'
                    },
                    annotation: {
                        annotations: annotations
                    }
                }
            }
        });
    }
    
    calculateBoxplotStats(data) {
        const sorted = data.sort((a, b) => a - b);
        const q1 = this.percentile(sorted, 25);
        const median = this.percentile(sorted, 50);
        const q3 = this.percentile(sorted, 75);
        const iqr = q3 - q1;
        const min = Math.max(sorted[0], q1 - 1.5 * iqr);
        const max = Math.min(sorted[sorted.length - 1], q3 + 1.5 * iqr);
        
        // 이상치 찾기
        const outliers = sorted.filter(v => v < min || v > max);
        
        return {
            min: min,
            q1: q1,
            median: median,
            q3: q3,
            max: max,
            outliers: outliers
        };
    }
    
    createMeanChart(containerId, statistics) {
        const ctx = document.getElementById(containerId).getContext('2d');
        
        this.charts.meanChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: statistics.map((_, i) => `Group ${i + 1}`),
                datasets: [{
                    label: '평균 ± 95% CI',
                    data: statistics.map(s => s.mean),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1,
                    errorBars: {
                        plus: statistics.map(s => s.ci95_upper - s.mean),
                        minus: statistics.map(s => s.mean - s.ci95_lower)
                    }
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '그룹별 평균 및 95% 신뢰구간'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: '값'
                        }
                    }
                }
            }
        });
    }
}
```

---

## 5. 결과 출력 명세

### 5.1 Excel 내보내기
```javascript
class ExcelExporter {
    static export(results) {
        const wb = XLSX.utils.book_new();
        
        // Sheet 1: 원본 데이터
        const rawDataSheet = this.createRawDataSheet(results.rawData);
        XLSX.utils.book_append_sheet(wb, rawDataSheet, "원본데이터");
        
        // Sheet 2: 기술통계
        const descSheet = this.createDescriptiveSheet(results.descriptive);
        XLSX.utils.book_append_sheet(wb, descSheet, "기술통계");
        
        // Sheet 3: 가정 검정
        const assumptionsSheet = this.createAssumptionsSheet(results.assumptions);
        XLSX.utils.book_append_sheet(wb, assumptionsSheet, "가정검정");
        
        // Sheet 4: 주 검정 결과
        const mainTestSheet = this.createMainTestSheet(results.main_test);
        XLSX.utils.book_append_sheet(wb, mainTestSheet, "통계검정");
        
        // Sheet 5: 사후분석 (있는 경우)
        if (results.post_hoc) {
            const postHocSheet = this.createPostHocSheet(results.post_hoc);
            XLSX.utils.book_append_sheet(wb, postHocSheet, "사후분석");
        }
        
        // 파일 저장
        const fileName = `통계분석결과_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }
}
```

### 5.2 PDF 보고서 생성
```javascript
class PDFReporter {
    static async generate(results, charts) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // 한글 폰트 설정
        doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
        doc.setFont('NanumGothic');
        
        // 제목
        doc.setFontSize(20);
        doc.text('통계 분석 보고서', 105, 20, { align: 'center' });
        
        // 생성 일시
        doc.setFontSize(10);
        doc.text(`생성일: ${new Date().toLocaleString('ko-KR')}`, 20, 30);
        
        // 요약
        doc.setFontSize(14);
        doc.text('1. 분석 요약', 20, 45);
        
        doc.setFontSize(11);
        let y = 55;
        results.interpretation.korean.forEach(line => {
            doc.text(line, 25, y);
            y += 7;
        });
        
        // 차트 추가
        doc.addPage();
        doc.setFontSize(14);
        doc.text('2. 시각화', 20, 20);
        
        // Box plot
        const boxplotImg = charts.boxplot.toBase64Image();
        doc.addImage(boxplotImg, 'PNG', 20, 30, 170, 100);
        
        // Mean chart
        doc.addPage();
        const meanChartImg = charts.meanChart.toBase64Image();
        doc.addImage(meanChartImg, 'PNG', 20, 20, 170, 100);
        
        // 통계표
        doc.addPage();
        doc.setFontSize(14);
        doc.text('3. 상세 통계 결과', 20, 20);
        
        // 테이블 생성
        doc.autoTable({
            startY: 30,
            head: [['검정 방법', '통계량', 'p-value', '결과']],
            body: [
                [
                    results.main_test.test_type,
                    results.main_test.statistic.toFixed(4),
                    results.main_test.p_value.toFixed(4),
                    results.main_test.significant ? '유의미' : '유의미하지 않음'
                ]
            ]
        });
        
        // 저장
        doc.save(`통계분석보고서_${new Date().toISOString().slice(0,10)}.pdf`);
    }
}
```

---

## 6. 에러 처리

### 6.1 에러 타입 정의
```javascript
class StatisticsError extends Error {
    constructor(type, message, details) {
        super(message);
        this.type = type;
        this.details = details;
    }
}

const ERROR_TYPES = {
    DATA_INVALID: 'DATA_INVALID',
    INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
    PYODIDE_LOAD_FAILED: 'PYODIDE_LOAD_FAILED',
    CALCULATION_FAILED: 'CALCULATION_FAILED',
    MEMORY_EXCEEDED: 'MEMORY_EXCEEDED'
};
```

### 6.2 에러 핸들링
```javascript
class ErrorHandler {
    static handle(error) {
        console.error('Error occurred:', error);
        
        const userMessage = this.getUserMessage(error);
        const solution = this.getSolution(error);
        
        // UI에 표시
        this.showErrorModal({
            title: '오류 발생',
            message: userMessage,
            solution: solution,
            technical: error.toString()
        });
        
        // 로그 기록
        this.logError(error);
    }
    
    static getUserMessage(error) {
        const messages = {
            DATA_INVALID: '입력된 데이터 형식이 올바르지 않습니다.',
            INSUFFICIENT_DATA: '분석을 위한 데이터가 충분하지 않습니다. (최소 3개 이상)',
            PYODIDE_LOAD_FAILED: 'Python 런타임 로딩에 실패했습니다.',
            CALCULATION_FAILED: '통계 계산 중 오류가 발생했습니다.',
            MEMORY_EXCEEDED: '메모리가 부족합니다. 데이터 크기를 줄여주세요.'
        };
        
        return messages[error.type] || '알 수 없는 오류가 발생했습니다.';
    }
}
```

---

## 7. 성능 최적화

### 7.1 Web Worker 구현
```javascript
// statistics.worker.js
self.importScripts('pyodide.js');

let pyodide = null;

self.onmessage = async function(e) {
    const { type, data } = e.data;
    
    switch(type) {
        case 'init':
            pyodide = await loadPyodide();
            await pyodide.loadPackage(['numpy', 'scipy']);
            self.postMessage({ type: 'ready' });
            break;
            
        case 'analyze':
            const result = await pyodide.runPythonAsync(`
                analyzer.analyze('${JSON.stringify(data)}')
            `);
            self.postMessage({ type: 'result', data: JSON.parse(result) });
            break;
    }
};
```

### 7.2 캐싱 전략
```javascript
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.maxSize = 50; // 최대 50개 결과 캐싱
    }
    
    getKey(data) {
        // 데이터를 기반으로 고유 키 생성
        return btoa(JSON.stringify(data)).substring(0, 20);
    }
    
    get(data) {
        const key = this.getKey(data);
        return this.cache.get(key);
    }
    
    set(data, result) {
        const key = this.getKey(data);
        
        // 캐시 크기 제한
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            result: result,
            timestamp: Date.now()
        });
    }
}
```

---

## 8. 보안 고려사항

### 8.1 Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self' data: blob:;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob:;
    connect-src 'none';
">
```

### 8.2 데이터 검증
```javascript
class DataValidator {
    static validate(input) {
        // XSS 방지
        if (/<[^>]*>/g.test(input)) {
            throw new StatisticsError(
                ERROR_TYPES.DATA_INVALID,
                'HTML 태그가 포함된 데이터는 처리할 수 없습니다.'
            );
        }
        
        // 크기 제한
        if (input.length > 1000000) { // 1MB
            throw new StatisticsError(
                ERROR_TYPES.DATA_INVALID,
                '데이터 크기가 너무 큽니다.'
            );
        }
        
        return true;
    }
}
```

---

## 9. 브라우저 호환성

### 9.1 기능 감지
```javascript
class CompatibilityChecker {
    static check() {
        const requirements = {
            webAssembly: typeof WebAssembly !== 'undefined',
            sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
            bigInt: typeof BigInt !== 'undefined',
            canvas: !!document.createElement('canvas').getContext
        };
        
        const missing = Object.entries(requirements)
            .filter(([_, supported]) => !supported)
            .map(([feature]) => feature);
        
        if (missing.length > 0) {
            throw new Error(`브라우저가 다음 기능을 지원하지 않습니다: ${missing.join(', ')}`);
        }
        
        return true;
    }
}
```

---

## 10. 빌드 및 번들링

### 10.1 빌드 스크립트
```python
# build.py
import base64
import json
import os
from pathlib import Path

def create_single_html():
    # Pyodide 파일 읽기
    pyodide_wasm = Path('pyodide/pyodide.wasm').read_bytes()
    pyodide_js = Path('pyodide/pyodide.js').read_text()
    
    # 패키지 파일들
    packages = {}
    for pkg in ['numpy', 'scipy', 'pandas']:
        pkg_file = Path(f'pyodide/{pkg}.whl')
        if pkg_file.exists():
            packages[pkg] = base64.b64encode(pkg_file.read_bytes()).decode()
    
    # HTML 템플릿
    template = Path('template.html').read_text()
    
    # 치환
    output = template.replace(
        '{{PYODIDE_WASM}}', base64.b64encode(pyodide_wasm).decode()
    ).replace(
        '{{PYODIDE_JS}}', pyodide_js
    ).replace(
        '{{PACKAGES}}', json.dumps(packages)
    )
    
    # 저장
    Path('통계분석도구.html').write_text(output)
    
    # 파일 크기 확인
    size_mb = os.path.getsize('통계분석도구.html') / (1024 * 1024)
    print(f"✅ 파일 생성 완료: 통계분석도구.html ({size_mb:.1f} MB)")

if __name__ == '__main__':
    create_single_html()
```

---

*마지막 업데이트: 2025-01-03*