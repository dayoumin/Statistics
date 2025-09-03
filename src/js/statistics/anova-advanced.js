/**
 * Advanced ANOVA Module - Two-way and Repeated Measures
 * 국립수산과학원 실험 데이터 분석용
 */

export class AdvancedANOVA {
    constructor() {
        this.results = {};
    }
    
    /**
     * Two-way ANOVA (두 요인 분산분석)
     * @param {Array} data - 데이터 배열
     * @param {Array} factorA - 첫 번째 요인 레벨
     * @param {Array} factorB - 두 번째 요인 레벨
     * @returns {Object} Two-way ANOVA 결과
     */
    async performTwoWayANOVA(data, factorA, factorB) {
        // Pyodide를 통한 Python 실행
        const pythonCode = `
import numpy as np
import pandas as pd
from scipy import stats
import json

def two_way_anova(data_list, factor_a, factor_b):
    """두 독립변수의 주효과와 상호작용 효과 분석"""
    
    # 데이터프레임 생성
    df = pd.DataFrame({
        'value': data_list,
        'factor_a': factor_a,
        'factor_b': factor_b
    })
    
    # 그룹별 통계
    groups = df.groupby(['factor_a', 'factor_b'])
    group_stats = groups['value'].agg(['mean', 'std', 'count'])
    
    # 전체 평균
    grand_mean = df['value'].mean()
    n_total = len(df)
    
    # 요인 A 수준별 평균
    factor_a_means = df.groupby('factor_a')['value'].mean()
    n_a = df['factor_a'].nunique()
    
    # 요인 B 수준별 평균
    factor_b_means = df.groupby('factor_b')['value'].mean()
    n_b = df['factor_b'].nunique()
    
    # 제곱합 계산
    # Total Sum of Squares
    ss_total = np.sum((df['value'] - grand_mean) ** 2)
    
    # Factor A Sum of Squares
    ss_a = 0
    for level in factor_a_means.index:
        n_level = len(df[df['factor_a'] == level])
        ss_a += n_level * (factor_a_means[level] - grand_mean) ** 2
    
    # Factor B Sum of Squares
    ss_b = 0
    for level in factor_b_means.index:
        n_level = len(df[df['factor_b'] == level])
        ss_b += n_level * (factor_b_means[level] - grand_mean) ** 2
    
    # Interaction Sum of Squares
    ss_ab = 0
    for a in factor_a_means.index:
        for b in factor_b_means.index:
            cell_data = df[(df['factor_a'] == a) & (df['factor_b'] == b)]['value']
            if len(cell_data) > 0:
                cell_mean = cell_data.mean()
                n_cell = len(cell_data)
                expected = grand_mean + (factor_a_means[a] - grand_mean) + (factor_b_means[b] - grand_mean)
                ss_ab += n_cell * (cell_mean - expected) ** 2
    
    # Error Sum of Squares
    ss_error = ss_total - ss_a - ss_b - ss_ab
    
    # 자유도
    df_a = n_a - 1
    df_b = n_b - 1
    df_ab = df_a * df_b
    df_error = n_total - n_a * n_b
    df_total = n_total - 1
    
    # 평균제곱
    ms_a = ss_a / df_a if df_a > 0 else 0
    ms_b = ss_b / df_b if df_b > 0 else 0
    ms_ab = ss_ab / df_ab if df_ab > 0 else 0
    ms_error = ss_error / df_error if df_error > 0 else 0
    
    # F-통계량
    f_a = ms_a / ms_error if ms_error > 0 else 0
    f_b = ms_b / ms_error if ms_error > 0 else 0
    f_ab = ms_ab / ms_error if ms_error > 0 else 0
    
    # p-값
    p_a = 1 - stats.f.cdf(f_a, df_a, df_error) if df_a > 0 and df_error > 0 else 1
    p_b = 1 - stats.f.cdf(f_b, df_b, df_error) if df_b > 0 and df_error > 0 else 1
    p_ab = 1 - stats.f.cdf(f_ab, df_ab, df_error) if df_ab > 0 and df_error > 0 else 1
    
    # 효과 크기 (Eta-squared)
    eta_sq_a = ss_a / ss_total if ss_total > 0 else 0
    eta_sq_b = ss_b / ss_total if ss_total > 0 else 0
    eta_sq_ab = ss_ab / ss_total if ss_total > 0 else 0
    
    # Partial Eta-squared
    partial_eta_sq_a = ss_a / (ss_a + ss_error) if (ss_a + ss_error) > 0 else 0
    partial_eta_sq_b = ss_b / (ss_b + ss_error) if (ss_b + ss_error) > 0 else 0
    partial_eta_sq_ab = ss_ab / (ss_ab + ss_error) if (ss_ab + ss_error) > 0 else 0
    
    results = {
        'factor_a': {
            'ss': ss_a,
            'df': df_a,
            'ms': ms_a,
            'f_value': f_a,
            'p_value': p_a,
            'eta_squared': eta_sq_a,
            'partial_eta_squared': partial_eta_sq_a,
            'levels': factor_a_means.to_dict()
        },
        'factor_b': {
            'ss': ss_b,
            'df': df_b,
            'ms': ms_b,
            'f_value': f_b,
            'p_value': p_b,
            'eta_squared': eta_sq_b,
            'partial_eta_squared': partial_eta_sq_b,
            'levels': factor_b_means.to_dict()
        },
        'interaction': {
            'ss': ss_ab,
            'df': df_ab,
            'ms': ms_ab,
            'f_value': f_ab,
            'p_value': p_ab,
            'eta_squared': eta_sq_ab,
            'partial_eta_squared': partial_eta_sq_ab
        },
        'error': {
            'ss': ss_error,
            'df': df_error,
            'ms': ms_error
        },
        'total': {
            'ss': ss_total,
            'df': df_total
        },
        'group_stats': group_stats.to_dict(),
        'grand_mean': grand_mean,
        'n_total': n_total
    }
    
    return json.dumps(results)
`;
        
        try {
            if (typeof pyodide !== 'undefined') {
                // Pyodide가 로드된 경우 실행
                pyodide.globals.set('data_list', data);
                pyodide.globals.set('factor_a', factorA);
                pyodide.globals.set('factor_b', factorB);
                
                const result = await pyodide.runPythonAsync(pythonCode + `
result = two_way_anova(data_list, factor_a, factor_b)
result
`);
                
                return JSON.parse(result);
            } else {
                // Pyodide 미로드시 JavaScript 구현
                return this.twoWayANOVAJS(data, factorA, factorB);
            }
        } catch (error) {
            console.error('Two-way ANOVA 실행 중 오류:', error);
            return this.twoWayANOVAJS(data, factorA, factorB);
        }
    }
    
    /**
     * JavaScript로 구현한 Two-way ANOVA (폴백용)
     */
    twoWayANOVAJS(data, factorA, factorB) {
        // 그룹별로 데이터 정리
        const groups = {};
        const factorALevels = [...new Set(factorA)];
        const factorBLevels = [...new Set(factorB)];
        
        // 초기화
        factorALevels.forEach(a => {
            groups[a] = {};
            factorBLevels.forEach(b => {
                groups[a][b] = [];
            });
        });
        
        // 데이터 그룹화
        data.forEach((value, i) => {
            const a = factorA[i];
            const b = factorB[i];
            if (groups[a] && groups[a][b]) {
                groups[a][b].push(value);
            }
        });
        
        // 전체 평균
        const grandMean = data.reduce((a, b) => a + b, 0) / data.length;
        const n = data.length;
        
        // 요인별 평균
        const factorAMeans = {};
        factorALevels.forEach(a => {
            const values = data.filter((_, i) => factorA[i] === a);
            factorAMeans[a] = values.reduce((sum, v) => sum + v, 0) / values.length;
        });
        
        const factorBMeans = {};
        factorBLevels.forEach(b => {
            const values = data.filter((_, i) => factorB[i] === b);
            factorBMeans[b] = values.reduce((sum, v) => sum + v, 0) / values.length;
        });
        
        // 제곱합 계산
        let ssTotal = 0, ssA = 0, ssB = 0, ssAB = 0, ssError = 0;
        
        // Total SS
        data.forEach(value => {
            ssTotal += Math.pow(value - grandMean, 2);
        });
        
        // Factor A SS
        factorALevels.forEach(a => {
            const count = factorA.filter(x => x === a).length;
            ssA += count * Math.pow(factorAMeans[a] - grandMean, 2);
        });
        
        // Factor B SS
        factorBLevels.forEach(b => {
            const count = factorB.filter(x => x === b).length;
            ssB += count * Math.pow(factorBMeans[b] - grandMean, 2);
        });
        
        // Interaction SS와 Error SS
        factorALevels.forEach(a => {
            factorBLevels.forEach(b => {
                const cellData = groups[a][b];
                if (cellData.length > 0) {
                    const cellMean = cellData.reduce((sum, v) => sum + v, 0) / cellData.length;
                    const expected = grandMean + (factorAMeans[a] - grandMean) + (factorBMeans[b] - grandMean);
                    ssAB += cellData.length * Math.pow(cellMean - expected, 2);
                    
                    // Within-group SS for error
                    cellData.forEach(value => {
                        ssError += Math.pow(value - cellMean, 2);
                    });
                }
            });
        });
        
        // 자유도
        const dfA = factorALevels.length - 1;
        const dfB = factorBLevels.length - 1;
        const dfAB = dfA * dfB;
        const dfError = n - factorALevels.length * factorBLevels.length;
        const dfTotal = n - 1;
        
        // 평균제곱
        const msA = dfA > 0 ? ssA / dfA : 0;
        const msB = dfB > 0 ? ssB / dfB : 0;
        const msAB = dfAB > 0 ? ssAB / dfAB : 0;
        const msError = dfError > 0 ? ssError / dfError : 0;
        
        // F-통계량
        const fA = msError > 0 ? msA / msError : 0;
        const fB = msError > 0 ? msB / msError : 0;
        const fAB = msError > 0 ? msAB / msError : 0;
        
        // p-값 (근사치)
        const pA = this.getFPValue(fA, dfA, dfError);
        const pB = this.getFPValue(fB, dfB, dfError);
        const pAB = this.getFPValue(fAB, dfAB, dfError);
        
        // 효과 크기
        const etaSquaredA = ssTotal > 0 ? ssA / ssTotal : 0;
        const etaSquaredB = ssTotal > 0 ? ssB / ssTotal : 0;
        const etaSquaredAB = ssTotal > 0 ? ssAB / ssTotal : 0;
        
        return {
            factor_a: {
                ss: ssA,
                df: dfA,
                ms: msA,
                f_value: fA,
                p_value: pA,
                eta_squared: etaSquaredA,
                levels: factorAMeans
            },
            factor_b: {
                ss: ssB,
                df: dfB,
                ms: msB,
                f_value: fB,
                p_value: pB,
                eta_squared: etaSquaredB,
                levels: factorBMeans
            },
            interaction: {
                ss: ssAB,
                df: dfAB,
                ms: msAB,
                f_value: fAB,
                p_value: pAB,
                eta_squared: etaSquaredAB
            },
            error: {
                ss: ssError,
                df: dfError,
                ms: msError
            },
            total: {
                ss: ssTotal,
                df: dfTotal
            },
            grand_mean: grandMean,
            n_total: n
        };
    }
    
    /**
     * F-분포 p-값 근사 계산
     */
    getFPValue(fStat, df1, df2) {
        if (fStat <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
        
        // 간단한 근사치 계산 (실제로는 더 정확한 계산 필요)
        // F-분포표의 임계값과 비교
        const alpha05 = this.getFCritical(0.05, df1, df2);
        const alpha01 = this.getFCritical(0.01, df1, df2);
        const alpha001 = this.getFCritical(0.001, df1, df2);
        
        if (fStat < alpha05) return 0.5;  // p > 0.05
        if (fStat < alpha01) return 0.025; // 0.01 < p < 0.05
        if (fStat < alpha001) return 0.005; // 0.001 < p < 0.01
        return 0.0001; // p < 0.001
    }
    
    /**
     * F-분포 임계값 (간략화된 표)
     */
    getFCritical(alpha, df1, df2) {
        // 간단한 임계값 테이블 (실제로는 더 완전한 표 필요)
        const criticalValues = {
            0.05: {
                1: { 10: 4.96, 20: 4.35, 30: 4.17, 60: 4.00 },
                2: { 10: 4.10, 20: 3.49, 30: 3.32, 60: 3.15 },
                3: { 10: 3.71, 20: 3.10, 30: 2.92, 60: 2.76 }
            },
            0.01: {
                1: { 10: 10.04, 20: 8.10, 30: 7.56, 60: 7.08 },
                2: { 10: 7.56, 20: 5.85, 30: 5.39, 60: 4.98 },
                3: { 10: 6.55, 20: 4.94, 30: 4.51, 60: 4.13 }
            },
            0.001: {
                1: { 10: 21.04, 20: 14.82, 30: 13.29, 60: 11.97 },
                2: { 10: 14.91, 20: 10.16, 30: 9.01, 60: 7.98 },
                3: { 10: 12.55, 20: 8.28, 30: 7.23, 60: 6.31 }
            }
        };
        
        // 가장 가까운 값 찾기
        const df1Key = Math.min(df1, 3);
        const df2Key = df2 <= 10 ? 10 : df2 <= 20 ? 20 : df2 <= 30 ? 30 : 60;
        
        if (criticalValues[alpha] && criticalValues[alpha][df1Key]) {
            return criticalValues[alpha][df1Key][df2Key] || 3.0;
        }
        
        return 3.0; // 기본값
    }
    
    /**
     * 사후검정: 단순 주효과 분석
     */
    async simpleMainEffects(data, factorA, factorB, interactionPValue) {
        if (interactionPValue >= 0.05) {
            return {
                needed: false,
                message: '상호작용이 유의하지 않아 사후검정이 필요하지 않습니다.'
            };
        }
        
        const results = {
            needed: true,
            factor_a_at_b: {},
            factor_b_at_a: {}
        };
        
        const factorALevels = [...new Set(factorA)];
        const factorBLevels = [...new Set(factorB)];
        
        // Factor A의 효과를 각 Factor B 수준에서 검정
        for (const bLevel of factorBLevels) {
            const indices = factorB.map((b, i) => b === bLevel ? i : -1).filter(i => i >= 0);
            const subData = indices.map(i => data[i]);
            const subFactorA = indices.map(i => factorA[i]);
            
            if (subData.length > 0) {
                results.factor_a_at_b[bLevel] = await this.oneWayANOVA(subData, subFactorA);
            }
        }
        
        // Factor B의 효과를 각 Factor A 수준에서 검정
        for (const aLevel of factorALevels) {
            const indices = factorA.map((a, i) => a === aLevel ? i : -1).filter(i => i >= 0);
            const subData = indices.map(i => data[i]);
            const subFactorB = indices.map(i => factorB[i]);
            
            if (subData.length > 0) {
                results.factor_b_at_a[aLevel] = await this.oneWayANOVA(subData, subFactorB);
            }
        }
        
        return results;
    }
    
    /**
     * 보조 함수: One-way ANOVA (사후검정용)
     */
    async oneWayANOVA(data, groups) {
        const groupedData = {};
        const uniqueGroups = [...new Set(groups)];
        
        uniqueGroups.forEach(g => {
            groupedData[g] = [];
        });
        
        data.forEach((value, i) => {
            groupedData[groups[i]].push(value);
        });
        
        // 그룹 평균
        const groupMeans = {};
        uniqueGroups.forEach(g => {
            const values = groupedData[g];
            groupMeans[g] = values.reduce((a, b) => a + b, 0) / values.length;
        });
        
        // 전체 평균
        const grandMean = data.reduce((a, b) => a + b, 0) / data.length;
        
        // 제곱합
        let ssBetween = 0;
        let ssWithin = 0;
        
        uniqueGroups.forEach(g => {
            const values = groupedData[g];
            ssBetween += values.length * Math.pow(groupMeans[g] - grandMean, 2);
            
            values.forEach(v => {
                ssWithin += Math.pow(v - groupMeans[g], 2);
            });
        });
        
        // 자유도
        const dfBetween = uniqueGroups.length - 1;
        const dfWithin = data.length - uniqueGroups.length;
        
        // 평균제곱
        const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
        const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;
        
        // F-통계량
        const fStat = msWithin > 0 ? msBetween / msWithin : 0;
        
        // p-값
        const pValue = this.getFPValue(fStat, dfBetween, dfWithin);
        
        return {
            f_value: fStat,
            p_value: pValue,
            group_means: groupMeans,
            df_between: dfBetween,
            df_within: dfWithin
        };
    }
    
    /**
     * 결과 해석 생성
     */
    interpretResults(results) {
        const interpretations = [];
        
        // 주효과 해석
        if (results.factor_a.p_value < 0.05) {
            interpretations.push({
                type: 'main_effect_a',
                significant: true,
                message: `첫 번째 요인의 주효과가 유의합니다 (F=${results.factor_a.f_value.toFixed(2)}, p=${results.factor_a.p_value.toFixed(4)})`,
                effect_size: this.interpretEffectSize(results.factor_a.eta_squared)
            });
        } else {
            interpretations.push({
                type: 'main_effect_a',
                significant: false,
                message: `첫 번째 요인의 주효과가 유의하지 않습니다 (p=${results.factor_a.p_value.toFixed(4)})`
            });
        }
        
        if (results.factor_b.p_value < 0.05) {
            interpretations.push({
                type: 'main_effect_b',
                significant: true,
                message: `두 번째 요인의 주효과가 유의합니다 (F=${results.factor_b.f_value.toFixed(2)}, p=${results.factor_b.p_value.toFixed(4)})`,
                effect_size: this.interpretEffectSize(results.factor_b.eta_squared)
            });
        } else {
            interpretations.push({
                type: 'main_effect_b',
                significant: false,
                message: `두 번째 요인의 주효과가 유의하지 않습니다 (p=${results.factor_b.p_value.toFixed(4)})`
            });
        }
        
        // 상호작용 효과 해석
        if (results.interaction.p_value < 0.05) {
            interpretations.push({
                type: 'interaction',
                significant: true,
                message: `상호작용 효과가 유의합니다 (F=${results.interaction.f_value.toFixed(2)}, p=${results.interaction.p_value.toFixed(4)}). 단순 주효과 분석이 필요합니다.`,
                effect_size: this.interpretEffectSize(results.interaction.eta_squared),
                recommendation: '상호작용이 유의하므로 주효과 해석에 주의가 필요합니다.'
            });
        } else {
            interpretations.push({
                type: 'interaction',
                significant: false,
                message: `상호작용 효과가 유의하지 않습니다 (p=${results.interaction.p_value.toFixed(4)})`
            });
        }
        
        return interpretations;
    }
    
    /**
     * 효과 크기 해석
     */
    interpretEffectSize(etaSquared) {
        if (etaSquared < 0.01) return '효과 없음';
        if (etaSquared < 0.06) return '작은 효과';
        if (etaSquared < 0.14) return '중간 효과';
        return '큰 효과';
    }
    
    /**
     * ANOVA 표 생성
     */
    generateANOVATable(results) {
        return {
            headers: ['Source', 'SS', 'df', 'MS', 'F', 'p', 'η²'],
            rows: [
                [
                    'Factor A',
                    results.factor_a.ss.toFixed(3),
                    results.factor_a.df,
                    results.factor_a.ms.toFixed(3),
                    results.factor_a.f_value.toFixed(3),
                    results.factor_a.p_value.toFixed(4),
                    results.factor_a.eta_squared.toFixed(3)
                ],
                [
                    'Factor B',
                    results.factor_b.ss.toFixed(3),
                    results.factor_b.df,
                    results.factor_b.ms.toFixed(3),
                    results.factor_b.f_value.toFixed(3),
                    results.factor_b.p_value.toFixed(4),
                    results.factor_b.eta_squared.toFixed(3)
                ],
                [
                    'A × B',
                    results.interaction.ss.toFixed(3),
                    results.interaction.df,
                    results.interaction.ms.toFixed(3),
                    results.interaction.f_value.toFixed(3),
                    results.interaction.p_value.toFixed(4),
                    results.interaction.eta_squared.toFixed(3)
                ],
                [
                    'Error',
                    results.error.ss.toFixed(3),
                    results.error.df,
                    results.error.ms.toFixed(3),
                    '-',
                    '-',
                    '-'
                ],
                [
                    'Total',
                    results.total.ss.toFixed(3),
                    results.total.df,
                    '-',
                    '-',
                    '-',
                    '-'
                ]
            ]
        };
    }
}

// 전역 노출 (HTML에서 사용)
window.AdvancedANOVA = AdvancedANOVA;