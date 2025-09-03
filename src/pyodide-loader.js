/**
 * Pyodide 오프라인 로더
 * IndexedDB 캐싱과 CDN 폴백을 지원하는 Pyodide 로더
 */

class PyodideLoader {
    constructor() {
        this.pyodide = null;
        this.isReady = false;
        this.loadingProgress = 0;
        this.progressCallback = null;
        
        // Pyodide 설정
        this.config = {
            version: '0.24.1',
            cdnUrl: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
            packages: ['numpy', 'scipy', 'pandas', 'micropip'],
            cacheDbName: 'pyodide-cache',
            cacheStoreName: 'pyodide-files',
            cacheVersion: 1
        };
    }

    /**
     * 진행 상황 업데이트
     */
    updateProgress(step, progress, message) {
        this.loadingProgress = progress;
        if (this.progressCallback) {
            this.progressCallback({ step, progress, message });
        }
    }

    /**
     * IndexedDB 초기화
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.cacheDbName, this.config.cacheVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.config.cacheStoreName)) {
                    db.createObjectStore(this.config.cacheStoreName);
                }
            };
        });
    }

    /**
     * 캐시에서 파일 로드
     */
    async loadFromCache(key) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction([this.config.cacheStoreName], 'readonly');
            const store = transaction.objectStore(this.config.cacheStoreName);
            
            return new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('캐시 로드 실패:', error);
            return null;
        }
    }

    /**
     * 캐시에 파일 저장
     */
    async saveToCache(key, data) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction([this.config.cacheStoreName], 'readwrite');
            const store = transaction.objectStore(this.config.cacheStoreName);
            
            return new Promise((resolve, reject) => {
                const request = store.put(data, key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('캐시 저장 실패:', error);
        }
    }

    /**
     * CDN에서 파일 다운로드
     */
    async downloadFromCDN(filename) {
        const url = this.config.cdnUrl + filename;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/wasm')) {
                return await response.arrayBuffer();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error(`다운로드 실패 ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Pyodide 코어 파일 로드
     */
    async loadPyodideCore() {
        this.updateProgress('core', 5, 'Pyodide 코어 확인 중...');
        
        // 필요한 파일 목록
        const coreFiles = [
            'pyodide.js',
            'pyodide.asm.wasm',
            'pyodide.asm.js',
            'pyodide-lock.json'
        ];
        
        const loadedFiles = {};
        let loadedFromCache = true;
        
        // 먼저 캐시에서 로드 시도
        for (const filename of coreFiles) {
            const cached = await this.loadFromCache(filename);
            if (cached) {
                loadedFiles[filename] = cached;
                console.log(`캐시에서 로드: ${filename}`);
            } else {
                loadedFromCache = false;
                break;
            }
        }
        
        // 캐시에 없으면 CDN에서 다운로드
        if (!loadedFromCache) {
            this.updateProgress('core', 10, 'Pyodide 다운로드 중...');
            
            for (let i = 0; i < coreFiles.length; i++) {
                const filename = coreFiles[i];
                if (!loadedFiles[filename]) {
                    console.log(`CDN에서 다운로드: ${filename}`);
                    const data = await this.downloadFromCDN(filename);
                    loadedFiles[filename] = data;
                    await this.saveToCache(filename, data);
                    
                    const progress = 10 + (i + 1) * 10;
                    this.updateProgress('core', progress, `${filename} 로드 완료`);
                }
            }
        }
        
        return loadedFiles;
    }

    /**
     * Pyodide 초기화
     */
    async initializePyodide(coreFiles) {
        this.updateProgress('init', 50, 'Python 환경 초기화 중...');
        
        try {
            // pyodide.js 스크립트 실행
            const scriptContent = coreFiles['pyodide.js'];
            const script = document.createElement('script');
            script.textContent = scriptContent;
            document.head.appendChild(script);
            
            // WASM 파일을 Blob URL로 변환
            const wasmBlob = new Blob([coreFiles['pyodide.asm.wasm']], { 
                type: 'application/wasm' 
            });
            const wasmUrl = URL.createObjectURL(wasmBlob);
            
            // Pyodide 로드 (전역 loadPyodide 함수 사용)
            this.pyodide = await loadPyodide({
                indexURL: this.config.cdnUrl,
                // WASM URL 오버라이드
                wasmURL: wasmUrl,
                fullStdLib: false
            });
            
            this.updateProgress('init', 60, 'Python 환경 준비 완료');
            
            // 기본 Python 설정
            await this.pyodide.runPythonAsync(`
                import sys
                import warnings
                warnings.filterwarnings('ignore')
                print(f"Python {sys.version}")
                print("Python 환경 준비 완료")
            `);
            
            return true;
        } catch (error) {
            console.error('Pyodide 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * Python 패키지 설치
     */
    async installPackages() {
        this.updateProgress('packages', 65, '패키지 설치 준비 중...');
        
        const packages = this.config.packages;
        const totalPackages = packages.length;
        
        for (let i = 0; i < totalPackages; i++) {
            const pkg = packages[i];
            const progress = 65 + (i + 1) * (30 / totalPackages);
            
            this.updateProgress('packages', progress, `${pkg} 설치 중...`);
            
            try {
                // 먼저 micropip 설치 (다른 패키지 설치에 필요)
                if (pkg === 'micropip') {
                    await this.pyodide.loadPackage('micropip');
                    continue;
                }
                
                // 패키지 설치
                await this.pyodide.loadPackage(pkg);
                console.log(`${pkg} 설치 완료`);
                
            } catch (error) {
                console.error(`${pkg} 설치 실패:`, error);
                // 필수 패키지가 아니면 계속 진행
                if (pkg !== 'numpy' && pkg !== 'scipy') {
                    console.warn(`${pkg}는 선택적 패키지이므로 계속 진행합니다.`);
                } else {
                    throw error;
                }
            }
        }
        
        this.updateProgress('packages', 95, '패키지 설치 완료');
    }

    /**
     * 통계 분석 함수 정의
     */
    async defineStatisticalFunctions() {
        this.updateProgress('functions', 96, '통계 함수 정의 중...');
        
        const pythonCode = `
import numpy as np
import scipy.stats as stats
import json
from itertools import combinations

class StatisticalAnalyzer:
    def __init__(self):
        self.results = {}
    
    def analyze(self, data_json):
        """메인 분석 함수"""
        try:
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
            if (self.results['main_test']['p_value'] < 0.05 and 
                len(groups) > 2):
                self.results['post_hoc'] = self._post_hoc_analysis(
                    groups, 
                    self.results['main_test']['test_type']
                )
            
            return json.dumps(self.results, ensure_ascii=False)
            
        except Exception as e:
            return json.dumps({
                'error': str(e),
                'type': 'CALCULATION_FAILED'
            })
    
    def _descriptive_stats(self, groups):
        """기술통계량 계산"""
        stats_list = []
        for i, group in enumerate(groups):
            if len(group) > 0:
                # 신뢰구간 계산
                mean = np.mean(group)
                sem = stats.sem(group) if len(group) > 1 else 0
                
                if len(group) > 1:
                    ci = stats.t.interval(
                        0.95, 
                        len(group)-1, 
                        loc=mean, 
                        scale=sem
                    )
                else:
                    ci = (mean, mean)
                
                stats_list.append({
                    'group_id': i,
                    'n': int(len(group)),
                    'mean': float(mean),
                    'std': float(np.std(group, ddof=1)) if len(group) > 1 else 0,
                    'sem': float(sem),
                    'median': float(np.median(group)),
                    'q1': float(np.percentile(group, 25)),
                    'q3': float(np.percentile(group, 75)),
                    'min': float(np.min(group)),
                    'max': float(np.max(group)),
                    'ci95_lower': float(ci[0]),
                    'ci95_upper': float(ci[1])
                })
        return stats_list
    
    def _check_assumptions(self, groups):
        """정규성 및 등분산성 검정"""
        normality = []
        
        # 정규성 검정
        for i, group in enumerate(groups):
            if len(group) >= 3:
                if len(group) < 50:
                    stat, p = stats.shapiro(group)
                    test_name = 'Shapiro-Wilk'
                else:
                    stat, p = stats.kstest(
                        group, 
                        'norm',
                        args=(np.mean(group), np.std(group))
                    )
                    test_name = 'Kolmogorov-Smirnov'
                
                normality.append({
                    'group_id': i,
                    'test': test_name,
                    'statistic': float(stat),
                    'p_value': float(p),
                    'is_normal': p > 0.05
                })
            else:
                normality.append({
                    'group_id': i,
                    'test': 'Too few samples',
                    'statistic': None,
                    'p_value': None,
                    'is_normal': False
                })
        
        # 등분산성 검정
        homogeneity = None
        if len(groups) >= 2 and all(len(g) >= 2 for g in groups):
            stat_lev, p_lev = stats.levene(*groups)
            homogeneity = {
                'levene': {
                    'statistic': float(stat_lev),
                    'p_value': float(p_lev),
                    'equal_var': p_lev > 0.05
                }
            }
            
            # Bartlett's test (정규분포 가정)
            if all(n['is_normal'] for n in normality):
                stat_bart, p_bart = stats.bartlett(*groups)
                homogeneity['bartlett'] = {
                    'statistic': float(stat_bart),
                    'p_value': float(p_bart),
                    'equal_var': p_bart > 0.05
                }
        
        return {
            'normality': normality,
            'homogeneity': homogeneity,
            'all_normal': all(n.get('is_normal', False) for n in normality),
            'equal_variance': homogeneity['levene']['equal_var'] if homogeneity else None
        }
    
    def _two_group_test(self, groups):
        """2그룹 비교 검정"""
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
            stat, p = stats.mannwhitneyu(groups[0], groups[1], alternative='two-sided')
            test_type = 'Mann-Whitney U test'
        
        # 효과 크기 (Cohen's d)
        mean1, mean2 = np.mean(groups[0]), np.mean(groups[1])
        n1, n2 = len(groups[0]), len(groups[1])
        var1, var2 = np.var(groups[0], ddof=1), np.var(groups[1], ddof=1)
        
        pooled_std = np.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2))
        cohens_d = (mean1 - mean2) / pooled_std if pooled_std > 0 else 0
        
        return {
            'test_type': test_type,
            'statistic': float(stat),
            'p_value': float(p),
            'effect_size': float(cohens_d),
            'effect_magnitude': self._interpret_cohens_d(cohens_d),
            'significant': p < 0.05
        }
    
    def _multi_group_test(self, groups):
        """3그룹 이상 비교 검정"""
        assumptions = self.results['assumptions']
        
        if assumptions['all_normal'] and assumptions['equal_variance']:
            # One-way ANOVA
            stat, p = stats.f_oneway(*groups)
            test_type = 'One-way ANOVA'
            
            # 효과 크기 (eta-squared)
            grand_mean = np.mean(np.concatenate(groups))
            ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in groups)
            ss_total = sum(np.sum((g - grand_mean)**2) for g in groups)
            eta_squared = ss_between / ss_total if ss_total > 0 else 0
            effect_size = eta_squared
            
        else:
            # Kruskal-Wallis test
            stat, p = stats.kruskal(*groups)
            test_type = 'Kruskal-Wallis test'
            
            # 효과 크기 (epsilon-squared)
            n = sum(len(g) for g in groups)
            k = len(groups)
            epsilon_squared = (stat - k + 1) / (n - k) if n > k else 0
            effect_size = epsilon_squared
        
        return {
            'test_type': test_type,
            'statistic': float(stat),
            'p_value': float(p),
            'effect_size': float(effect_size) if effect_size else None,
            'effect_magnitude': self._interpret_eta_squared(effect_size) if effect_size else None,
            'significant': p < 0.05
        }
    
    def _post_hoc_analysis(self, groups, test_type):
        """사후분석"""
        results = []
        n_groups = len(groups)
        alpha = 0.05
        n_comparisons = n_groups * (n_groups - 1) / 2
        
        if 'ANOVA' in test_type:
            # Tukey HSD 근사 (수동 구현)
            for i, j in combinations(range(n_groups), 2):
                # Pairwise t-test
                stat, p = stats.ttest_ind(groups[i], groups[j])
                
                # Bonferroni 보정
                p_adjusted = min(1.0, p * n_comparisons)
                
                # 평균 차이와 신뢰구간
                mean_diff = np.mean(groups[i]) - np.mean(groups[j])
                se = np.sqrt(np.var(groups[i])/len(groups[i]) + 
                           np.var(groups[j])/len(groups[j]))
                ci_lower = mean_diff - 1.96 * se
                ci_upper = mean_diff + 1.96 * se
                
                results.append({
                    'group1': i,
                    'group2': j,
                    'method': 'Bonferroni',
                    'mean_diff': float(mean_diff),
                    'p_value': float(p),
                    'p_adjusted': float(p_adjusted),
                    'ci_lower': float(ci_lower),
                    'ci_upper': float(ci_upper),
                    'significant': p_adjusted < alpha
                })
        else:
            # Dunn's test for Kruskal-Wallis
            from scipy.stats import rankdata
            
            # 전체 데이터 순위
            all_data = np.concatenate(groups)
            all_ranks = rankdata(all_data)
            
            # 그룹별 평균 순위
            rank_means = []
            start = 0
            for group in groups:
                end = start + len(group)
                rank_means.append(np.mean(all_ranks[start:end]))
                start = end
            
            n = len(all_data)
            
            for i, j in combinations(range(n_groups), 2):
                ni, nj = len(groups[i]), len(groups[j])
                
                # Dunn's Z statistic
                se = np.sqrt((n * (n + 1) / 12) * (1/ni + 1/nj))
                z = abs(rank_means[i] - rank_means[j]) / se if se > 0 else 0
                p = 2 * (1 - stats.norm.cdf(z))
                
                # Bonferroni 보정
                p_adjusted = min(1.0, p * n_comparisons)
                
                results.append({
                    'group1': i,
                    'group2': j,
                    'method': "Dunn's test",
                    'z_statistic': float(z),
                    'p_value': float(p),
                    'p_adjusted': float(p_adjusted),
                    'significant': p_adjusted < alpha
                })
        
        return results
    
    def _interpret_cohens_d(self, d):
        """Cohen's d 해석"""
        d = abs(d)
        if d < 0.2:
            return 'negligible'
        elif d < 0.5:
            return 'small'
        elif d < 0.8:
            return 'medium'
        else:
            return 'large'
    
    def _interpret_eta_squared(self, eta):
        """Eta-squared 해석"""
        if eta < 0.01:
            return 'negligible'
        elif eta < 0.06:
            return 'small'
        elif eta < 0.14:
            return 'medium'
        else:
            return 'large'

# 전역 인스턴스 생성
analyzer = StatisticalAnalyzer()
print("통계 분석 엔진 준비 완료")
`;
        
        try {
            await this.pyodide.runPythonAsync(pythonCode);
            console.log('통계 함수 정의 완료');
            this.updateProgress('functions', 98, '통계 엔진 준비 완료');
        } catch (error) {
            console.error('통계 함수 정의 실패:', error);
            throw error;
        }
    }

    /**
     * 메인 초기화 함수
     */
    async initialize(progressCallback) {
        this.progressCallback = progressCallback;
        
        try {
            // 오프라인 체크
            const isOnline = navigator.onLine;
            console.log(`네트워크 상태: ${isOnline ? '온라인' : '오프라인'}`);
            
            // 1. Pyodide 코어 로드
            const coreFiles = await this.loadPyodideCore();
            
            // 2. Pyodide 초기화
            await this.initializePyodide(coreFiles);
            
            // 3. 패키지 설치
            await this.installPackages();
            
            // 4. 통계 함수 정의
            await this.defineStatisticalFunctions();
            
            // 완료
            this.isReady = true;
            this.updateProgress('complete', 100, '준비 완료!');
            
            console.log('✅ Pyodide 초기화 완료');
            return this.pyodide;
            
        } catch (error) {
            console.error('❌ Pyodide 초기화 실패:', error);
            this.updateProgress('error', 0, `초기화 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 통계 분석 실행
     */
    async runAnalysis(data) {
        if (!this.isReady) {
            throw new Error('Pyodide가 아직 준비되지 않았습니다.');
        }
        
        try {
            const dataJson = JSON.stringify(data);
            const result = await this.pyodide.runPythonAsync(
                `analyzer.analyze('${dataJson}')`
            );
            return JSON.parse(result);
        } catch (error) {
            console.error('분석 실행 오류:', error);
            throw error;
        }
    }

    /**
     * 메모리 정리
     */
    async cleanup() {
        if (this.pyodide) {
            await this.pyodide.runPythonAsync(`
                import gc
                gc.collect()
                print("메모리 정리 완료")
            `);
        }
    }

    /**
     * Pyodide 재시작
     */
    async restart() {
        console.log('Pyodide 재시작 중...');
        this.pyodide = null;
        this.isReady = false;
        this.loadingProgress = 0;
        
        // 재초기화
        return await this.initialize(this.progressCallback);
    }
}

// 전역 인스턴스 생성
window.pyodideLoader = new PyodideLoader();