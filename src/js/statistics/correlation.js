/**
 * Correlation Analysis Module
 * 상관분석 및 편상관분석 모듈
 */

export class CorrelationAnalysis {
    constructor() {
        this.results = {};
    }
    
    /**
     * Pearson 상관계수
     * @param {Array} x - 첫 번째 변수
     * @param {Array} y - 두 번째 변수
     * @returns {Object} 상관분석 결과
     */
    async pearsonCorrelation(x, y) {
        if (x.length !== y.length) {
            throw new Error('두 변수의 길이가 일치하지 않습니다');
        }
        
        const n = x.length;
        if (n < 3) {
            throw new Error('최소 3개 이상의 데이터가 필요합니다');
        }
        
        // Python 계산 시도
        if (typeof pyodide !== 'undefined') {
            try {
                const pythonCode = `
import numpy as np
from scipy import stats
import json

def pearson_correlation(x, y):
    """Pearson 상관계수 계산"""
    
    # 상관계수와 p-값
    r, p_value = stats.pearsonr(x, y)
    
    # 신뢰구간 계산 (Fisher's z-transformation)
    z = np.arctanh(r)
    se = 1 / np.sqrt(len(x) - 3)
    z_ci = [z - 1.96 * se, z + 1.96 * se]
    ci_lower = np.tanh(z_ci[0])
    ci_upper = np.tanh(z_ci[1])
    
    # t-통계량
    t_stat = r * np.sqrt((len(x) - 2) / (1 - r**2)) if abs(r) < 1 else 0
    
    # 결정계수
    r_squared = r ** 2
    
    return {
        'correlation': float(r),
        'p_value': float(p_value),
        'confidence_interval': {
            'lower': float(ci_lower),
            'upper': float(ci_upper),
            'level': 0.95
        },
        't_statistic': float(t_stat),
        'df': len(x) - 2,
        'r_squared': float(r_squared),
        'n': len(x),
        'interpretation': interpret_correlation(r)
    }

def interpret_correlation(r):
    """상관계수 해석"""
    abs_r = abs(r)
    if abs_r < 0.1:
        strength = '매우 약한'
    elif abs_r < 0.3:
        strength = '약한'
    elif abs_r < 0.5:
        strength = '중간'
    elif abs_r < 0.7:
        strength = '강한'
    else:
        strength = '매우 강한'
    
    direction = '양의' if r > 0 else '음의' if r < 0 else '없는'
    return f'{direction} {strength} 상관관계'

result = pearson_correlation(x, y)
json.dumps(result)
`;
                
                pyodide.globals.set('x', x);
                pyodide.globals.set('y', y);
                const result = await pyodide.runPythonAsync(pythonCode);
                return JSON.parse(result);
                
            } catch (error) {
                console.error('Python 실행 오류:', error);
            }
        }
        
        // JavaScript 폴백
        return this.pearsonCorrelationJS(x, y);
    }
    
    /**
     * JavaScript Pearson 상관계수 구현
     */
    pearsonCorrelationJS(x, y) {
        const n = x.length;
        
        // 평균
        const meanX = x.reduce((a, b) => a + b, 0) / n;
        const meanY = y.reduce((a, b) => a + b, 0) / n;
        
        // 편차
        let sumXY = 0, sumX2 = 0, sumY2 = 0;
        for (let i = 0; i < n; i++) {
            const dx = x[i] - meanX;
            const dy = y[i] - meanY;
            sumXY += dx * dy;
            sumX2 += dx * dx;
            sumY2 += dy * dy;
        }
        
        // 상관계수
        const r = sumX2 * sumY2 > 0 ? sumXY / Math.sqrt(sumX2 * sumY2) : 0;
        
        // t-통계량
        const tStat = Math.abs(r) < 1 ? r * Math.sqrt((n - 2) / (1 - r * r)) : 0;
        const df = n - 2;
        
        // p-값 (근사)
        const pValue = this.getTTestPValue(Math.abs(tStat), df);
        
        // 신뢰구간 (Fisher's z-transformation)
        const z = 0.5 * Math.log((1 + r) / (1 - r));
        const se = 1 / Math.sqrt(n - 3);
        const zLower = z - 1.96 * se;
        const zUpper = z + 1.96 * se;
        const ciLower = (Math.exp(2 * zLower) - 1) / (Math.exp(2 * zLower) + 1);
        const ciUpper = (Math.exp(2 * zUpper) - 1) / (Math.exp(2 * zUpper) + 1);
        
        return {
            correlation: r,
            p_value: pValue,
            confidence_interval: {
                lower: ciLower,
                upper: ciUpper,
                level: 0.95
            },
            t_statistic: tStat,
            df: df,
            r_squared: r * r,
            n: n,
            interpretation: this.interpretCorrelation(r)
        };
    }
    
    /**
     * Spearman 순위 상관계수
     */
    async spearmanCorrelation(x, y) {
        if (x.length !== y.length) {
            throw new Error('두 변수의 길이가 일치하지 않습니다');
        }
        
        // Python 계산 시도
        if (typeof pyodide !== 'undefined') {
            try {
                const pythonCode = `
import numpy as np
from scipy import stats
import json

def spearman_correlation(x, y):
    """Spearman 순위 상관계수"""
    
    # Spearman 상관계수
    rho, p_value = stats.spearmanr(x, y)
    
    # 순위 변환
    rank_x = stats.rankdata(x)
    rank_y = stats.rankdata(y)
    
    # 타이 보정
    n = len(x)
    d_squared = sum((rank_x[i] - rank_y[i])**2 for i in range(n))
    
    # 타이가 있는 경우 보정
    def count_ties(ranks):
        ties = {}
        for r in ranks:
            ties[r] = ties.get(r, 0) + 1
        return sum(t*(t**2-1) for t in ties.values() if t > 1) / 12
    
    tx = count_ties(rank_x)
    ty = count_ties(rank_y)
    
    if tx > 0 or ty > 0:
        # 타이 보정된 공식
        sum_x2 = (n*(n**2-1)/12) - tx
        sum_y2 = (n*(n**2-1)/12) - ty
        rho_corrected = (sum_x2 + sum_y2 - d_squared) / (2 * np.sqrt(sum_x2 * sum_y2))
    else:
        rho_corrected = 1 - (6 * d_squared) / (n * (n**2 - 1))
    
    # z-통계량 (큰 표본)
    if n > 10:
        z_stat = rho * np.sqrt(n - 1)
        p_approx = 2 * (1 - stats.norm.cdf(abs(z_stat)))
    else:
        z_stat = None
        p_approx = p_value
    
    return {
        'correlation': float(rho),
        'p_value': float(p_value),
        'n': n,
        'd_squared': float(d_squared),
        'ties_x': float(tx),
        'ties_y': float(ty),
        'z_statistic': float(z_stat) if z_stat else None,
        'interpretation': interpret_correlation(rho)
    }

def interpret_correlation(r):
    abs_r = abs(r)
    if abs_r < 0.1:
        strength = '매우 약한'
    elif abs_r < 0.3:
        strength = '약한'
    elif abs_r < 0.5:
        strength = '중간'
    elif abs_r < 0.7:
        strength = '강한'
    else:
        strength = '매우 강한'
    
    direction = '양의' if r > 0 else '음의' if r < 0 else '없는'
    return f'{direction} {strength} 상관관계'

result = spearman_correlation(x, y)
json.dumps(result)
`;
                
                pyodide.globals.set('x', x);
                pyodide.globals.set('y', y);
                const result = await pyodide.runPythonAsync(pythonCode);
                return JSON.parse(result);
                
            } catch (error) {
                console.error('Python 실행 오류:', error);
            }
        }
        
        // JavaScript 폴백
        return this.spearmanCorrelationJS(x, y);
    }
    
    /**
     * JavaScript Spearman 상관계수 구현
     */
    spearmanCorrelationJS(x, y) {
        const n = x.length;
        
        // 순위 변환
        const rankX = this.getRanks(x);
        const rankY = this.getRanks(y);
        
        // 순위 차이의 제곱합
        let dSquared = 0;
        for (let i = 0; i < n; i++) {
            const d = rankX[i] - rankY[i];
            dSquared += d * d;
        }
        
        // Spearman rho
        const rho = 1 - (6 * dSquared) / (n * (n * n - 1));
        
        // p-값 (근사)
        const tStat = rho * Math.sqrt((n - 2) / (1 - rho * rho));
        const pValue = this.getTTestPValue(Math.abs(tStat), n - 2);
        
        return {
            correlation: rho,
            p_value: pValue,
            n: n,
            d_squared: dSquared,
            interpretation: this.interpretCorrelation(rho)
        };
    }
    
    /**
     * Kendall's tau 상관계수
     */
    async kendallCorrelation(x, y) {
        if (x.length !== y.length) {
            throw new Error('두 변수의 길이가 일치하지 않습니다');
        }
        
        // Python 계산 시도
        if (typeof pyodide !== 'undefined') {
            try {
                const pythonCode = `
import numpy as np
from scipy import stats
import json

def kendall_correlation(x, y):
    """Kendall's tau 상관계수"""
    
    tau, p_value = stats.kendalltau(x, y)
    
    n = len(x)
    
    # 일치/불일치 쌍 계산
    concordant = 0
    discordant = 0
    ties_x = 0
    ties_y = 0
    
    for i in range(n):
        for j in range(i+1, n):
            x_diff = x[i] - x[j]
            y_diff = y[i] - y[j]
            
            if x_diff * y_diff > 0:
                concordant += 1
            elif x_diff * y_diff < 0:
                discordant += 1
            elif x_diff == 0:
                ties_x += 1
            elif y_diff == 0:
                ties_y += 1
    
    # tau-b (타이 보정)
    total_pairs = n * (n - 1) / 2
    
    return {
        'correlation': float(tau),
        'p_value': float(p_value),
        'concordant': int(concordant),
        'discordant': int(discordant),
        'ties_x': int(ties_x),
        'ties_y': int(ties_y),
        'total_pairs': int(total_pairs),
        'n': n,
        'interpretation': interpret_correlation(tau)
    }

def interpret_correlation(r):
    abs_r = abs(r)
    if abs_r < 0.1:
        strength = '매우 약한'
    elif abs_r < 0.3:
        strength = '약한'
    elif abs_r < 0.5:
        strength = '중간'
    elif abs_r < 0.7:
        strength = '강한'
    else:
        strength = '매우 강한'
    
    direction = '양의' if r > 0 else '음의' if r < 0 else '없는'
    return f'{direction} {strength} 상관관계'

result = kendall_correlation(x, y)
json.dumps(result)
`;
                
                pyodide.globals.set('x', x);
                pyodide.globals.set('y', y);
                const result = await pyodide.runPythonAsync(pythonCode);
                return JSON.parse(result);
                
            } catch (error) {
                console.error('Python 실행 오류:', error);
            }
        }
        
        // JavaScript 폴백
        return this.kendallCorrelationJS(x, y);
    }
    
    /**
     * JavaScript Kendall's tau 구현
     */
    kendallCorrelationJS(x, y) {
        const n = x.length;
        let concordant = 0;
        let discordant = 0;
        let tiesX = 0;
        let tiesY = 0;
        
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const xDiff = x[i] - x[j];
                const yDiff = y[i] - y[j];
                
                if (xDiff * yDiff > 0) {
                    concordant++;
                } else if (xDiff * yDiff < 0) {
                    discordant++;
                } else if (xDiff === 0 && yDiff !== 0) {
                    tiesX++;
                } else if (yDiff === 0 && xDiff !== 0) {
                    tiesY++;
                }
            }
        }
        
        const totalPairs = n * (n - 1) / 2;
        const tau = (concordant - discordant) / totalPairs;
        
        // p-값 (근사)
        const z = 3 * tau * Math.sqrt(n * (n - 1)) / Math.sqrt(2 * (2 * n + 5));
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
        
        return {
            correlation: tau,
            p_value: pValue,
            concordant: concordant,
            discordant: discordant,
            ties_x: tiesX,
            ties_y: tiesY,
            total_pairs: totalPairs,
            n: n,
            interpretation: this.interpretCorrelation(tau)
        };
    }
    
    /**
     * 편상관분석 (제3변수 통제)
     */
    async partialCorrelation(x, y, z) {
        if (x.length !== y.length || x.length !== z.length) {
            throw new Error('모든 변수의 길이가 일치해야 합니다');
        }
        
        // Python 계산 시도
        if (typeof pyodide !== 'undefined') {
            try {
                const pythonCode = `
import numpy as np
from scipy import stats
import json

def partial_correlation(x, y, z):
    """편상관계수 계산 (z 통제)"""
    
    # 각 상관계수 계산
    r_xy, _ = stats.pearsonr(x, y)
    r_xz, _ = stats.pearsonr(x, z)
    r_yz, _ = stats.pearsonr(y, z)
    
    # 편상관계수
    numerator = r_xy - (r_xz * r_yz)
    denominator = np.sqrt((1 - r_xz**2) * (1 - r_yz**2))
    
    r_xy_z = numerator / denominator if denominator != 0 else 0
    
    # t-통계량과 p-값
    n = len(x)
    df = n - 3
    t_stat = r_xy_z * np.sqrt(df / (1 - r_xy_z**2)) if abs(r_xy_z) < 1 else 0
    p_value = 2 * (1 - stats.t.cdf(abs(t_stat), df))
    
    # 신뢰구간
    z_transform = np.arctanh(r_xy_z)
    se = 1 / np.sqrt(n - 3)
    z_ci = [z_transform - 1.96 * se, z_transform + 1.96 * se]
    ci_lower = np.tanh(z_ci[0])
    ci_upper = np.tanh(z_ci[1])
    
    return {
        'partial_correlation': float(r_xy_z),
        'p_value': float(p_value),
        't_statistic': float(t_stat),
        'df': df,
        'confidence_interval': {
            'lower': float(ci_lower),
            'upper': float(ci_upper),
            'level': 0.95
        },
        'zero_order_correlations': {
            'r_xy': float(r_xy),
            'r_xz': float(r_xz),
            'r_yz': float(r_yz)
        },
        'n': n,
        'interpretation': interpret_partial(r_xy, r_xy_z)
    }

def interpret_partial(r_original, r_partial):
    """편상관 결과 해석"""
    diff = abs(r_original) - abs(r_partial)
    if abs(diff) < 0.1:
        return '제3변수의 영향이 미미함'
    elif diff > 0:
        return '제3변수가 상관관계를 부분적으로 설명함'
    else:
        return '제3변수 통제 후 상관관계가 강화됨'

result = partial_correlation(x, y, z)
json.dumps(result)
`;
                
                pyodide.globals.set('x', x);
                pyodide.globals.set('y', y);
                pyodide.globals.set('z', z);
                const result = await pyodide.runPythonAsync(pythonCode);
                return JSON.parse(result);
                
            } catch (error) {
                console.error('Python 실행 오류:', error);
            }
        }
        
        // JavaScript 폴백
        return this.partialCorrelationJS(x, y, z);
    }
    
    /**
     * JavaScript 편상관계수 구현
     */
    partialCorrelationJS(x, y, z) {
        // 각 상관계수
        const rXY = this.pearsonCorrelationJS(x, y).correlation;
        const rXZ = this.pearsonCorrelationJS(x, z).correlation;
        const rYZ = this.pearsonCorrelationJS(y, z).correlation;
        
        // 편상관계수
        const numerator = rXY - (rXZ * rYZ);
        const denominator = Math.sqrt((1 - rXZ * rXZ) * (1 - rYZ * rYZ));
        const rXY_Z = denominator !== 0 ? numerator / denominator : 0;
        
        // t-통계량
        const n = x.length;
        const df = n - 3;
        const tStat = Math.abs(rXY_Z) < 1 ? rXY_Z * Math.sqrt(df / (1 - rXY_Z * rXY_Z)) : 0;
        
        // p-값
        const pValue = this.getTTestPValue(Math.abs(tStat), df);
        
        return {
            partial_correlation: rXY_Z,
            p_value: pValue,
            t_statistic: tStat,
            df: df,
            zero_order_correlations: {
                r_xy: rXY,
                r_xz: rXZ,
                r_yz: rYZ
            },
            n: n,
            interpretation: this.interpretPartial(rXY, rXY_Z)
        };
    }
    
    /**
     * 상관행렬 계산
     */
    async correlationMatrix(data, method = 'pearson') {
        const variables = Object.keys(data);
        const n = variables.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(null));
        const pValues = Array(n).fill(null).map(() => Array(n).fill(null));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 1.0;
                    pValues[i][j] = 0.0;
                } else if (j > i) {
                    let result;
                    if (method === 'pearson') {
                        result = await this.pearsonCorrelation(data[variables[i]], data[variables[j]]);
                    } else if (method === 'spearman') {
                        result = await this.spearmanCorrelation(data[variables[i]], data[variables[j]]);
                    } else if (method === 'kendall') {
                        result = await this.kendallCorrelation(data[variables[i]], data[variables[j]]);
                    }
                    
                    matrix[i][j] = result.correlation;
                    matrix[j][i] = result.correlation;
                    pValues[i][j] = result.p_value;
                    pValues[j][i] = result.p_value;
                }
            }
        }
        
        return {
            variables: variables,
            matrix: matrix,
            p_values: pValues,
            method: method,
            n_variables: n,
            significant_pairs: this.findSignificantPairs(matrix, pValues, variables)
        };
    }
    
    /**
     * 유의한 상관관계 쌍 찾기
     */
    findSignificantPairs(matrix, pValues, variables, alpha = 0.05) {
        const pairs = [];
        const n = variables.length;
        
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (pValues[i][j] < alpha) {
                    pairs.push({
                        var1: variables[i],
                        var2: variables[j],
                        correlation: matrix[i][j],
                        p_value: pValues[i][j],
                        interpretation: this.interpretCorrelation(matrix[i][j])
                    });
                }
            }
        }
        
        // 상관계수 절대값으로 정렬
        pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
        
        return pairs;
    }
    
    // 보조 함수들
    
    /**
     * 순위 계산
     */
    getRanks(arr) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const ranks = arr.map(v => {
            const firstIndex = sorted.indexOf(v);
            const lastIndex = sorted.lastIndexOf(v);
            return (firstIndex + lastIndex) / 2 + 1;
        });
        return ranks;
    }
    
    /**
     * 상관계수 해석
     */
    interpretCorrelation(r) {
        const absR = Math.abs(r);
        let strength;
        
        if (absR < 0.1) strength = '매우 약한';
        else if (absR < 0.3) strength = '약한';
        else if (absR < 0.5) strength = '중간';
        else if (absR < 0.7) strength = '강한';
        else strength = '매우 강한';
        
        const direction = r > 0 ? '양의' : r < 0 ? '음의' : '없는';
        
        return `${direction} ${strength} 상관관계`;
    }
    
    /**
     * 편상관 해석
     */
    interpretPartial(rOriginal, rPartial) {
        const diff = Math.abs(rOriginal) - Math.abs(rPartial);
        
        if (Math.abs(diff) < 0.1) {
            return '제3변수의 영향이 미미함';
        } else if (diff > 0) {
            return '제3변수가 상관관계를 부분적으로 설명함';
        } else {
            return '제3변수 통제 후 상관관계가 강화됨';
        }
    }
    
    /**
     * t-분포 p-값 근사
     */
    getTTestPValue(tStat, df) {
        // 간단한 근사 (실제로는 더 정확한 계산 필요)
        if (df <= 0) return 1.0;
        
        // t-분포 임계값과 비교
        const critical = {
            0.05: [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228],
            0.01: [63.657, 9.925, 5.841, 4.604, 4.032, 3.707, 3.499, 3.355, 3.250, 3.169],
            0.001: [636.619, 31.598, 12.924, 8.610, 6.869, 5.959, 5.408, 5.041, 4.781, 4.587]
        };
        
        const dfIndex = Math.min(df - 1, 9);
        
        if (tStat < critical[0.05][dfIndex]) return 0.5;
        if (tStat < critical[0.01][dfIndex]) return 0.025;
        if (tStat < critical[0.001][dfIndex]) return 0.005;
        return 0.0001;
    }
    
    /**
     * 정규분포 CDF 근사
     */
    normalCDF(z) {
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;
        
        const sign = z < 0 ? -1 : 1;
        z = Math.abs(z) / Math.sqrt(2.0);
        
        const t = 1.0 / (1.0 + p * z);
        const t2 = t * t;
        const t3 = t2 * t;
        const t4 = t3 * t;
        const t5 = t4 * t;
        
        const y = 1.0 - (((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * Math.exp(-z * z));
        
        return 0.5 * (1.0 + sign * y);
    }
    
    /**
     * 결과 포맷팅
     */
    formatResults(results, type = 'pearson') {
        const output = {
            method: type.charAt(0).toUpperCase() + type.slice(1) + ' 상관분석',
            correlation: results.correlation.toFixed(4),
            p_value: results.p_value.toFixed(4),
            significance: results.p_value < 0.05 ? '유의함' : '유의하지 않음',
            interpretation: results.interpretation
        };
        
        if (results.confidence_interval) {
            output.confidence_interval = `[${results.confidence_interval.lower.toFixed(4)}, ${results.confidence_interval.upper.toFixed(4)}]`;
        }
        
        if (results.r_squared !== undefined) {
            output.r_squared = (results.r_squared * 100).toFixed(2) + '%';
            output.explanation = `변동의 ${output.r_squared}를 설명`;
        }
        
        return output;
    }
}

// 전역 노출 (HTML에서 사용)
window.CorrelationAnalysis = CorrelationAnalysis;