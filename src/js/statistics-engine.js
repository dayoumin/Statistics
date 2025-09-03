// Statistics Engine Module
// 통계 분석 엔진 래퍼

export class StatisticsEngine {
    constructor() {
        this.pyodide = null;
        this.isReady = false;
    }
    
    async initialize() {
        const stages = ['stage1', 'stage2', 'stage3', 'stage4'];
        
        try {
            // Pyodide 로드
            this.updateStatus('Python 환경 초기화 중...', 0);
            this.pyodide = await loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
            });
            
            // NumPy 로드
            this.updateStatus('NumPy 라이브러리 로딩 중...', 25);
            await this.pyodide.loadPackage(['numpy']);
            
            // SciPy 로드
            this.updateStatus('SciPy.stats 모듈 로딩 중...', 50);
            await this.pyodide.loadPackage(['scipy']);
            
            // 통계 함수 정의
            this.updateStatus('통계 엔진 준비 중...', 75);
            await this.definePythonFunctions();
            
            this.updateStatus('✅ 통계 엔진 준비 완료!', 100);
            this.isReady = true;
            
            return true;
        } catch (error) {
            console.error('Pyodide 초기화 실패:', error);
            this.updateStatus('❌ 통계 엔진 로딩 실패', 0, true);
            return false;
        }
    }
    
    updateStatus(message, percent, isError = false) {
        const statusEl = document.getElementById('pyodideStatus');
        if (statusEl) {
            if (isError) {
                statusEl.innerHTML = `
                    <div class="text-red-600">
                        <p>${message}</p>
                        <button onclick="location.reload()" class="btn-secondary text-sm mt-2">
                            새로고침하여 다시 시도
                        </button>
                    </div>
                `;
            } else {
                statusEl.innerHTML = `
                    <div class="flex items-center">
                        <div class="loading-spinner mr-3"></div>
                        <span>${message}</span>
                    </div>
                    <div class="progress-bar mt-2">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                `;
            }
        }
    }
    
    async definePythonFunctions() {
        await this.pyodide.runPythonAsync(`
            import numpy as np
            from scipy import stats
            import json
            
            def validate_data(data):
                """데이터 검증"""
                issues = []
                valid = True
                
                for col, values in data.items():
                    # 결측치 확인
                    null_count = sum(1 for v in values if v is None or (isinstance(v, str) and v.strip() == ''))
                    if null_count > 0:
                        issues.append(f"{col}: {null_count}개 결측치 발견")
                    
                    # 숫자 데이터 확인
                    numeric_values = []
                    for v in values:
                        if v is not None and str(v).strip() != '':
                            try:
                                numeric_values.append(float(v))
                            except:
                                pass
                    
                    if len(numeric_values) < len(values) * 0.5:
                        issues.append(f"{col}: 숫자가 아닌 데이터가 50% 이상")
                        valid = False
                
                return json.dumps({
                    'valid': valid,
                    'issues': issues
                })
            
            def test_assumptions(data):
                """통계적 가정 검정"""
                results = {
                    'normality': {},
                    'homogeneity': None
                }
                
                # 정규성 검정
                for col, values in data.items():
                    numeric_values = [float(v) for v in values if v is not None]
                    if len(numeric_values) > 3:
                        statistic, p_value = stats.shapiro(numeric_values)
                        results['normality'][col] = {
                            'statistic': float(statistic),
                            'p_value': float(p_value),
                            'is_normal': bool(p_value > 0.05)
                        }
                
                # 등분산성 검정 (그룹이 2개 이상일 때)
                if len(data) >= 2:
                    groups = [
                        [float(v) for v in values if v is not None]
                        for values in data.values()
                    ]
                    statistic, p_value = stats.levene(*groups)
                    results['homogeneity'] = {
                        'statistic': float(statistic),
                        'p_value': float(p_value),
                        'is_homogeneous': bool(p_value > 0.05)
                    }
                
                return json.dumps(results)
            
            def perform_analysis(data, method='auto'):
                """통계 분석 수행"""
                groups = [
                    [float(v) for v in values if v is not None]
                    for values in data.values()
                ]
                
                result = {
                    'method': method,
                    'groups': len(groups)
                }
                
                if len(groups) == 2:
                    # t-test
                    statistic, p_value = stats.ttest_ind(groups[0], groups[1])
                    result['test'] = 't-test'
                    result['statistic'] = float(statistic)
                    result['p_value'] = float(p_value)
                elif len(groups) > 2:
                    # ANOVA
                    statistic, p_value = stats.f_oneway(*groups)
                    result['test'] = 'ANOVA'
                    result['statistic'] = float(statistic)
                    result['p_value'] = float(p_value)
                
                # 기술통계
                result['descriptive'] = {}
                for name, values in data.items():
                    numeric_values = [float(v) for v in values if v is not None]
                    if numeric_values:
                        result['descriptive'][name] = {
                            'mean': float(np.mean(numeric_values)),
                            'std': float(np.std(numeric_values)),
                            'min': float(np.min(numeric_values)),
                            'max': float(np.max(numeric_values)),
                            'n': len(numeric_values)
                        }
                
                return json.dumps(result)
            
            print("통계 엔진 준비 완료")
        `);
    }
    
    async validateData(data) {
        if (!this.isReady) throw new Error('통계 엔진이 준비되지 않았습니다');
        const result = await this.pyodide.runPythonAsync(`validate_data(${JSON.stringify(data)})`);
        return JSON.parse(result);
    }
    
    async testAssumptions(data) {
        if (!this.isReady) throw new Error('통계 엔진이 준비되지 않았습니다');
        const result = await this.pyodide.runPythonAsync(`test_assumptions(${JSON.stringify(data)})`);
        return JSON.parse(result);
    }
    
    async performAnalysis(data, method = 'auto') {
        if (!this.isReady) throw new Error('통계 엔진이 준비되지 않았습니다');
        const result = await this.pyodide.runPythonAsync(`perform_analysis(${JSON.stringify(data)}, '${method}')`);
        return JSON.parse(result);
    }
}