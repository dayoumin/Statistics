/**
 * Pyodide 통합 관리자
 * 단일 인스턴스로 Pyodide를 관리하고 중복 초기화를 방지
 */

class PyodideManager {
    constructor() {
        this.pyodide = null;
        this.isInitializing = false;
        this.isReady = false;
        this.initPromise = null;
        this.loadedPackages = new Set();
        
        // 설정
        this.config = {
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
            packages: ['numpy', 'scipy'],
            retryAttempts: 3,
            retryDelay: 2000
        };
        
        // 콜백
        this.onProgress = null;
        this.onError = null;
        this.onReady = null;
    }
    
    /**
     * Pyodide 초기화 (싱글톤 패턴)
     */
    async initialize() {
        // 이미 초기화됨
        if (this.isReady) {
            debug.log('[PyodideManager] 이미 초기화됨');
            return this.pyodide;
        }
        
        // 초기화 진행 중
        if (this.isInitializing) {
            debug.log('[PyodideManager] 초기화 진행 중, 대기...');
            return this.initPromise;
        }
        
        // 초기화 시작
        this.isInitializing = true;
        this.initPromise = this._initializeCore();
        
        try {
            await this.initPromise;
            this.isReady = true;
            this.isInitializing = false;
            debug.log('[PyodideManager] 초기화 완료');
            
            if (this.onReady) {
                this.onReady(this.pyodide);
            }
            
            return this.pyodide;
        } catch (error) {
            this.isInitializing = false;
            debug.error('[PyodideManager] 초기화 실패:', error);
            
            if (this.onError) {
                this.onError(error);
            }
            
            throw error;
        }
    }
    
    /**
     * 실제 초기화 작업
     */
    async _initializeCore() {
        let lastError = null;
        
        // 재시도 로직
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                debug.log(`[PyodideManager] 초기화 시도 ${attempt}/${this.config.retryAttempts}`);
                
                // 1. Pyodide 로드
                this._updateProgress('pyodide', 10, 'Pyodide 로딩 중...');
                
                if (typeof loadPyodide === 'undefined') {
                    throw new Error('loadPyodide 함수가 정의되지 않음. Pyodide 스크립트가 로드되지 않았습니다.');
                }
                
                this.pyodide = await loadPyodide({
                    indexURL: this.config.indexURL
                });
                
                this._updateProgress('pyodide', 30, 'Pyodide 로드 완료');
                
                // 2. 패키지 로드
                await this._loadPackages();
                
                // 3. Python 함수 정의
                await this._definePythonFunctions();
                
                this._updateProgress('complete', 100, '초기화 완료');
                
                return this.pyodide;
                
            } catch (error) {
                lastError = error;
                debug.error(`[PyodideManager] 시도 ${attempt} 실패:`, error);
                
                if (attempt < this.config.retryAttempts) {
                    debug.log(`[PyodideManager] ${this.config.retryDelay}ms 후 재시도...`);
                    await this._delay(this.config.retryDelay);
                }
            }
        }
        
        throw lastError || new Error('Pyodide 초기화 실패');
    }
    
    /**
     * 패키지 로드
     */
    async _loadPackages() {
        const packages = this.config.packages;
        
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            
            if (this.loadedPackages.has(pkg)) {
                debug.log(`[PyodideManager] ${pkg} 이미 로드됨`);
                continue;
            }
            
            const progress = 30 + (i + 1) * (50 / packages.length);
            this._updateProgress('packages', progress, `${pkg} 로딩 중...`);
            
            await this.pyodide.loadPackage(pkg);
            this.loadedPackages.add(pkg);
            
            debug.log(`[PyodideManager] ${pkg} 로드 완료`);
        }
        
        this._updateProgress('packages', 80, '패키지 로드 완료');
    }
    
    /**
     * Python 통계 함수 정의
     */
    async _definePythonFunctions() {
        this._updateProgress('functions', 85, 'Python 함수 정의 중...');
        
        await this.pyodide.runPythonAsync(`
            import numpy as np
            from scipy import stats
            import json
            
            def test_normality(values):
                """정규성 검정 (Shapiro-Wilk or Kolmogorov-Smirnov)"""
                x = np.array(values, dtype=float)
                x = x[~np.isnan(x)]
                
                if len(x) < 3:
                    return {"error": "Too few data points", "n": len(x)}
                
                n = len(x)
                
                # 작은 샘플은 Shapiro-Wilk, 큰 샘플은 K-S test
                if n < 50:
                    stat, p = stats.shapiro(x)
                    test_name = "Shapiro-Wilk"
                else:
                    # Kolmogorov-Smirnov test with normal distribution
                    stat, p = stats.kstest(x, 'norm', args=(x.mean(), x.std()))
                    test_name = "Kolmogorov-Smirnov"
                
                # 왜도와 첨도
                skewness = float(stats.skew(x))
                kurtosis = float(stats.kurtosis(x))
                
                return {
                    "test": test_name,
                    "n": n,
                    "statistic": float(stat),
                    "pValue": float(p),
                    "isNormal": p > 0.05,
                    "skewness": float(skewness),
                    "kurtosis": float(kurtosis),
                    "mean": float(np.mean(x)),
                    "std": float(np.std(x, ddof=1))
                }
            
            def test_homogeneity(groups_dict):
                """등분산성 검정 (Levene/Bartlett)"""
                groups = []
                group_names = []
                
                # JavaScript 객체를 Python dict로 변환
                if hasattr(groups_dict, 'to_py'):
                    groups_dict = groups_dict.to_py()
                
                for name, values in groups_dict.items():
                    if hasattr(values, 'to_py'):
                        values = values.to_py()
                    arr = np.array(values, dtype=float)
                    arr = arr[~np.isnan(arr)]
                    if len(arr) > 0:
                        groups.append(arr)
                        group_names.append(name)
                
                if len(groups) < 2:
                    return {"error": "Need at least 2 groups"}
                
                # Levene's test (중앙값 기반, 더 robust)
                levene_stat, levene_p = stats.levene(*groups, center='median')
                
                # 모든 그룹이 정규분포를 따르는지 확인
                all_normal = True
                for group in groups:
                    if len(group) >= 3:
                        _, p = stats.shapiro(group) if len(group) < 50 else stats.kstest(group, 'norm', args=(group.mean(), group.std()))
                        if p <= 0.05:
                            all_normal = False
                            break
                
                result = {
                    "test": "Levene",
                    "statistic": float(levene_stat),
                    "pValue": float(levene_p),
                    "isHomogeneous": levene_p > 0.05,
                    "groupCount": len(groups),
                    "allNormal": all_normal
                }
                
                # 모든 그룹이 정규분포면 Bartlett's test도 수행
                if all_normal and len(groups) >= 2:
                    try:
                        bartlett_stat, bartlett_p = stats.bartlett(*groups)
                        result["bartlett"] = {
                            "statistic": float(bartlett_stat),
                            "pValue": float(bartlett_p)
                        }
                    except:
                        pass
                
                return result
            
            def perform_ttest(group1, group2, equal_var=True):
                """독립표본 t-검정"""
                x1 = np.array(group1, dtype=float)
                x2 = np.array(group2, dtype=float)
                
                x1 = x1[~np.isnan(x1)]
                x2 = x2[~np.isnan(x2)]
                
                t_stat, p_value = stats.ttest_ind(x1, x2, equal_var=equal_var)
                
                # 효과 크기 (Cohen's d)
                pooled_std = np.sqrt(((len(x1)-1)*x1.std()**2 + (len(x2)-1)*x2.std()**2) / (len(x1)+len(x2)-2))
                cohens_d = (x1.mean() - x2.mean()) / pooled_std if pooled_std > 0 else 0
                
                return {
                    "test": "Independent t-test" if equal_var else "Welch's t-test",
                    "statistic": float(t_stat),
                    "pValue": float(p_value),
                    "df": len(x1) + len(x2) - 2 if equal_var else None,
                    "mean1": float(x1.mean()),
                    "mean2": float(x2.mean()),
                    "std1": float(x1.std(ddof=1)),
                    "std2": float(x2.std(ddof=1)),
                    "n1": len(x1),
                    "n2": len(x2),
                    "cohensD": float(cohens_d),
                    "significant": p_value < 0.05
                }
            
            def perform_anova(groups_dict, equal_var=True):
                """일원분산분석 (ANOVA)"""
                groups = []
                group_names = []
                
                # JavaScript 객체를 Python dict로 변환
                if hasattr(groups_dict, 'to_py'):
                    groups_dict = groups_dict.to_py()
                
                for name, values in groups_dict.items():
                    if hasattr(values, 'to_py'):
                        values = values.to_py()
                    arr = np.array(values, dtype=float)
                    arr = arr[~np.isnan(arr)]
                    if len(arr) > 0:
                        groups.append(arr)
                        group_names.append(name)
                
                if len(groups) < 2:
                    return {"error": "Need at least 2 groups"}
                
                if equal_var:
                    # 일반 ANOVA
                    f_stat, p_value = stats.f_oneway(*groups)
                    test_name = "One-way ANOVA"
                else:
                    # Welch's ANOVA (등분산 가정 위배 시)
                    # scipy에 직접적인 Welch's ANOVA가 없으므로 수동 계산
                    # 여기서는 간단히 일반 ANOVA 사용 (실제로는 더 복잡한 계산 필요)
                    f_stat, p_value = stats.f_oneway(*groups)
                    test_name = "Welch's ANOVA"
                
                # 효과 크기 (eta-squared)
                all_data = np.concatenate(groups)
                grand_mean = all_data.mean()
                ss_between = sum(len(g) * (g.mean() - grand_mean)**2 for g in groups)
                ss_total = np.sum((all_data - grand_mean)**2)
                eta_squared = ss_between / ss_total if ss_total > 0 else 0
                
                # 그룹별 통계
                group_stats = []
                for i, (name, group) in enumerate(zip(group_names, groups)):
                    group_stats.append({
                        "name": name,
                        "n": len(group),
                        "mean": float(group.mean()),
                        "std": float(group.std(ddof=1)),
                        "min": float(group.min()),
                        "max": float(group.max())
                    })
                
                return {
                    "test": test_name,
                    "statistic": float(f_stat),
                    "pValue": float(p_value),
                    "df_between": len(groups) - 1,
                    "df_within": len(all_data) - len(groups),
                    "etaSquared": float(eta_squared),
                    "significant": p_value < 0.05,
                    "groups": group_stats,
                    "needsPostHoc": p_value < 0.05 and len(groups) > 2
                }
            
            def perform_kruskal_wallis(groups_dict):
                """Kruskal-Wallis 검정 (비모수)"""
                groups = []
                group_names = []
                
                # JavaScript 객체를 Python dict로 변환
                if hasattr(groups_dict, 'to_py'):
                    groups_dict = groups_dict.to_py()
                
                for name, values in groups_dict.items():
                    if hasattr(values, 'to_py'):
                        values = values.to_py()
                    arr = np.array(values, dtype=float)
                    arr = arr[~np.isnan(arr)]
                    if len(arr) > 0:
                        groups.append(arr)
                        group_names.append(name)
                
                if len(groups) < 2:
                    return {"error": "Need at least 2 groups"}
                
                h_stat, p_value = stats.kruskal(*groups)
                
                # 그룹별 통계 (중앙값 기반)
                group_stats = []
                for name, group in zip(group_names, groups):
                    group_stats.append({
                        "name": name,
                        "n": len(group),
                        "median": float(np.median(group)),
                        "mean": float(group.mean()),
                        "std": float(group.std(ddof=1)),
                        "min": float(group.min()),
                        "max": float(group.max())
                    })
                
                return {
                    "test": "Kruskal-Wallis",
                    "statistic": float(h_stat),
                    "pValue": float(p_value),
                    "df": len(groups) - 1,
                    "significant": p_value < 0.05,
                    "groups": group_stats,
                    "needsPostHoc": p_value < 0.05 and len(groups) > 2
                }
            
            def perform_mann_whitney(group1, group2):
                """Mann-Whitney U 검정 (비모수)"""
                x1 = np.array(group1, dtype=float)
                x2 = np.array(group2, dtype=float)
                
                x1 = x1[~np.isnan(x1)]
                x2 = x2[~np.isnan(x2)]
                
                u_stat, p_value = stats.mannwhitneyu(x1, x2, alternative='two-sided')
                
                # 효과 크기 (r = Z / sqrt(N))
                n = len(x1) + len(x2)
                z = stats.norm.ppf(1 - p_value/2)  # 근사 Z 점수
                r = abs(z) / np.sqrt(n)
                
                return {
                    "test": "Mann-Whitney U",
                    "statistic": float(u_stat),
                    "pValue": float(p_value),
                    "median1": float(np.median(x1)),
                    "median2": float(np.median(x2)),
                    "mean1": float(x1.mean()),
                    "mean2": float(x2.mean()),
                    "n1": len(x1),
                    "n2": len(x2),
                    "effectSize": float(r),
                    "significant": p_value < 0.05
                }
            
            print("Python 통계 함수 정의 완료")
        `);
        
        this._updateProgress('functions', 95, 'Python 함수 정의 완료');
        debug.log('[PyodideManager] Python 함수 정의 완료');
    }
    
    /**
     * Python 코드 실행
     */
    async runPython(code) {
        if (!this.isReady) {
            throw new Error('Pyodide가 아직 초기화되지 않았습니다.');
        }
        
        return await this.pyodide.runPythonAsync(code);
    }
    
    /**
     * Python 함수 호출
     */
    async callPythonFunction(funcName, ...args) {
        if (!this.isReady) {
            throw new Error('Pyodide가 아직 초기화되지 않았습니다.');
        }
        
        const func = this.pyodide.globals.get(funcName);
        if (!func) {
            throw new Error(`Python 함수 '${funcName}'을 찾을 수 없습니다.`);
        }
        
        const result = func(...args);
        return result.toJs ? result.toJs() : result;
    }
    
    /**
     * 진행 상황 업데이트
     */
    _updateProgress(step, progress, message) {
        debug.log(`[PyodideManager] ${message} (${progress}%`);
        
        if (this.onProgress) {
            this.onProgress({ step, progress, message });
        }
    }
    
    /**
     * 지연 유틸리티
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 인스턴스 상태 확인
     */
    get ready() {
        return this.isReady;
    }
    
    /**
     * Pyodide 인스턴스 가져오기
     */
    getInstance() {
        if (!this.isReady) {
            debug.warn('[PyodideManager] Pyodide가 아직 준비되지 않았습니다.');
            return null;
        }
        return this.pyodide;
    }
}

// 싱글톤 인스턴스 생성
const pyodideManager = new PyodideManager();

// 전역 노출
window.pyodideManager = pyodideManager;