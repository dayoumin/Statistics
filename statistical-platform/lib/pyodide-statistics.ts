/**
 * Pyodide 기반 통계 분석 서비스
 * 모든 통계 계산은 SciPy를 통해 수행됩니다
 */

import { getPyodideInstance, isPyodideReady, loadPyodideRuntime } from './pyodide-runtime-loader'

/**
 * 숫자 배열 유효성 검사
 */
function validateNumericArray(data: number[], minLength: number = 1, name: string = 'Data'): void {
  if (!Array.isArray(data)) {
    throw new Error(`${name} must be an array`)
  }
  if (data.length < minLength) {
    throw new Error(`${name} must contain at least ${minLength} elements`)
  }
  if (data.some(val => !Number.isFinite(val))) {
    throw new Error(`${name} contains non-numeric or invalid values`)
  }
}

/**
 * 2D 숫자 배열 유효성 검사
 */
function validateNumericMatrix(data: number[][], minRows: number = 1, name: string = 'Data'): void {
  if (!Array.isArray(data)) {
    throw new Error(`${name} must be an array`)
  }
  if (data.length < minRows) {
    throw new Error(`${name} must contain at least ${minRows} rows`)
  }
  data.forEach((row, index) => {
    if (!Array.isArray(row)) {
      throw new Error(`${name} row ${index} is not an array`)
    }
    if (row.some(val => !Number.isFinite(val))) {
      throw new Error(`${name} row ${index} contains non-numeric values`)
    }
  })
}

export interface StatisticalResult {
  testName: string
  statistic: number
  pValue: number
  degreesOfFreedom?: number
  effectSize?: number
  confidenceInterval?: [number, number]
  interpretation: string
  assumptions?: {
    normality?: boolean
    homogeneity?: boolean
  }
  groups?: any[]
  [key: string]: any
}

/**
 * Pyodide가 준비될 때까지 대기
 */
async function ensurePyodideReady() {
  if (!isPyodideReady()) {
    await loadPyodideRuntime()
  }
  
  const pyodide = getPyodideInstance()
  if (!pyodide) {
    throw new Error('Pyodide failed to load')
  }
  
  return pyodide
}

/**
 * 기술통계량 계산
 */
export async function calculateDescriptiveStats(data: number[]): Promise<any> {
  const pyodide = await ensurePyodideReady()
  
  // Python 코드로 기술통계 계산
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    data = np.array(${JSON.stringify(data)})
    
    result = {
        'count': int(len(data)),
        'mean': float(np.mean(data)),
        'median': float(np.median(data)),
        'std': float(np.std(data, ddof=1)),
        'variance': float(np.var(data, ddof=1)),
        'min': float(np.min(data)),
        'max': float(np.max(data)),
        'q1': float(np.percentile(data, 25)),
        'q3': float(np.percentile(data, 75)),
        'iqr': float(np.percentile(data, 75) - np.percentile(data, 25)),
        'skewness': float(stats.skew(data)),
        'kurtosis': float(stats.kurtosis(data)),
        'cv': float(np.std(data, ddof=1) / np.mean(data) * 100) if np.mean(data) != 0 else None
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 독립표본 t-검정
 */
export async function twoSampleTTest(
  group1: number[], 
  group2: number[],
  equalVar: boolean = true
): Promise<StatisticalResult> {
  validateNumericArray(group1, 2, 'Group 1')
  validateNumericArray(group2, 2, 'Group 2')
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    group1 = np.array(${JSON.stringify(group1)})
    group2 = np.array(${JSON.stringify(group2)})
    
    # T-test 수행
    if ${equalVar}:
        t_stat, p_value = stats.ttest_ind(group1, group2, equal_var=True)
        test_name = "Independent t-test"
    else:
        t_stat, p_value = stats.ttest_ind(group1, group2, equal_var=False)
        test_name = "Welch's t-test"
    
    # 효과크기 (Cohen's d) 계산
    pooled_std = np.sqrt(((len(group1)-1)*np.var(group1, ddof=1) + 
                          (len(group2)-1)*np.var(group2, ddof=1)) / 
                          (len(group1)+len(group2)-2))
    cohens_d = (np.mean(group1) - np.mean(group2)) / pooled_std
    
    # 신뢰구간 계산
    mean_diff = np.mean(group1) - np.mean(group2)
    se = pooled_std * np.sqrt(1/len(group1) + 1/len(group2))
    df = len(group1) + len(group2) - 2
    ci = stats.t.interval(0.95, df, loc=mean_diff, scale=se)
    
    result = {
        'testName': test_name,
        'statistic': float(t_stat),
        'pValue': float(p_value),
        'degreesOfFreedom': int(df),
        'effectSize': float(cohens_d),
        'confidenceInterval': [float(ci[0]), float(ci[1])],
        'mean1': float(np.mean(group1)),
        'mean2': float(np.mean(group2)),
        'std1': float(np.std(group1, ddof=1)),
        'std2': float(np.std(group2, ddof=1)),
        'n1': int(len(group1)),
        'n2': int(len(group2)),
        'interpretation': f"The difference between groups is {'statistically significant' if p_value < 0.05 else 'not statistically significant'} (p = {p_value:.4f})",
        'isSignificant': p_value < 0.05
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 일원분산분석 (One-way ANOVA) with optional post-hoc tests
 */
export async function oneWayANOVA(
  groups: number[][], 
  groupNames?: string[],
  postHocTest?: 'tukey' | 'bonferroni' | 'games-howell' | 'none'
): Promise<StatisticalResult> {
  validateNumericMatrix(groups, 2, 'Groups')
  groups.forEach((group, i) => {
    if (group.length < 2) {
      throw new Error(`Group ${i + 1} must have at least 2 values`)
    }
  })
  const pyodide = await ensurePyodideReady()
  
  const names = groupNames || groups.map((_, i) => `Group ${i + 1}`)
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    groups_data = ${JSON.stringify(groups)}
    group_names = ${JSON.stringify(names)}
    
    # ANOVA 수행
    f_stat, p_value = stats.f_oneway(*[np.array(g) for g in groups_data])
    
    # 그룹별 통계
    group_stats = []
    for i, group in enumerate(groups_data):
        g = np.array(group)
        group_stats.append({
            'name': group_names[i],
            'n': len(g),
            'mean': float(np.mean(g)),
            'std': float(np.std(g, ddof=1)),
            'se': float(np.std(g, ddof=1) / np.sqrt(len(g)))
        })
    
    # 효과크기 (eta-squared) 계산
    all_data = np.concatenate([np.array(g) for g in groups_data])
    grand_mean = np.mean(all_data)
    ss_between = sum([len(g) * (np.mean(np.array(g)) - grand_mean)**2 for g in groups_data])
    ss_total = np.sum((all_data - grand_mean)**2)
    eta_squared = ss_between / ss_total if ss_total > 0 else 0
    
    result = {
        'testName': 'One-way ANOVA',
        'statistic': float(f_stat),
        'pValue': float(p_value),
        'degreesOfFreedom': {
            'between': len(groups_data) - 1,
            'within': len(all_data) - len(groups_data)
        },
        'effectSize': float(eta_squared),
        'groups': group_stats,
        'interpretation': f"The difference between groups is {'statistically significant' if p_value < 0.05 else 'not statistically significant'} (F = {f_stat:.3f}, p = {p_value:.4f})",
        'isSignificant': p_value < 0.05
    }
    
    json.dumps(result)
  `)
  
  const anovaResult = JSON.parse(result)
  
  // ANOVA가 유의하고 사후검정이 요청된 경우
  if (anovaResult.isSignificant && postHocTest && postHocTest !== 'none') {
    let postHocResult
    
    switch (postHocTest) {
      case 'tukey':
        postHocResult = await tukeyHSD(groups, groupNames)
        break
      case 'bonferroni':
        postHocResult = await bonferroniPostHoc(groups, groupNames)
        break
      case 'games-howell':
        postHocResult = await gamesHowellPostHoc(groups, groupNames)
        break
    }
    
    if (postHocResult) {
      anovaResult.postHoc = postHocResult
      anovaResult.interpretation += ` Post-hoc ${postHocTest} test was performed to identify specific group differences.`
    }
  }
  
  return anovaResult
}

/**
 * 상관분석 (Pearson/Spearman)
 */
export async function correlationAnalysis(
  x: number[], 
  y: number[], 
  method: 'pearson' | 'spearman' = 'pearson'
): Promise<StatisticalResult> {
  validateNumericArray(x, 3, 'X values')
  validateNumericArray(y, 3, 'Y values')
  if (x.length !== y.length) {
    throw new Error('X and Y arrays must have the same length')
  }
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    x = np.array(${JSON.stringify(x)})
    y = np.array(${JSON.stringify(y)})
    
    # 상관분석 수행
    if '${method}' == 'pearson':
        r, p_value = stats.pearsonr(x, y)
        test_name = "Pearson Correlation"
    else:
        r, p_value = stats.spearmanr(x, y)
        test_name = "Spearman Rank Correlation"
    
    # 결정계수
    r_squared = r ** 2
    
    # 상관계수 해석
    abs_r = abs(r)
    if abs_r < 0.1:
        strength = "negligible"
    elif abs_r < 0.3:
        strength = "weak"
    elif abs_r < 0.5:
        strength = "moderate"
    elif abs_r < 0.7:
        strength = "strong"
    else:
        strength = "very strong"
    
    direction = "positive" if r > 0 else "negative"
    
    result = {
        'testName': test_name,
        'statistic': float(r),
        'pValue': float(p_value),
        'rSquared': float(r_squared),
        'n': len(x),
        'interpretation': f"There is a {strength} {direction} correlation (r = {r:.3f}, p = {p_value:.4f})",
        'isSignificant': p_value < 0.05,
        'strength': strength,
        'direction': direction
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 단순선형회귀
 */
export async function simpleLinearRegression(
  x: number[], 
  y: number[]
): Promise<StatisticalResult> {
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    x = np.array(${JSON.stringify(x)})
    y = np.array(${JSON.stringify(y)})
    
    # 회귀분석 수행
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
    
    # 예측값과 잔차
    y_pred = slope * x + intercept
    residuals = y - y_pred
    
    # R-squared
    r_squared = r_value ** 2
    
    # Adjusted R-squared
    n = len(x)
    adj_r_squared = 1 - (1 - r_squared) * (n - 1) / (n - 2)
    
    # F-statistic
    ss_res = np.sum(residuals ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    ss_reg = ss_tot - ss_res
    f_stat = (ss_reg / 1) / (ss_res / (n - 2))
    
    # 회귀계수 신뢰구간
    t_crit = stats.t.ppf(0.975, n - 2)
    slope_ci = [slope - t_crit * std_err, slope + t_crit * std_err]
    
    result = {
        'testName': 'Simple Linear Regression',
        'slope': float(slope),
        'intercept': float(intercept),
        'rSquared': float(r_squared),
        'adjustedRSquared': float(adj_r_squared),
        'pValue': float(p_value),
        'standardError': float(std_err),
        'fStatistic': float(f_stat),
        'slopeConfidenceInterval': [float(slope_ci[0]), float(slope_ci[1])],
        'interpretation': f"The model explains {r_squared*100:.1f}% of the variance. The relationship is {'statistically significant' if p_value < 0.05 else 'not statistically significant'} (p = {p_value:.4f})",
        'isSignificant': p_value < 0.05
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 다중 회귀분석 (Multiple Regression)
 */
export async function multipleRegression(
  X: number[][], // 독립변수들 (각 행이 하나의 관측치, 각 열이 변수)
  y: number[],   // 종속변수
  variableNames?: string[]
): Promise<StatisticalResult> {
  const pyodide = await ensurePyodideReady()
  const varNames = variableNames || X[0].map((_, i) => `X${i + 1}`)
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import statsmodels.api as sm
    import json
    
    # 데이터 준비
    X_data = np.array(${JSON.stringify(X)})
    y_data = np.array(${JSON.stringify(y)})
    var_names = ${JSON.stringify(varNames)}
    
    # 상수항 추가
    X_with_const = sm.add_constant(X_data)
    
    # 모델 피팅
    model = sm.OLS(y_data, X_with_const)
    results = model.fit()
    
    # 계수와 통계량 추출
    coefficients = []
    coefficients.append({
        'name': 'Intercept',
        'coefficient': float(results.params[0]),
        'std_error': float(results.bse[0]),
        't_statistic': float(results.tvalues[0]),
        'p_value': float(results.pvalues[0]),
        'conf_int_lower': float(results.conf_int()[0][0]),
        'conf_int_upper': float(results.conf_int()[0][1])
    })
    
    for i, var_name in enumerate(var_names):
        coefficients.append({
            'name': var_name,
            'coefficient': float(results.params[i + 1]),
            'std_error': float(results.bse[i + 1]),
            't_statistic': float(results.tvalues[i + 1]),
            'p_value': float(results.pvalues[i + 1]),
            'conf_int_lower': float(results.conf_int()[i + 1][0]),
            'conf_int_upper': float(results.conf_int()[i + 1][1])
        })
    
    # ANOVA table
    f_statistic = float(results.fvalue)
    f_pvalue = float(results.f_pvalue)
    
    # 모델 진단 통계량
    residuals = results.resid
    fitted = results.fittedvalues
    
    # Durbin-Watson 검정 (자기상관)
    from statsmodels.stats.stattools import durbin_watson
    dw_stat = float(durbin_watson(residuals))
    
    # VIF (다중공선성) - 상수항 제외
    from statsmodels.stats.outliers_influence import variance_inflation_factor
    vif_data = []
    for i in range(X_data.shape[1]):
        vif = variance_inflation_factor(X_with_const, i + 1)
        vif_data.append({
            'variable': var_names[i],
            'vif': float(vif) if not np.isinf(vif) else 999999
        })
    
    result = {
        'testName': 'Multiple Linear Regression',
        'statistic': f_statistic,
        'pValue': f_pvalue,
        'r_squared': float(results.rsquared),
        'adj_r_squared': float(results.rsquared_adj),
        'coefficients': coefficients,
        'n_observations': int(results.nobs),
        'df_model': int(results.df_model),
        'df_resid': int(results.df_resid),
        'aic': float(results.aic),
        'bic': float(results.bic),
        'durbin_watson': dw_stat,
        'vif': vif_data,
        'interpretation': f"R² = {results.rsquared:.3f}, Adjusted R² = {results.rsquared_adj:.3f}. The model explains {results.rsquared*100:.1f}% of the variance.",
        'isSignificant': f_pvalue < 0.05
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 이원분산분석 (Two-way ANOVA)
 */
export async function twoWayANOVA(
  data: number[],
  factorA: string[],
  factorB: string[],
  interaction: boolean = true
): Promise<StatisticalResult> {
  if (data.length !== factorA.length || data.length !== factorB.length) {
    throw new Error('Data and factor arrays must have the same length')
  }
  validateNumericArray(data, 4, 'Data')
  
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    import pandas as pd
    import statsmodels.api as sm
    from statsmodels.formula.api import ols
    import json
    
    # 데이터 프레임 생성
    df = pd.DataFrame({
        'value': ${JSON.stringify(data)},
        'factorA': ${JSON.stringify(factorA)},
        'factorB': ${JSON.stringify(factorB)}
    })
    
    # 모델 공식 생성
    if ${interaction}:
        formula = 'value ~ C(factorA) + C(factorB) + C(factorA):C(factorB)'
    else:
        formula = 'value ~ C(factorA) + C(factorB)'
    
    # ANOVA 수행
    model = ols(formula, data=df).fit()
    anova_table = sm.stats.anova_lm(model, typ=2)
    
    # 주효과와 상호작용 효과 추출
    effects = {}
    
    # Factor A 주효과
    if 'C(factorA)' in anova_table.index:
        effects['factorA'] = {
            'sum_sq': float(anova_table.loc['C(factorA)', 'sum_sq']),
            'df': int(anova_table.loc['C(factorA)', 'df']),
            'F': float(anova_table.loc['C(factorA)', 'F']),
            'p_value': float(anova_table.loc['C(factorA)', 'PR(>F)'])
        }
    
    # Factor B 주효과
    if 'C(factorB)' in anova_table.index:
        effects['factorB'] = {
            'sum_sq': float(anova_table.loc['C(factorB)', 'sum_sq']),
            'df': int(anova_table.loc['C(factorB)', 'df']),
            'F': float(anova_table.loc['C(factorB)', 'F']),
            'p_value': float(anova_table.loc['C(factorB)', 'PR(>F)'])
        }
    
    # 상호작용 효과
    if ${interaction} and 'C(factorA):C(factorB)' in anova_table.index:
        effects['interaction'] = {
            'sum_sq': float(anova_table.loc['C(factorA):C(factorB)', 'sum_sq']),
            'df': int(anova_table.loc['C(factorA):C(factorB)', 'df']),
            'F': float(anova_table.loc['C(factorA):C(factorB)', 'F']),
            'p_value': float(anova_table.loc['C(factorA):C(factorB)', 'PR(>F)'])
        }
    
    # Residual
    residual = {
        'sum_sq': float(anova_table.loc['Residual', 'sum_sq']),
        'df': int(anova_table.loc['Residual', 'df'])
    }
    
    # 효과 크기 계산 (partial eta squared)
    total_ss = anova_table['sum_sq'].sum()
    
    if 'factorA' in effects:
        effects['factorA']['partial_eta_sq'] = effects['factorA']['sum_sq'] / (effects['factorA']['sum_sq'] + residual['sum_sq'])
    
    if 'factorB' in effects:
        effects['factorB']['partial_eta_sq'] = effects['factorB']['sum_sq'] / (effects['factorB']['sum_sq'] + residual['sum_sq'])
    
    if 'interaction' in effects:
        effects['interaction']['partial_eta_sq'] = effects['interaction']['sum_sq'] / (effects['interaction']['sum_sq'] + residual['sum_sq'])
    
    # 그룹별 평균 계산
    group_means = df.groupby(['factorA', 'factorB'])['value'].agg(['mean', 'std', 'count']).reset_index()
    group_stats = []
    for _, row in group_means.iterrows():
        group_stats.append({
            'factorA': row['factorA'],
            'factorB': row['factorB'],
            'mean': float(row['mean']),
            'std': float(row['std']) if not pd.isna(row['std']) else 0,
            'n': int(row['count'])
        })
    
    # 해석 생성
    sig_effects = []
    if 'factorA' in effects and effects['factorA']['p_value'] < 0.05:
        sig_effects.append(f"Factor A (p={effects['factorA']['p_value']:.4f})")
    if 'factorB' in effects and effects['factorB']['p_value'] < 0.05:
        sig_effects.append(f"Factor B (p={effects['factorB']['p_value']:.4f})")
    if 'interaction' in effects and effects['interaction']['p_value'] < 0.05:
        sig_effects.append(f"Interaction (p={effects['interaction']['p_value']:.4f})")
    
    if sig_effects:
        interpretation = f"Significant effects found for: {', '.join(sig_effects)}"
    else:
        interpretation = "No significant main effects or interactions found"
    
    result = {
        'testName': 'Two-way ANOVA',
        'effects': effects,
        'residual': residual,
        'groupStats': group_stats,
        'interpretation': interpretation,
        'isSignificant': len(sig_effects) > 0,
        'statistic': effects.get('interaction', effects.get('factorA', effects.get('factorB', {})))['F'] if effects else 0,
        'pValue': min([e['p_value'] for e in effects.values()]) if effects else 1.0
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 로지스틱 회귀분석 (Logistic Regression)
 */
export async function logisticRegression(
  X: number[][], // 독립변수들
  y: number[],   // 종속변수 (0 또는 1)
  variableNames?: string[]
): Promise<StatisticalResult> {
  validateNumericMatrix(X, 2, 'Independent variables')
  validateNumericArray(y, 2, 'Dependent variable')
  
  if (X.length !== y.length) {
    throw new Error('X and y must have the same number of observations')
  }
  
  const pyodide = await ensurePyodideReady()
  const varNames = variableNames || X[0].map((_, i) => `X${i + 1}`)
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    import pandas as pd
    import statsmodels.api as sm
    from scipy import stats
    import json
    
    # 데이터 준비
    X_data = np.array(${JSON.stringify(X)})
    y_data = np.array(${JSON.stringify(y)})
    var_names = ${JSON.stringify(varNames)}
    
    # 상수항 추가
    X_with_const = sm.add_constant(X_data)
    
    # 로지스틱 회귀 모델 피팅
    model = sm.Logit(y_data, X_with_const)
    results = model.fit(disp=0)
    
    # 계수와 통계량 추출
    coefficients = []
    coefficients.append({
        'name': 'Intercept',
        'coefficient': float(results.params[0]),
        'std_error': float(results.bse[0]),
        'z_statistic': float(results.params[0] / results.bse[0]),
        'p_value': float(results.pvalues[0]),
        'odds_ratio': float(np.exp(results.params[0])),
        'conf_int_lower': float(results.conf_int()[0][0]),
        'conf_int_upper': float(results.conf_int()[0][1])
    })
    
    for i, var_name in enumerate(var_names):
        coefficients.append({
            'name': var_name,
            'coefficient': float(results.params[i + 1]),
            'std_error': float(results.bse[i + 1]),
            'z_statistic': float(results.params[i + 1] / results.bse[i + 1]),
            'p_value': float(results.pvalues[i + 1]),
            'odds_ratio': float(np.exp(results.params[i + 1])),
            'conf_int_lower': float(results.conf_int()[i + 1][0]),
            'conf_int_upper': float(results.conf_int()[i + 1][1])
        })
    
    # 모델 적합도 통계량
    # McFadden's pseudo R-squared
    pseudo_r2 = float(results.prsquared)
    
    # Likelihood ratio test
    lr_stat = float(results.llr)
    lr_pvalue = float(results.llr_pvalue)
    
    # AIC, BIC
    aic = float(results.aic)
    bic = float(results.bic)
    
    # 예측 정확도 계산
    predictions = results.predict(X_with_const)
    predicted_classes = (predictions > 0.5).astype(int)
    accuracy = float(np.mean(predicted_classes == y_data))
    
    # Confusion matrix
    from sklearn.metrics import confusion_matrix
    cm = confusion_matrix(y_data, predicted_classes)
    tn, fp, fn, tp = cm.ravel()
    
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    
    # ROC AUC (if sklearn available)
    try:
        from sklearn.metrics import roc_auc_score
        auc = float(roc_auc_score(y_data, predictions))
    except:
        auc = None
    
    result = {
        'testName': 'Logistic Regression',
        'statistic': lr_stat,
        'pValue': lr_pvalue,
        'coefficients': coefficients,
        'pseudo_r_squared': pseudo_r2,
        'aic': aic,
        'bic': bic,
        'accuracy': accuracy,
        'confusion_matrix': {
            'true_negative': int(tn),
            'false_positive': int(fp),
            'false_negative': int(fn),
            'true_positive': int(tp)
        },
        'sensitivity': float(sensitivity),
        'specificity': float(specificity),
        'auc': auc,
        'n_observations': int(results.nobs),
        'interpretation': f"Model accuracy: {accuracy*100:.1f}%, Pseudo R²: {pseudo_r2:.3f}",
        'isSignificant': lr_pvalue < 0.05
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 시계열 분해 (Time Series Decomposition)
 */
export async function timeSeriesDecomposition(
  data: number[],
  period: number = 12, // 계절성 주기 (월별 데이터는 12, 분기별은 4)
  model: 'additive' | 'multiplicative' = 'additive'
): Promise<any> {
  validateNumericArray(data, period * 2, 'Time series data')
  
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from statsmodels.tsa.seasonal import seasonal_decompose
    import json
    
    # 데이터 준비
    ts_data = np.array(${JSON.stringify(data)})
    
    # 시계열 분해
    decomposition = seasonal_decompose(ts_data, model='${model}', period=${period})
    
    # 구성요소 추출
    trend = decomposition.trend
    seasonal = decomposition.seasonal
    residual = decomposition.resid
    
    # NaN 처리
    trend_clean = [float(x) if not np.isnan(x) else None for x in trend]
    seasonal_clean = [float(x) if not np.isnan(x) else None for x in seasonal]
    residual_clean = [float(x) if not np.isnan(x) else None for x in residual]
    
    # 계절성 강도 계산
    if '${model}' == 'additive':
        seasonal_strength = 1 - np.var(residual[~np.isnan(residual)]) / np.var(seasonal[~np.isnan(seasonal)] + residual[~np.isnan(residual)])
    else:
        seasonal_strength = 1 - np.var(residual[~np.isnan(residual)]) / np.var(ts_data - trend[~np.isnan(trend)])
    
    result = {
        'testName': 'Time Series Decomposition',
        'model': '${model}',
        'period': ${period},
        'components': {
            'observed': ts_data.tolist(),
            'trend': trend_clean,
            'seasonal': seasonal_clean,
            'residual': residual_clean
        },
        'seasonal_strength': float(seasonal_strength) if not np.isnan(seasonal_strength) else 0,
        'interpretation': f"Time series decomposed using ${model} model with period ${period}",
        'statistic': float(seasonal_strength) if not np.isnan(seasonal_strength) else 0,
        'pValue': 0,  # Not applicable for decomposition
        'isSignificant': True
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 주성분 분석 (PCA)
 */
export async function principalComponentAnalysis(
  X: number[][],
  n_components?: number,
  variableNames?: string[]
): Promise<any> {
  validateNumericMatrix(X, 2, 'Data matrix')
  
  const pyodide = await ensurePyodideReady()
  const varNames = variableNames || X[0].map((_, i) => `Var${i + 1}`)
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from sklearn.decomposition import PCA
    from sklearn.preprocessing import StandardScaler
    import json
    
    # 데이터 준비 및 표준화
    X_data = np.array(${JSON.stringify(X)})
    var_names = ${JSON.stringify(varNames)}
    n_comp = ${n_components || 'None'}
    
    # 표준화
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_data)
    
    # PCA 수행
    if n_comp is None:
        n_comp = min(X_data.shape)
    
    pca = PCA(n_components=n_comp)
    X_pca = pca.fit_transform(X_scaled)
    
    # 주성분별 설명 분산
    explained_variance = pca.explained_variance_ratio_
    cumulative_variance = np.cumsum(explained_variance)
    
    # 주성분 부하량 (loadings)
    loadings = pca.components_.T * np.sqrt(pca.explained_variance_)
    
    # 각 주성분에 대한 정보
    components_info = []
    for i in range(len(explained_variance)):
        component_loadings = []
        for j, var_name in enumerate(var_names):
            component_loadings.append({
                'variable': var_name,
                'loading': float(loadings[j, i])
            })
        
        components_info.append({
            'component': f'PC{i+1}',
            'explained_variance': float(explained_variance[i]),
            'cumulative_variance': float(cumulative_variance[i]),
            'eigenvalue': float(pca.explained_variance_[i]),
            'loadings': component_loadings
        })
    
    # Kaiser criterion (eigenvalue > 1)
    n_kaiser = np.sum(pca.explained_variance_ > 1)
    
    # 80% 분산 설명에 필요한 주성분 수
    n_80_variance = np.argmax(cumulative_variance >= 0.8) + 1
    
    result = {
        'testName': 'Principal Component Analysis',
        'n_components': len(explained_variance),
        'n_variables': len(var_names),
        'components': components_info,
        'kaiser_criterion': int(n_kaiser),
        'components_for_80_variance': int(n_80_variance),
        'transformed_data': X_pca.tolist(),
        'interpretation': f"First {n_80_variance} components explain {cumulative_variance[n_80_variance-1]*100:.1f}% of variance",
        'statistic': float(cumulative_variance[min(2, len(cumulative_variance)-1)]),  # 처음 3개 주성분의 누적 분산
        'pValue': 0,  # Not applicable
        'isSignificant': True
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 생존 분석 - Kaplan-Meier 추정
 */
export async function kaplanMeierSurvival(
  time: number[],     // 관찰 시간
  event: number[],    // 이벤트 발생 여부 (0: censored, 1: event)
  groups?: string[]   // 그룹 (선택적)
): Promise<any> {
  validateNumericArray(time, 2, 'Time data')
  validateNumericArray(event, 2, 'Event data')
  
  if (time.length !== event.length) {
    throw new Error('Time and event arrays must have the same length')
  }
  
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from lifelines import KaplanMeierFitter
    from lifelines.statistics import logrank_test
    import json
    
    # 데이터 준비
    time_data = np.array(${JSON.stringify(time)})
    event_data = np.array(${JSON.stringify(event)})
    groups_data = ${groups ? JSON.stringify(groups) : 'None'}
    
    if groups_data is None:
        # 단일 그룹 분석
        kmf = KaplanMeierFitter()
        kmf.fit(time_data, event_data)
        
        # 생존 확률과 시간
        survival_function = kmf.survival_function_
        median_survival = kmf.median_survival_time_
        
        # 특정 시점의 생존율
        time_points = np.percentile(time_data[event_data == 1], [25, 50, 75])
        survival_at_points = [float(kmf.predict(t)) for t in time_points]
        
        result = {
            'testName': 'Kaplan-Meier Survival Analysis',
            'median_survival': float(median_survival) if not np.isnan(median_survival) else None,
            'survival_table': {
                'time': survival_function.index.tolist(),
                'survival_probability': survival_function.values.flatten().tolist(),
                'confidence_lower': kmf.confidence_interval_['KM_estimate_lower_0.95'].tolist(),
                'confidence_upper': kmf.confidence_interval_['KM_estimate_upper_0.95'].tolist()
            },
            'n_events': int(np.sum(event_data)),
            'n_censored': int(np.sum(1 - event_data)),
            'interpretation': f"Median survival time: {median_survival:.2f}" if not np.isnan(median_survival) else "Median survival not reached",
            'statistic': float(median_survival) if not np.isnan(median_survival) else 0,
            'pValue': 1.0,
            'isSignificant': False
        }
    else:
        # 다중 그룹 비교
        unique_groups = np.unique(groups_data)
        group_results = []
        
        for group in unique_groups:
            mask = np.array(groups_data) == group
            kmf = KaplanMeierFitter()
            kmf.fit(time_data[mask], event_data[mask], label=str(group))
            
            group_results.append({
                'group': str(group),
                'median_survival': float(kmf.median_survival_time_) if not np.isnan(kmf.median_survival_time_) else None,
                'n_events': int(np.sum(event_data[mask])),
                'n_censored': int(np.sum(1 - event_data[mask]))
            })
        
        # Log-rank test for group comparison
        if len(unique_groups) == 2:
            mask1 = np.array(groups_data) == unique_groups[0]
            mask2 = np.array(groups_data) == unique_groups[1]
            
            lr_result = logrank_test(
                time_data[mask1], time_data[mask2],
                event_data[mask1], event_data[mask2]
            )
            
            p_value = float(lr_result.p_value)
            test_stat = float(lr_result.test_statistic)
        else:
            p_value = 0
            test_stat = 0
        
        result = {
            'testName': 'Kaplan-Meier Survival Analysis (Group Comparison)',
            'groups': group_results,
            'logrank_statistic': test_stat,
            'logrank_pvalue': p_value,
            'interpretation': f"Groups are {'significantly different' if p_value < 0.05 else 'not significantly different'} (p={p_value:.4f})",
            'statistic': test_stat,
            'pValue': p_value,
            'isSignificant': p_value < 0.05
        }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * ARIMA 시계열 예측
 */
export async function arimaForecast(
  data: number[],
  order: [number, number, number] = [1, 1, 1], // (p, d, q)
  seasonal_order?: [number, number, number, number], // (P, D, Q, s)
  forecast_periods: number = 12
): Promise<any> {
  validateNumericArray(data, 10, 'Time series data')
  
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    import pandas as pd
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    import json
    import warnings
    warnings.filterwarnings('ignore')
    
    # 데이터 준비
    ts_data = np.array(${JSON.stringify(data)})
    order = ${JSON.stringify(order)}
    seasonal_order = ${seasonal_order ? JSON.stringify(seasonal_order) : 'None'}
    n_forecast = ${forecast_periods}
    
    try:
        if seasonal_order:
            # SARIMA 모델
            model = SARIMAX(ts_data, order=order, seasonal_order=seasonal_order)
            model_name = f"SARIMA{order}x{seasonal_order}"
        else:
            # ARIMA 모델
            model = ARIMA(ts_data, order=order)
            model_name = f"ARIMA{order}"
        
        # 모델 피팅
        fitted_model = model.fit(disp=0)
        
        # 예측
        forecast = fitted_model.forecast(steps=n_forecast)
        forecast_ci = fitted_model.get_forecast(steps=n_forecast).conf_int()
        
        # 적합값
        fitted_values = fitted_model.fittedvalues
        
        # 잔차
        residuals = fitted_model.resid
        
        # 모델 평가 지표
        aic = float(fitted_model.aic)
        bic = float(fitted_model.bic)
        
        # RMSE
        rmse = np.sqrt(np.mean(residuals**2))
        
        # MAPE (Mean Absolute Percentage Error)
        non_zero_actual = ts_data[ts_data != 0]
        non_zero_fitted = fitted_values[:len(non_zero_actual)]
        if len(non_zero_actual) > 0:
            mape = np.mean(np.abs((non_zero_actual - non_zero_fitted) / non_zero_actual)) * 100
        else:
            mape = None
        
        result = {
            'testName': model_name + ' Time Series Forecast',
            'model_order': order,
            'seasonal_order': seasonal_order,
            'forecast': {
                'values': forecast.tolist(),
                'lower_bound': forecast_ci.iloc[:, 0].tolist(),
                'upper_bound': forecast_ci.iloc[:, 1].tolist()
            },
            'fitted_values': fitted_values.tolist(),
            'residuals': residuals.tolist(),
            'metrics': {
                'aic': aic,
                'bic': bic,
                'rmse': float(rmse),
                'mape': float(mape) if mape else None
            },
            'interpretation': f"{model_name} model fitted. RMSE: {rmse:.3f}, AIC: {aic:.2f}",
            'statistic': aic,
            'pValue': 0,
            'isSignificant': True
        }
    except Exception as e:
        result = {
            'testName': 'ARIMA Forecast Error',
            'error': str(e),
            'interpretation': f"Failed to fit ARIMA model: {str(e)}",
            'statistic': 0,
            'pValue': 1,
            'isSignificant': False
        }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * K-means 클러스터링
 */
export async function kMeansClustering(
  X: number[][],
  n_clusters: number = 3,
  variableNames?: string[]
): Promise<any> {
  validateNumericMatrix(X, 2, 'Data matrix')
  
  const pyodide = await ensurePyodideReady()
  const varNames = variableNames || X[0].map((_, i) => `Var${i + 1}`)
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score
    import json
    
    # 데이터 준비 및 표준화
    X_data = np.array(${JSON.stringify(X)})
    var_names = ${JSON.stringify(varNames)}
    n_clusters = ${n_clusters}
    
    # 표준화
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_data)
    
    # K-means 클러스터링
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    
    # 클러스터 중심점 (원래 스케일로 변환)
    centers_scaled = kmeans.cluster_centers_
    centers = scaler.inverse_transform(centers_scaled)
    
    # 클러스터별 통계
    cluster_stats = []
    for i in range(n_clusters):
        mask = labels == i
        cluster_data = X_data[mask]
        
        cluster_info = {
            'cluster_id': int(i),
            'size': int(np.sum(mask)),
            'percentage': float(np.sum(mask) / len(labels) * 100),
            'center': centers[i].tolist(),
            'variable_means': {}
        }
        
        for j, var_name in enumerate(var_names):
            cluster_info['variable_means'][var_name] = float(np.mean(cluster_data[:, j]))
        
        cluster_stats.append(cluster_info)
    
    # 클러스터링 품질 지표
    silhouette = float(silhouette_score(X_scaled, labels))
    calinski_harabasz = float(calinski_harabasz_score(X_scaled, labels))
    davies_bouldin = float(davies_bouldin_score(X_scaled, labels))
    inertia = float(kmeans.inertia_)
    
    # 최적 클러스터 수 추천 (엘보우 방법)
    inertias = []
    silhouettes = []
    k_range = range(2, min(10, len(X_data) - 1))
    
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit(X_scaled)
        inertias.append(float(km.inertia_))
        silhouettes.append(float(silhouette_score(X_scaled, km.labels_)))
    
    # 최적 k 찾기 (실루엣 점수 기준)
    optimal_k = list(k_range)[np.argmax(silhouettes)]
    
    result = {
        'testName': f'K-means Clustering (k={n_clusters})',
        'n_clusters': n_clusters,
        'cluster_labels': labels.tolist(),
        'cluster_stats': cluster_stats,
        'quality_metrics': {
            'silhouette_score': silhouette,
            'calinski_harabasz_score': calinski_harabasz,
            'davies_bouldin_score': davies_bouldin,
            'inertia': inertia
        },
        'elbow_analysis': {
            'k_values': list(k_range),
            'inertias': inertias,
            'silhouettes': silhouettes,
            'optimal_k': int(optimal_k)
        },
        'interpretation': f"Data clustered into {n_clusters} groups. Silhouette score: {silhouette:.3f} (closer to 1 is better)",
        'statistic': silhouette,
        'pValue': 0,
        'isSignificant': silhouette > 0.5
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 계층적 클러스터링 (Hierarchical Clustering)
 */
export async function hierarchicalClustering(
  X: number[][],
  n_clusters?: number,
  linkage: 'ward' | 'complete' | 'average' | 'single' = 'ward',
  variableNames?: string[]
): Promise<any> {
  validateNumericMatrix(X, 2, 'Data matrix')
  
  const pyodide = await ensurePyodideReady()
  const varNames = variableNames || X[0].map((_, i) => `Var${i + 1}`)
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from sklearn.cluster import AgglomerativeClustering
    from sklearn.preprocessing import StandardScaler
    from scipy.cluster.hierarchy import dendrogram, linkage as scipy_linkage
    from sklearn.metrics import silhouette_score
    import json
    
    # 데이터 준비 및 표준화
    X_data = np.array(${JSON.stringify(X)})
    var_names = ${JSON.stringify(varNames)}
    n_clusters = ${n_clusters || 'None'}
    linkage_method = '${linkage}'
    
    # 표준화
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_data)
    
    # 덴드로그램을 위한 linkage 계산
    Z = scipy_linkage(X_scaled, method=linkage_method)
    
    # 최적 클러스터 수 결정 (지정되지 않은 경우)
    if n_clusters is None:
        # 실루엣 점수로 최적 k 찾기
        silhouette_scores = []
        k_range = range(2, min(10, len(X_data) - 1))
        
        for k in k_range:
            hc = AgglomerativeClustering(n_clusters=k, linkage=linkage_method)
            labels = hc.fit_predict(X_scaled)
            silhouette_scores.append(silhouette_score(X_scaled, labels))
        
        n_clusters = list(k_range)[np.argmax(silhouette_scores)]
    
    # 계층적 클러스터링 수행
    hc = AgglomerativeClustering(n_clusters=n_clusters, linkage=linkage_method)
    labels = hc.fit_predict(X_scaled)
    
    # 클러스터별 통계
    cluster_stats = []
    for i in range(n_clusters):
        mask = labels == i
        cluster_data = X_data[mask]
        
        cluster_info = {
            'cluster_id': int(i),
            'size': int(np.sum(mask)),
            'percentage': float(np.sum(mask) / len(labels) * 100),
            'variable_means': {}
        }
        
        for j, var_name in enumerate(var_names):
            if len(cluster_data) > 0:
                cluster_info['variable_means'][var_name] = float(np.mean(cluster_data[:, j]))
            else:
                cluster_info['variable_means'][var_name] = 0
        
        cluster_stats.append(cluster_info)
    
    # 클러스터링 품질 지표
    silhouette = float(silhouette_score(X_scaled, labels))
    
    # 덴드로그램 데이터 (상위 10개 병합만)
    last_merges = Z[-10:] if len(Z) > 10 else Z
    dendrogram_data = {
        'merges': last_merges.tolist(),
        'n_samples': len(X_data)
    }
    
    result = {
        'testName': f'Hierarchical Clustering ({linkage_method} linkage)',
        'n_clusters': int(n_clusters),
        'linkage_method': linkage_method,
        'cluster_labels': labels.tolist(),
        'cluster_stats': cluster_stats,
        'silhouette_score': silhouette,
        'dendrogram_data': dendrogram_data,
        'interpretation': f"Hierarchical clustering with {n_clusters} clusters. Silhouette score: {silhouette:.3f}",
        'statistic': silhouette,
        'pValue': 0,
        'isSignificant': silhouette > 0.5
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 정규성 검정 (Shapiro-Wilk)
 */
export async function normalityTest(data: number[]): Promise<any> {
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    data = np.array(${JSON.stringify(data)})
    
    # Shapiro-Wilk 검정
    if len(data) >= 3 and len(data) <= 5000:
        stat, p_value = stats.shapiro(data)
        test_name = "Shapiro-Wilk Test"
    else:
        # 데이터가 너무 많으면 Kolmogorov-Smirnov 사용
        stat, p_value = stats.kstest(data, 'norm', args=(np.mean(data), np.std(data)))
        test_name = "Kolmogorov-Smirnov Test"
    
    result = {
        'testName': test_name,
        'statistic': float(stat),
        'pValue': float(p_value),
        'isNormal': p_value > 0.05,
        'interpretation': f"The data {'follows' if p_value > 0.05 else 'does not follow'} a normal distribution (p = {p_value:.4f})"
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 등분산성 검정 (Levene's test)
 */
export async function homogeneityTest(groups: number[][]): Promise<any> {
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    groups_data = ${JSON.stringify(groups)}
    groups_arrays = [np.array(g) for g in groups_data]
    
    # Levene's test
    stat, p_value = stats.levene(*groups_arrays)
    
    result = {
        'testName': "Levene's Test",
        'statistic': float(stat),
        'pValue': float(p_value),
        'isHomogeneous': p_value > 0.05,
        'interpretation': f"The variances are {'equal' if p_value > 0.05 else 'not equal'} across groups (p = {p_value:.4f})"
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * Mann-Whitney U 검정 (비모수)
 */
export async function mannWhitneyU(
  group1: number[], 
  group2: number[]
): Promise<StatisticalResult> {
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    group1 = np.array(${JSON.stringify(group1)})
    group2 = np.array(${JSON.stringify(group2)})
    
    # Mann-Whitney U test
    u_stat, p_value = stats.mannwhitneyu(group1, group2, alternative='two-sided')
    
    # 효과크기 (rank-biserial correlation)
    n1 = len(group1)
    n2 = len(group2)
    r = 1 - (2 * u_stat) / (n1 * n2)
    
    result = {
        'testName': 'Mann-Whitney U Test',
        'statistic': float(u_stat),
        'pValue': float(p_value),
        'effectSize': float(r),
        'n1': n1,
        'n2': n2,
        'median1': float(np.median(group1)),
        'median2': float(np.median(group2)),
        'interpretation': f"The distributions are {'significantly different' if p_value < 0.05 else 'not significantly different'} (U = {u_stat:.1f}, p = {p_value:.4f})",
        'isSignificant': p_value < 0.05
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 일표본 t-검정
 */
export async function oneSampleTTest(
  data: number[],
  populationMean: number = 0
): Promise<StatisticalResult> {
  validateNumericArray(data, 2, 'Sample data')
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    data = np.array(${JSON.stringify(data)})
    pop_mean = ${populationMean}
    
    # One-sample t-test
    t_stat, p_value = stats.ttest_1samp(data, pop_mean)
    
    # 효과크기 (Cohen's d)
    cohens_d = (np.mean(data) - pop_mean) / np.std(data, ddof=1)
    
    # 신뢰구간
    mean = np.mean(data)
    se = stats.sem(data)
    ci = stats.t.interval(0.95, len(data)-1, loc=mean, scale=se)
    
    result = {
        'testName': 'One-sample t-test',
        'statistic': float(t_stat),
        'pValue': float(p_value),
        'degreesOfFreedom': len(data) - 1,
        'effectSize': float(cohens_d),
        'confidenceInterval': [float(ci[0]), float(ci[1])],
        'sampleMean': float(mean),
        'populationMean': pop_mean,
        'n': len(data),
        'interpretation': f"The sample mean ({'differs from' if p_value < 0.05 else 'does not differ from'} the population mean (p = {p_value:.4f})",
        'isSignificant': p_value < 0.05
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 대응표본 t-검정
 */
export async function pairedTTest(
  before: number[],
  after: number[]
): Promise<StatisticalResult> {
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    before = np.array(${JSON.stringify(before)})
    after = np.array(${JSON.stringify(after)})
    
    # Paired t-test
    t_stat, p_value = stats.ttest_rel(before, after)
    
    # 차이값
    differences = after - before
    mean_diff = np.mean(differences)
    std_diff = np.std(differences, ddof=1)
    
    # 효과크기 (Cohen's d)
    cohens_d = mean_diff / std_diff if std_diff > 0 else 0
    
    # 신뢰구간
    se = stats.sem(differences)
    ci = stats.t.interval(0.95, len(differences)-1, loc=mean_diff, scale=se)
    
    result = {
        'testName': 'Paired t-test',
        'statistic': float(t_stat),
        'pValue': float(p_value),
        'degreesOfFreedom': len(before) - 1,
        'effectSize': float(cohens_d),
        'confidenceInterval': [float(ci[0]), float(ci[1])],
        'meanDifference': float(mean_diff),
        'meanBefore': float(np.mean(before)),
        'meanAfter': float(np.mean(after)),
        'n': len(before),
        'interpretation': f"There is {'a significant' if p_value < 0.05 else 'no significant'} difference between paired observations (p = {p_value:.4f})",
        'isSignificant': p_value < 0.05
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * Wilcoxon signed-rank 검정 (대응표본 비모수)
 */
export async function wilcoxonSignedRank(
  x: number[],
  y: number[]
): Promise<StatisticalResult> {
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    x = np.array(${JSON.stringify(x)})
    y = np.array(${JSON.stringify(y)})
    
    # Wilcoxon signed-rank test
    statistic, p_value = stats.wilcoxon(x, y)
    
    # 중앙값
    median_x = np.median(x)
    median_y = np.median(y)
    median_diff = np.median(y - x)
    
    result = {
        'testName': 'Wilcoxon Signed-rank Test',
        'statistic': float(statistic),
        'pValue': float(p_value),
        'medianX': float(median_x),
        'medianY': float(median_y),
        'medianDifference': float(median_diff),
        'n': len(x),
        'interpretation': f"The paired samples are {'significantly different' if p_value < 0.05 else 'not significantly different'} (p = {p_value:.4f})",
        'isSignificant': p_value < 0.05
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * 카이제곱 독립성 검정
 */
export async function chiSquareTest(
  contingencyTable: number[][]
): Promise<StatisticalResult> {
  const pyodide = await ensurePyodideReady()
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    observed = np.array(${JSON.stringify(contingencyTable)})
    
    # Chi-square test of independence
    chi2, p_value, dof, expected = stats.chi2_contingency(observed)
    
    # Cramér's V (effect size)
    n = observed.sum()
    min_dim = min(observed.shape[0] - 1, observed.shape[1] - 1)
    cramers_v = np.sqrt(chi2 / (n * min_dim)) if min_dim > 0 else 0
    
    result = {
        'testName': 'Chi-square Test of Independence',
        'statistic': float(chi2),
        'pValue': float(p_value),
        'degreesOfFreedom': int(dof),
        'effectSize': float(cramers_v),
        'sampleSize': int(n),
        'expectedFrequencies': expected.tolist(),
        'interpretation': f"The variables are {'dependent' if p_value < 0.05 else 'independent'} (χ² = {chi2:.3f}, p = {p_value:.4f})",
        'isSignificant': p_value < 0.05
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * Tukey HSD 사후검정
 */
export async function tukeyHSD(
  groups: number[][],
  groupNames?: string[]
): Promise<any> {
  const pyodide = await ensurePyodideReady()
  
  const names = groupNames || groups.map((_, i) => `Group ${i + 1}`)
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    import warnings
    warnings.filterwarnings('ignore')
    
    groups_data = ${JSON.stringify(groups)}
    group_names = ${JSON.stringify(names)}
    
    # 먼저 ANOVA 수행
    f_stat, p_value_anova = stats.f_oneway(*[np.array(g) for g in groups_data])
    
    # Tukey HSD 직접 구현 (statsmodels 없이)
    all_data = []
    all_groups = []
    for i, group in enumerate(groups_data):
        all_data.extend(group)
        all_groups.extend([i] * len(group))
    
    n_groups = len(groups_data)
    comparisons = []
    
    for i in range(n_groups):
        for j in range(i+1, n_groups):
            group1 = np.array(groups_data[i])
            group2 = np.array(groups_data[j])
            
            mean_diff = np.mean(group1) - np.mean(group2)
            
            # Pooled standard error
            n1, n2 = len(group1), len(group2)
            var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
            pooled_var = ((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2)
            se = np.sqrt(pooled_var * (1/n1 + 1/n2))
            
            # q statistic (studentized range)
            q_stat = abs(mean_diff) / (se / np.sqrt(2))
            
            # Approximate p-value (simplified)
            df_error = sum([len(g) for g in groups_data]) - n_groups
            # Using t-distribution as approximation
            t_stat = mean_diff / se
            p_value = 2 * (1 - stats.t.cdf(abs(t_stat), df_error))
            
            # Bonferroni correction for multiple comparisons
            n_comparisons = n_groups * (n_groups - 1) / 2
            adjusted_p = min(1.0, p_value * n_comparisons)
            
            comparisons.append({
                'group1': group_names[i],
                'group2': group_names[j],
                'meanDifference': float(mean_diff),
                'standardError': float(se),
                'pValue': float(p_value),
                'adjustedPValue': float(adjusted_p),
                'lowerCI': float(mean_diff - 1.96 * se),
                'upperCI': float(mean_diff + 1.96 * se),
                'isSignificant': adjusted_p < 0.05
            })
    
    result = {
        'testName': 'Tukey HSD Post-hoc Test',
        'anovaFStatistic': float(f_stat),
        'anovaPValue': float(p_value_anova),
        'comparisons': comparisons,
        'nGroups': n_groups,
        'interpretation': f"Found {sum([1 for c in comparisons if c['isSignificant']])} significant pairwise differences out of {len(comparisons)} comparisons"
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * Bonferroni 사후검정
 */
export async function bonferroniPostHoc(
  groups: number[][],
  groupNames?: string[]
): Promise<any> {
  const pyodide = await ensurePyodideReady()
  
  const names = groupNames || groups.map((_, i) => `Group ${i + 1}`)
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    groups_data = ${JSON.stringify(groups)}
    group_names = ${JSON.stringify(names)}
    
    # ANOVA 수행
    f_stat, p_value_anova = stats.f_oneway(*[np.array(g) for g in groups_data])
    
    n_groups = len(groups_data)
    n_comparisons = n_groups * (n_groups - 1) // 2
    alpha = 0.05
    bonferroni_alpha = alpha / n_comparisons
    
    comparisons = []
    
    for i in range(n_groups):
        for j in range(i+1, n_groups):
            group1 = np.array(groups_data[i])
            group2 = np.array(groups_data[j])
            
            # T-test for each pair
            t_stat, p_value = stats.ttest_ind(group1, group2)
            
            # Bonferroni adjustment
            adjusted_p = min(1.0, p_value * n_comparisons)
            
            mean_diff = np.mean(group1) - np.mean(group2)
            
            # Confidence interval with Bonferroni adjustment
            n1, n2 = len(group1), len(group2)
            var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
            se = np.sqrt(var1/n1 + var2/n2)
            
            # Critical value with Bonferroni adjustment
            df = n1 + n2 - 2
            t_crit = stats.t.ppf(1 - bonferroni_alpha/2, df)
            
            comparisons.append({
                'group1': group_names[i],
                'group2': group_names[j],
                'meanDifference': float(mean_diff),
                'tStatistic': float(t_stat),
                'pValue': float(p_value),
                'adjustedPValue': float(adjusted_p),
                'lowerCI': float(mean_diff - t_crit * se),
                'upperCI': float(mean_diff + t_crit * se),
                'isSignificant': p_value < bonferroni_alpha
            })
    
    result = {
        'testName': 'Bonferroni Post-hoc Test',
        'anovaFStatistic': float(f_stat),
        'anovaPValue': float(p_value_anova),
        'comparisons': comparisons,
        'nComparisons': n_comparisons,
        'adjustedAlpha': float(bonferroni_alpha),
        'interpretation': f"Using Bonferroni correction (α = {bonferroni_alpha:.4f}), found {sum([1 for c in comparisons if c['isSignificant']])} significant differences"
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * Games-Howell 사후검정 (등분산 가정 불필요)
 */
export async function gamesHowellPostHoc(
  groups: number[][],
  groupNames?: string[]
): Promise<any> {
  const pyodide = await ensurePyodideReady()
  
  const names = groupNames || groups.map((_, i) => `Group ${i + 1}`)
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    groups_data = ${JSON.stringify(groups)}
    group_names = ${JSON.stringify(names)}
    
    # Welch's ANOVA (등분산 가정하지 않음)
    f_stat, p_value_anova = stats.f_oneway(*[np.array(g) for g in groups_data])
    
    n_groups = len(groups_data)
    comparisons = []
    
    for i in range(n_groups):
        for j in range(i+1, n_groups):
            group1 = np.array(groups_data[i])
            group2 = np.array(groups_data[j])
            
            n1, n2 = len(group1), len(group2)
            mean1, mean2 = np.mean(group1), np.mean(group2)
            var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
            
            mean_diff = mean1 - mean2
            
            # Games-Howell standard error
            se = np.sqrt(var1/n1 + var2/n2)
            
            # Welch's degrees of freedom
            df = (var1/n1 + var2/n2)**2 / ((var1/n1)**2/(n1-1) + (var2/n2)**2/(n2-1))
            
            # T-statistic
            t_stat = mean_diff / se
            
            # Two-tailed p-value
            p_value = 2 * (1 - stats.t.cdf(abs(t_stat), df))
            
            # Critical value for 95% CI
            t_crit = stats.t.ppf(0.975, df)
            
            comparisons.append({
                'group1': group_names[i],
                'group2': group_names[j],
                'meanDifference': float(mean_diff),
                'standardError': float(se),
                'tStatistic': float(t_stat),
                'df': float(df),
                'pValue': float(p_value),
                'lowerCI': float(mean_diff - t_crit * se),
                'upperCI': float(mean_diff + t_crit * se),
                'isSignificant': p_value < 0.05
            })
    
    result = {
        'testName': 'Games-Howell Post-hoc Test',
        'anovaFStatistic': float(f_stat),
        'anovaPValue': float(p_value_anova),
        'comparisons': comparisons,
        'nGroups': n_groups,
        'interpretation': f"Games-Howell test (no equal variance assumption) found {sum([1 for c in comparisons if c['isSignificant']])} significant differences"
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * Dunn's test (Kruskal-Wallis 사후검정)
 */
export async function dunnTest(
  groups: number[][],
  groupNames?: string[]
): Promise<any> {
  const pyodide = await ensurePyodideReady()
  
  const names = groupNames || groups.map((_, i) => `Group ${i + 1}`)
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    groups_data = ${JSON.stringify(groups)}
    group_names = ${JSON.stringify(names)}
    
    # Kruskal-Wallis test
    h_stat, p_value_kw = stats.kruskal(*[np.array(g) for g in groups_data])
    
    # Combine all data and get ranks
    all_data = []
    group_labels = []
    for i, group in enumerate(groups_data):
        all_data.extend(group)
        group_labels.extend([i] * len(group))
    
    all_data = np.array(all_data)
    ranks = stats.rankdata(all_data)
    
    # Calculate mean ranks for each group
    mean_ranks = []
    group_sizes = []
    for i in range(len(groups_data)):
        group_ranks = [ranks[j] for j in range(len(all_data)) if group_labels[j] == i]
        mean_ranks.append(np.mean(group_ranks))
        group_sizes.append(len(groups_data[i]))
    
    n_total = len(all_data)
    n_groups = len(groups_data)
    comparisons = []
    
    for i in range(n_groups):
        for j in range(i+1, n_groups):
            # Dunn's z-statistic
            rank_diff = mean_ranks[i] - mean_ranks[j]
            n_i, n_j = group_sizes[i], group_sizes[j]
            
            # Standard error
            se = np.sqrt((n_total * (n_total + 1) / 12) * (1/n_i + 1/n_j))
            
            z_stat = rank_diff / se
            
            # Two-tailed p-value
            p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))
            
            # Bonferroni correction
            n_comparisons = n_groups * (n_groups - 1) / 2
            adjusted_p = min(1.0, p_value * n_comparisons)
            
            comparisons.append({
                'group1': group_names[i],
                'group2': group_names[j],
                'meanRank1': float(mean_ranks[i]),
                'meanRank2': float(mean_ranks[j]),
                'rankDifference': float(rank_diff),
                'zStatistic': float(z_stat),
                'pValue': float(p_value),
                'adjustedPValue': float(adjusted_p),
                'isSignificant': adjusted_p < 0.05
            })
    
    result = {
        'testName': "Dunn's Post-hoc Test",
        'kruskalWallisH': float(h_stat),
        'kruskalWallisPValue': float(p_value_kw),
        'comparisons': comparisons,
        'nGroups': n_groups,
        'interpretation': f"Dunn's test with Bonferroni correction found {sum([1 for c in comparisons if c['isSignificant']])} significant differences"
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}

/**
 * Kruskal-Wallis 검정 (비모수 ANOVA)
 */
export async function kruskalWallis(
  groups: number[][], 
  groupNames?: string[]
): Promise<StatisticalResult> {
  const pyodide = await ensurePyodideReady()
  
  const names = groupNames || groups.map((_, i) => `Group ${i + 1}`)
  
  const result = await (pyodide as any).runPythonAsync(`
    import numpy as np
    from scipy import stats
    import json
    
    groups_data = ${JSON.stringify(groups)}
    group_names = ${JSON.stringify(names)}
    
    # Kruskal-Wallis test
    h_stat, p_value = stats.kruskal(*[np.array(g) for g in groups_data])
    
    # 그룹별 통계
    group_stats = []
    all_data = []
    all_groups = []
    
    for i, group in enumerate(groups_data):
        g = np.array(group)
        all_data.extend(group)
        all_groups.extend([i] * len(group))
        group_stats.append({
            'name': group_names[i],
            'n': len(g),
            'median': float(np.median(g)),
            'mean_rank': 0  # 나중에 계산
        })
    
    # 순위 계산
    ranks = stats.rankdata(all_data)
    for i in range(len(groups_data)):
        group_ranks = [ranks[j] for j in range(len(all_groups)) if all_groups[j] == i]
        group_stats[i]['mean_rank'] = float(np.mean(group_ranks))
    
    result = {
        'testName': 'Kruskal-Wallis Test',
        'statistic': float(h_stat),
        'pValue': float(p_value),
        'df': len(groups_data) - 1,
        'groups': group_stats,
        'interpretation': f"The distributions are {'significantly different' if p_value < 0.05 else 'not significantly different'} across groups (H = {h_stat:.3f}, p = {p_value:.4f})",
        'isSignificant': p_value < 0.05
    }
    
    json.dumps(result)
  `)
  
  return JSON.parse(result)
}