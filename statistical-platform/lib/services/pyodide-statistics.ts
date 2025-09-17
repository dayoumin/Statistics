/**
 * Pyodide 기반 통계 계산 서비스
 *
 * 모든 통계 계산은 Python의 SciPy/NumPy를 통해 수행되어야 합니다.
 * JavaScript 통계 라이브러리는 신뢰성이 검증되지 않았으므로 사용하지 않습니다.
 */

declare global {
  interface Window {
    pyodide?: any
    loadPyodide?: (config: any) => Promise<any>
  }
}

export class PyodideStatisticsService {
  private static instance: PyodideStatisticsService | null = null
  private pyodide: any = null
  private isLoading = false
  private loadPromise: Promise<void> | null = null

  private constructor() {}

  static getInstance(): PyodideStatisticsService {
    if (!PyodideStatisticsService.instance) {
      PyodideStatisticsService.instance = new PyodideStatisticsService()
    }
    return PyodideStatisticsService.instance
  }

  /**
   * Pyodide 초기화 및 필요한 패키지 로드
   */
  async initialize(): Promise<void> {
    console.log('[PyodideService.initialize] 시작')
    if (this.pyodide) {
      console.log('[PyodideService.initialize] 이미 초기화됨')
      return
    }
    if (this.isLoading && this.loadPromise) {
      console.log('[PyodideService.initialize] 이미 로딩 중, 기다리는 중...')
      return this.loadPromise
    }

    this.isLoading = true
    this.loadPromise = this._loadPyodide()

    try {
      await this.loadPromise
      console.log('[PyodideService.initialize] 초기화 성공!')
    } catch (error) {
      console.error('[PyodideService.initialize] 초기화 실패:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }

  private async _loadPyodide(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Pyodide는 브라우저 환경에서만 사용 가능합니다')
    }

    console.log('[PyodideService] 초기화 시작...')

    // Pyodide CDN에서 로드
    if (!window.loadPyodide) {
      console.log('[PyodideService] Pyodide 스크립트 로딩...')
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
      script.async = true

      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log('[PyodideService] 스크립트 로드 완료')
          resolve(true)
        }
        script.onerror = (error) => {
          console.error('[PyodideService] 스크립트 로드 실패:', error)
          reject(new Error('Pyodide 스크립트 로드 실패'))
        }
        document.head.appendChild(script)
      })
    } else {
      console.log('[PyodideService] Pyodide 이미 로드됨')
    }

    // Pyodide 초기화
    console.log('[PyodideService] Pyodide 인스턴스 생성 중...')
    try {
      this.pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      })
      console.log('[PyodideService] Pyodide 인스턴스 생성 완료')

      // window.pyodide에도 저장 (디버깅용)
      ;(window as any).pyodide = this.pyodide
    } catch (error) {
      console.error('[PyodideService] Pyodide 인스턴스 생성 실패:', error)
      throw error
    }

    // 필수 패키지 로드
    console.log('[PyodideService] 패키지 로딩 중... (numpy, scipy, pandas, scikit-learn)')
    try {
      await this.pyodide.loadPackage(['numpy', 'scipy', 'pandas', 'scikit-learn', 'statsmodels'])
      console.log('[PyodideService] 패키지 로드 완료')
    } catch (error) {
      console.error('[PyodideService] 패키지 로드 실패:', error)
      throw error
    }

    // 기본 imports
    console.log('[PyodideService] Python 기본 imports 실행 중...')
    await this.pyodide.runPythonAsync(`
      import numpy as np
      import pandas as pd
      from scipy import stats
      import json
      import warnings
      warnings.filterwarnings('ignore')
    `)
    console.log('[PyodideService] 초기화 완료!')
  }

  /**
   * Shapiro-Wilk 정규성 검정
   * @param data 숫자 배열
   * @returns 검정 통계량과 p-value
   */
  async shapiroWilkTest(data: number[]): Promise<{
    statistic: number
    pValue: number
    isNormal: boolean
  }> {
    await this.initialize()

    // 데이터 전달 및 검정 수행
    this.pyodide.globals.set('data_array', data)

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np

      # JavaScript 배열을 numpy 배열로 변환
      np_array = np.array(data_array)

      # 결측값 제거
      clean_data = np_array[~np.isnan(np_array)]

      # 최소 3개 데이터 필요
      if len(clean_data) < 3:
        result = {'statistic': None, 'pvalue': None, 'error': 'Insufficient data'}
      else:
        # Shapiro-Wilk 검정
        statistic, pvalue = stats.shapiro(clean_data)
        result = {
          'statistic': float(statistic),
          'pvalue': float(pvalue),
          'sample_size': len(clean_data)
        }

      json.dumps(result)
    `)

    const parsed = JSON.parse(result)

    if (parsed.error) {
      throw new Error(parsed.error)
    }

    return {
      statistic: parsed.statistic,
      pValue: parsed.pvalue,
      isNormal: parsed.pvalue > 0.05 // 유의수준 0.05 기준
    }
  }

  /**
   * IQR 방법으로 이상치 탐지
   * @param data 숫자 배열
   * @returns 이상치 정보
   */
  async detectOutliersIQR(data: number[]): Promise<{
    q1: number
    q3: number
    iqr: number
    lowerBound: number
    upperBound: number
    mildOutliers: number[]
    extremeOutliers: number[]
  }> {
    await this.initialize()

    this.pyodide.globals.set('data_array', data)

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np

      # JavaScript 배열을 numpy 배열로 변환
      np_array = np.array(data_array)

      # 결측값 제거
      clean_data = np_array[~np.isnan(np_array)]

      if len(clean_data) < 4:
        result = {'error': 'Insufficient data for outlier detection'}
      else:
        # 사분위수 계산
        q1 = np.percentile(clean_data, 25)
        q3 = np.percentile(clean_data, 75)
        iqr = q3 - q1

        # 경계값 계산
        lower_mild = q1 - 1.5 * iqr
        upper_mild = q3 + 1.5 * iqr
        lower_extreme = q1 - 3 * iqr
        upper_extreme = q3 + 3 * iqr

        # 이상치 분류
        mild_outliers = []
        extreme_outliers = []

        for val in clean_data:
          if val < lower_extreme or val > upper_extreme:
            extreme_outliers.append(float(val))
          elif val < lower_mild or val > upper_mild:
            mild_outliers.append(float(val))

        result = {
          'q1': float(q1),
          'q3': float(q3),
          'iqr': float(iqr),
          'lower_bound': float(lower_mild),
          'upper_bound': float(upper_mild),
          'mild_outliers': mild_outliers,
          'extreme_outliers': extreme_outliers,
          'total_outliers': len(mild_outliers) + len(extreme_outliers),
          'outlier_percentage': (len(mild_outliers) + len(extreme_outliers)) / len(clean_data) * 100
        }

      json.dumps(result)
    `)

    const parsed = JSON.parse(result)

    if (parsed.error) {
      throw new Error(parsed.error)
    }

    return {
      q1: parsed.q1,
      q3: parsed.q3,
      iqr: parsed.iqr,
      lowerBound: parsed.lower_bound,
      upperBound: parsed.upper_bound,
      mildOutliers: parsed.mild_outliers,
      extremeOutliers: parsed.extreme_outliers
    }
  }

  /**
   * Levene 등분산성 검정
   * @param groups 그룹별 데이터 배열
   * @returns 검정 결과
   */
  async leveneTest(groups: number[][]): Promise<{
    statistic: number
    pValue: number
    equalVariance: boolean
  }> {
    await this.initialize()

    this.pyodide.globals.set('groups_data', groups)

    const result = await this.pyodide.runPythonAsync(`
      # 각 그룹 정제
      clean_groups = []
      for group in groups_data:
        clean_group = [x for x in group if x is not None and not np.isnan(x)]
        if len(clean_group) > 0:
          clean_groups.append(clean_group)

      if len(clean_groups) < 2:
        result = {'error': 'Need at least 2 groups'}
      else:
        # Levene 검정
        statistic, pvalue = stats.levene(*clean_groups)
        result = {
          'statistic': float(statistic),
          'pvalue': float(pvalue)
        }

      json.dumps(result)
    `)

    const parsed = JSON.parse(result)

    if (parsed.error) {
      throw new Error(parsed.error)
    }

    return {
      statistic: parsed.statistic,
      pValue: parsed.pvalue,
      equalVariance: parsed.pvalue > 0.05
    }
  }

  /**
   * 기술통계 계산
   * @param data 숫자 배열
   * @returns 평균, 중앙값, 표준편차 등
   */
  async descriptiveStats(data: number[]): Promise<{
    mean: number
    median: number
    std: number
    min: number
    max: number
    q1: number
    q3: number
    skewness: number
    kurtosis: number
  }> {
    console.log('[descriptiveStats] 시작, 데이터 길이:', data.length)

    try {
      console.log('[descriptiveStats] 초기화 중...')
      await this.initialize()
      console.log('[descriptiveStats] 초기화 완료')
    } catch (error) {
      console.error('[descriptiveStats] 초기화 실패:', error)
      throw error
    }

    console.log('[descriptiveStats] Pyodide 확인:', this.pyodide ? '있음' : '없음')
    if (!this.pyodide) {
      console.error('[descriptiveStats] Pyodide가 null입니다!')
      console.log('[descriptiveStats] window.pyodide 값:', (window as any).pyodide)
      throw new Error('Pyodide가 초기화되지 않았습니다')
    }

    console.log('[descriptiveStats] 데이터를 Python으로 전달 중...')
    this.pyodide.globals.set('data_array', data)

    console.log('[descriptiveStats] Python 코드 실행 중...')
    const result = await this.pyodide.runPythonAsync(`
      # 결측값 제거
      clean_data = np.array([x for x in data_array if x is not None and not np.isnan(x)])

      if len(clean_data) == 0:
        result = {'error': 'No valid data'}
      else:
        result = {
          'mean': float(np.mean(clean_data)),
          'median': float(np.median(clean_data)),
          'std': float(np.std(clean_data, ddof=1)),
          'min': float(np.min(clean_data)),
          'max': float(np.max(clean_data)),
          'q1': float(np.percentile(clean_data, 25)),
          'q3': float(np.percentile(clean_data, 75)),
          'skewness': float(stats.skew(clean_data)),
          'kurtosis': float(stats.kurtosis(clean_data))
        }

      json.dumps(result)
    `)

    const parsed = JSON.parse(result)

    if (parsed.error) {
      throw new Error(parsed.error)
    }

    return parsed
  }

  /**
   * 상관계수 계산 (Pearson & Spearman)
   * @param x 첫 번째 변수
   * @param y 두 번째 변수
   * @returns 상관계수와 p-value
   */
  async correlation(x: number[], y: number[]): Promise<{
    pearson: { r: number; pValue: number }
    spearman: { r: number; pValue: number }
  }> {
    await this.initialize()

    this.pyodide.globals.set('x_array', x)
    this.pyodide.globals.set('y_array', y)

    const result = await this.pyodide.runPythonAsync(`
      # 쌍별 결측값 제거
      x_list = list(x_array)
      y_list = list(y_array)

      clean_pairs = [(x, y) for x, y in zip(x_list, y_list)
                     if x is not None and y is not None
                     and not np.isnan(x) and not np.isnan(y)]

      if len(clean_pairs) < 3:
        result = {'error': 'Insufficient paired data'}
      else:
        x_clean = [p[0] for p in clean_pairs]
        y_clean = [p[1] for p in clean_pairs]

        # Pearson 상관계수
        pearson_r, pearson_p = stats.pearsonr(x_clean, y_clean)

        # Spearman 상관계수
        spearman_r, spearman_p = stats.spearmanr(x_clean, y_clean)

        result = {
          'pearson': {
            'r': float(pearson_r),
            'pvalue': float(pearson_p)
          },
          'spearman': {
            'r': float(spearman_r),
            'pvalue': float(spearman_p)
          }
        }

      json.dumps(result)
    `)

    const parsed = JSON.parse(result)

    if (parsed.error) {
      throw new Error(parsed.error)
    }

    return {
      pearson: {
        r: parsed.pearson.r,
        pValue: parsed.pearson.pvalue
      },
      spearman: {
        r: parsed.spearman.r,
        pValue: parsed.spearman.pvalue
      }
    }
  }

  /**
   * t-검정 수행
   * @param group1 첫 번째 그룹 데이터
   * @param group2 두 번째 그룹 데이터
   * @param options 검정 옵션
   */
  async tTest(
    group1: number[],
    group2: number[],
    options: { paired?: boolean; equalVar?: boolean } = {}
  ): Promise<{
    statistic: number
    pvalue: number
    df: number
    confidenceInterval?: { lower: number; upper: number }
  }> {
    await this.initialize()

    this.pyodide.globals.set('group1', group1)
    this.pyodide.globals.set('group2', group2)
    this.pyodide.globals.set('paired', options.paired || false)
    this.pyodide.globals.set('equal_var', options.equalVar !== false)

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np
      from scipy import stats

      # 데이터 정리
      g1 = np.array([x for x in group1 if x is not None and not np.isnan(x)])
      g2 = np.array([x for x in group2 if x is not None and not np.isnan(x)])

      if paired:
        # 대응표본 t-검정
        if len(g1) != len(g2):
          result = {'error': 'Paired t-test requires equal sample sizes'}
        else:
          t_stat, p_value = stats.ttest_rel(g1, g2)
          df = len(g1) - 1

          # 신뢰구간 계산
          mean_diff = np.mean(g1) - np.mean(g2)
          se_diff = np.sqrt(np.var(g1 - g2) / len(g1))  # 대응표본용 SE
          t_critical = stats.t.ppf(0.975, df)
          ci_lower = mean_diff - t_critical * se_diff
          ci_upper = mean_diff + t_critical * se_diff

          result = {
            'statistic': float(t_stat),
            'pvalue': float(p_value),
            'df': int(df),
            'confidenceInterval': {
              'lower': float(ci_lower),
              'upper': float(ci_upper)
            }
          }
      else:
        # 독립표본 t-검정
        t_stat, p_value = stats.ttest_ind(g1, g2, equal_var=equal_var)
        df = len(g1) + len(g2) - 2

        # 신뢰구간 계산
        mean_diff = np.mean(g1) - np.mean(g2)
        se_diff = np.sqrt(np.var(g1)/len(g1) + np.var(g2)/len(g2))
        t_critical = stats.t.ppf(0.975, df)
        ci_lower = mean_diff - t_critical * se_diff
        ci_upper = mean_diff + t_critical * se_diff

        result = {
          'statistic': float(t_stat),
          'pvalue': float(p_value),
          'df': int(df),
          'confidenceInterval': {
            'lower': float(ci_lower),
            'upper': float(ci_upper)
          }
        }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * 일원분산분석 (One-way ANOVA)
   * @param groups 그룹별 데이터 배열
   */
  async anova(
    groups: number[][],
    options: { type?: 'one-way' | 'two-way' } = {}
  ): Promise<{
    fStatistic: number
    pvalue: number
    df: number[]
    etaSquared?: number
  }> {
    await this.initialize()

    this.pyodide.globals.set('groups_data', groups)

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np
      from scipy import stats

      # 각 그룹 데이터 정리
      groups_clean = []
      for group in groups_data:
        clean = [x for x in group if x is not None and not np.isnan(x)]
        if len(clean) > 0:
          groups_clean.append(clean)

      if len(groups_clean) < 2:
        result = {'error': 'ANOVA requires at least 2 groups'}
      else:
        # 일원분산분석
        f_stat, p_value = stats.f_oneway(*groups_clean)

        # 자유도 계산
        n_groups = len(groups_clean)
        n_total = sum(len(g) for g in groups_clean)
        df_between = n_groups - 1
        df_within = n_total - n_groups

        # 효과크기 (eta-squared) 계산
        grand_mean = np.mean([x for group in groups_clean for x in group])
        ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in groups_clean)
        ss_total = sum((x - grand_mean)**2 for group in groups_clean for x in group)
        eta_squared = ss_between / ss_total if ss_total > 0 else 0

        result = {
          'fStatistic': float(f_stat),
          'pvalue': float(p_value),
          'df': [int(df_between), int(df_within)],
          'etaSquared': float(eta_squared)
        }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * 단순선형회귀분석
   * @param x 독립변수
   * @param y 종속변수
   */
  async regression(
    x: number[],
    y: number[],
    options: { type?: 'simple' | 'multiple' } = {}
  ): Promise<{
    slope?: number
    intercept?: number
    rSquared: number
    pvalue: number
    fStatistic?: number
    tStatistic?: number
    predictions?: number[]
    df?: number
  }> {
    await this.initialize()

    this.pyodide.globals.set('x_data', x)
    this.pyodide.globals.set('y_data', y)

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np
      from scipy import stats

      # 데이터 정리
      x_list = list(x_data)
      y_list = list(y_data)

      clean_pairs = [(x, y) for x, y in zip(x_list, y_list)
                     if x is not None and y is not None
                     and not np.isnan(x) and not np.isnan(y)]

      if len(clean_pairs) < 3:
        result = {'error': 'Insufficient data for regression'}
      else:
        x_clean = np.array([p[0] for p in clean_pairs])
        y_clean = np.array([p[1] for p in clean_pairs])

        # 선형회귀
        slope, intercept, r_value, p_value, std_err = stats.linregress(x_clean, y_clean)

        # 예측값
        predictions = slope * x_clean + intercept

        # F-통계량 계산
        n = len(x_clean)
        df_model = 1
        df_resid = n - 2
        r_squared = r_value ** 2

        if r_squared < 1:
          f_stat = (r_squared / df_model) / ((1 - r_squared) / df_resid)
        else:
          f_stat = float('inf')

        # t-통계량
        t_stat = slope / std_err if std_err > 0 else float('inf')

        result = {
          'slope': float(slope),
          'intercept': float(intercept),
          'rSquared': float(r_squared),
          'pvalue': float(p_value),
          'fStatistic': float(f_stat),
          'tStatistic': float(t_stat),
          'predictions': predictions.tolist(),
          'df': int(df_resid)
        }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * Mann-Whitney U 검정 (비모수)
   */
  async mannWhitneyU(
    group1: number[],
    group2: number[]
  ): Promise<{
    statistic: number
    pvalue: number
  }> {
    await this.initialize()

    this.pyodide.globals.set('group1', group1)
    this.pyodide.globals.set('group2', group2)

    const result = await this.pyodide.runPythonAsync(`
      from scipy import stats
      import numpy as np

      # 데이터 정리
      g1 = [x for x in group1 if x is not None and not np.isnan(x)]
      g2 = [x for x in group2 if x is not None and not np.isnan(x)]

      if len(g1) < 1 or len(g2) < 1:
        result = {'error': 'Insufficient data for Mann-Whitney U test'}
      else:
        u_stat, p_value = stats.mannwhitneyu(g1, g2, alternative='two-sided')

        result = {
          'statistic': float(u_stat),
          'pvalue': float(p_value)
        }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * Wilcoxon 부호순위 검정 (대응표본 비모수)
   */
  async wilcoxon(
    group1: number[],
    group2: number[]
  ): Promise<{
    statistic: number
    pvalue: number
  }> {
    await this.initialize()

    this.pyodide.globals.set('group1', group1)
    this.pyodide.globals.set('group2', group2)

    const result = await this.pyodide.runPythonAsync(`
      from scipy import stats
      import numpy as np

      # 데이터 정리
      g1 = np.array([x for x in group1 if x is not None and not np.isnan(x)])
      g2 = np.array([x for x in group2 if x is not None and not np.isnan(x)])

      if len(g1) != len(g2):
        result = {'error': 'Wilcoxon test requires equal sample sizes'}
      elif len(g1) < 2:
        result = {'error': 'Insufficient data for Wilcoxon test'}
      else:
        w_stat, p_value = stats.wilcoxon(g1, g2)

        result = {
          'statistic': float(w_stat),
          'pvalue': float(p_value)
        }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * Kruskal-Wallis H 검정 (일원분산분석 비모수)
   */
  async kruskalWallis(groups: number[][]): Promise<{
    statistic: number
    pvalue: number
    df: number
  }> {
    await this.initialize()

    this.pyodide.globals.set('groups_data', groups)

    const result = await this.pyodide.runPythonAsync(`
      from scipy import stats
      import numpy as np

      # 각 그룹 데이터 정리
      groups_clean = []
      for group in groups_data:
        clean = [x for x in group if x is not None and not np.isnan(x)]
        if len(clean) > 0:
          groups_clean.append(clean)

      if len(groups_clean) < 2:
        result = {'error': 'Kruskal-Wallis requires at least 2 groups'}
      else:
        h_stat, p_value = stats.kruskal(*groups_clean)
        df = len(groups_clean) - 1

        result = {
          'statistic': float(h_stat),
          'pvalue': float(p_value),
          'df': int(df)
        }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * Tukey HSD 사후검정
   */
  async tukeyHSD(groups: number[][]): Promise<any> {
    await this.initialize()

    this.pyodide.globals.set('groups_data', groups)

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np
      from scipy import stats

      # statsmodels가 없으므로 간단한 구현
      groups_clean = []
      for group in groups_data:
        clean = [x for x in group if x is not None and not np.isnan(x)]
        if len(clean) > 0:
          groups_clean.append(clean)

      n_groups = len(groups_clean)
      comparisons = []

      for i in range(n_groups):
        for j in range(i+1, n_groups):
          mean_diff = np.mean(groups_clean[i]) - np.mean(groups_clean[j])
          # 간단한 t-test로 대체
          t_stat, p_value = stats.ttest_ind(groups_clean[i], groups_clean[j])

          comparisons.append({
            'group1': i,
            'group2': j,
            'meanDiff': float(mean_diff),
            'pvalue': float(p_value),
            'significant': bool(p_value < 0.05)
          })

      result = {'comparisons': comparisons}
      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * Chi-square 검정
   */
  async chiSquare(contingencyTable: number[][]): Promise<{
    statistic: number
    pvalue: number
    df: number
  }> {
    await this.initialize()

    this.pyodide.globals.set('table_data', contingencyTable)

    const result = await this.pyodide.runPythonAsync(`
      from scipy import stats
      import numpy as np

      table = np.array(table_data)

      if table.size == 0:
        result = {'error': 'Empty contingency table'}
      else:
        chi2, p_value, dof, expected = stats.chi2_contingency(table)

        result = {
          'statistic': float(chi2),
          'pvalue': float(p_value),
          'df': int(dof)
        }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * PCA (주성분분석) - 간단한 구현
   */
  async pca(data: number[][]): Promise<{
    explainedVariance: number[]
    totalExplainedVariance: number
    components: number[][]
  }> {
    await this.initialize()

    this.pyodide.globals.set('data_matrix', data)

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np

      # 데이터 행렬 정리
      X = np.array(data_matrix)

      # 평균 중심화
      X_centered = X - np.mean(X, axis=0)

      # 공분산 행렬
      cov_matrix = np.cov(X_centered.T)

      # 고유값, 고유벡터
      eigenvalues, eigenvectors = np.linalg.eig(cov_matrix)

      # 설명된 분산
      total_variance = np.sum(eigenvalues)
      explained_variance = eigenvalues / total_variance

      result = {
        'explainedVariance': explained_variance.tolist(),
        'totalExplainedVariance': float(np.sum(explained_variance[:2])),  # 첫 2개 주성분
        'components': eigenvectors[:, :2].tolist()
      }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * Cronbach's Alpha (신뢰도 계수)
   */
  async cronbachAlpha(items: number[][]): Promise<{
    alpha: number
    itemTotalCorrelations?: number[]
  }> {
    await this.initialize()

    this.pyodide.globals.set('items_data', items)

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np

      # 데이터 행렬로 변환
      X = np.array(items_data)
      n_items = X.shape[1]

      if n_items < 2:
        result = {'alpha': 0, 'error': 'Need at least 2 items'}
      else:
        # 각 항목의 분산
        item_variances = np.var(X, axis=0, ddof=1)
        total_variance = np.var(np.sum(X, axis=1), ddof=1)

        # Cronbach's alpha 계산
        alpha = (n_items / (n_items - 1)) * (1 - np.sum(item_variances) / total_variance)

        # 항목-전체 상관
        total_scores = np.sum(X, axis=1)
        item_total_corr = []
        for i in range(n_items):
          corr = np.corrcoef(X[:, i], total_scores)[0, 1]
          item_total_corr.append(float(corr))

        result = {
          'alpha': float(alpha),
          'itemTotalCorrelations': item_total_corr
        }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * Friedman 검정 (반복측정 비모수 검정)
   */
  async friedman(data: number[][]): Promise<{
    statistic: number
    pvalue: number
    rankings: number[]
  }> {
    await this.initialize()
    if (!this.pyodide) throw new Error('Pyodide not initialized')

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np
      from scipy import stats
      import json

      data = np.array(${JSON.stringify(data)})

      # Friedman 검정
      statistic, pvalue = stats.friedmanchisquare(*data.T)

      # 순위 계산
      ranks = stats.rankdata(data, axis=1, method='average')
      mean_ranks = np.mean(ranks, axis=0)

      result = {
        'statistic': float(statistic),
        'pvalue': float(pvalue),
        'rankings': mean_ranks.tolist()
      }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * 요인분석 (Factor Analysis)
   */
  async factorAnalysis(data: number[][], options: {
    nFactors?: number
    rotation?: 'varimax' | 'quartimax' | 'oblimin'
  } = {}): Promise<{
    loadings: number[][]
    communalities: number[]
    explainedVariance: number[]
    eigenvalues: number[]
  }> {
    await this.initialize()
    if (!this.pyodide) throw new Error('Pyodide not initialized')

    const { nFactors = 2, rotation = 'varimax' } = options

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np
      from sklearn.decomposition import FactorAnalysis
      from scipy import stats
      import json

      data = np.array(${JSON.stringify(data)})

      # 표준화
      from sklearn.preprocessing import StandardScaler
      scaler = StandardScaler()
      data_scaled = scaler.fit_transform(data)

      # 요인분석
      fa = FactorAnalysis(n_components=${nFactors}, rotation='${rotation}')
      fa.fit(data_scaled)

      # 결과 추출
      loadings = fa.components_.T  # 적재값
      communalities = 1 - fa.noise_variance_  # 공통성

      # 설명된 분산 계산
      explained_var = np.var(fa.transform(data_scaled), axis=0)
      total_var = np.sum(explained_var)
      explained_var_ratio = explained_var / total_var if total_var > 0 else explained_var

      # 고유값 계산 (근사)
      eigenvalues = explained_var * len(loadings[0])

      result = {
        'loadings': loadings.tolist(),
        'communalities': communalities.tolist(),
        'explainedVariance': explained_var_ratio.tolist(),
        'eigenvalues': eigenvalues.tolist()
      }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * 군집분석 (Cluster Analysis)
   */
  async clusterAnalysis(data: number[][], options: {
    nClusters?: number
    method?: 'kmeans' | 'hierarchical' | 'dbscan'
    linkage?: 'ward' | 'complete' | 'average' | 'single'
  } = {}): Promise<{
    clusters: number[]
    centers?: number[][]
    silhouetteScore: number
    inertia?: number
  }> {
    await this.initialize()
    if (!this.pyodide) throw new Error('Pyodide not initialized')

    const {
      nClusters = 3,
      method = 'kmeans',
      linkage = 'ward'
    } = options

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np
      from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
      from sklearn.metrics import silhouette_score
      from sklearn.preprocessing import StandardScaler
      import json

      data = np.array(${JSON.stringify(data)})

      # 표준화
      scaler = StandardScaler()
      data_scaled = scaler.fit_transform(data)

      # 군집분석
      if '${method}' == 'kmeans':
        model = KMeans(n_clusters=${nClusters}, random_state=42)
        clusters = model.fit_predict(data_scaled)
        centers = scaler.inverse_transform(model.cluster_centers_)
        inertia = float(model.inertia_)
      elif '${method}' == 'hierarchical':
        model = AgglomerativeClustering(n_clusters=${nClusters}, linkage='${linkage}')
        clusters = model.fit_predict(data_scaled)
        centers = None
        inertia = None
      else:  # dbscan
        model = DBSCAN(eps=0.5, min_samples=5)
        clusters = model.fit_predict(data_scaled)
        centers = None
        inertia = None

      # Silhouette score 계산
      if len(np.unique(clusters)) > 1:
        silhouette = float(silhouette_score(data_scaled, clusters))
      else:
        silhouette = 0.0

      result = {
        'clusters': clusters.tolist(),
        'centers': centers.tolist() if centers is not None else None,
        'silhouetteScore': silhouette,
        'inertia': inertia
      }

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * 시계열 분석 (Time Series Analysis)
   */
  async timeSeriesAnalysis(data: number[], options: {
    seasonalPeriod?: number
    forecastPeriods?: number
    method?: 'decomposition' | 'arima' | 'exponential'
  } = {}): Promise<{
    trend?: number[]
    seasonal?: number[]
    residual?: number[]
    forecast?: number[]
    acf?: number[]
    pacf?: number[]
  }> {
    await this.initialize()
    if (!this.pyodide) throw new Error('Pyodide not initialized')

    const {
      seasonalPeriod = 12,
      forecastPeriods = 6,
      method = 'decomposition'
    } = options

    const result = await this.pyodide.runPythonAsync(`
      import numpy as np
      from scipy import stats, signal
      from statsmodels.tsa.seasonal import seasonal_decompose
      from statsmodels.tsa.stattools import acf, pacf
      import json

      data = np.array(${JSON.stringify(data)})

      result = {}

      if '${method}' == 'decomposition':
        # 시계열 분해
        if len(data) >= 2 * ${seasonalPeriod}:
          from statsmodels.tsa.seasonal import STL
          stl = STL(data, seasonal=${seasonalPeriod})
          decomposition = stl.fit()

          json.dumps(result)['trend'] = decomposition.trend.tolist()
          json.dumps(result)['seasonal'] = decomposition.seasonal.tolist()
          json.dumps(result)['residual'] = decomposition.resid.tolist()
        else:
          # 데이터가 짧을 경우 간단한 이동평균
          window = min(${seasonalPeriod}, len(data) // 2)
          trend = np.convolve(data, np.ones(window)/window, mode='same')
          json.dumps(result)['trend'] = trend.tolist()
          json.dumps(result)['seasonal'] = [0] * len(data)
          json.dumps(result)['residual'] = (data - trend).tolist()

      # ACF/PACF 계산
      max_lags = min(40, len(data) // 2)
      acf_values = acf(data, nlags=max_lags, fft=True)
      pacf_values = pacf(data, nlags=max_lags, method='ols')

      json.dumps(result)['acf'] = acf_values.tolist()
      json.dumps(result)['pacf'] = pacf_values.tolist()

      # 간단한 지수평활 예측
      if '${method}' == 'exponential' or True:  # 항상 예측 추가
        from statsmodels.tsa.holtwinters import ExponentialSmoothing

        if len(data) >= 10:
          # Holt-Winters 지수평활
          try:
            model = ExponentialSmoothing(
              data,
              seasonal_periods=${seasonalPeriod},
              seasonal='add' if len(data) >= 2 * ${seasonalPeriod} else None
            )
            fit = model.fit()
            forecast = fit.forecast(${forecastPeriods})
            json.dumps(result)['forecast'] = forecast.tolist()
          except:
            # 실패시 단순 이동평균
            last_mean = np.mean(data[-min(${seasonalPeriod}, len(data)):])
            json.dumps(result)['forecast'] = [float(last_mean)] * ${forecastPeriods}
        else:
          # 데이터가 너무 적을 때
          last_mean = np.mean(data)
          json.dumps(result)['forecast'] = [float(last_mean)] * ${forecastPeriods}

      json.dumps(result)
    `)

    return JSON.parse(result)
  }

  /**
   * Pyodide 초기화 여부 확인
   */
  isInitialized(): boolean {
    const initialized = this.pyodide !== null
    console.log(`[PyodideService.isInitialized] ${initialized ? '초기화됨' : '초기화 안됨'}`)
    return initialized
  }

  /**
   * Pyodide 인스턴스 정리
   */
  dispose(): void {
    if (this.pyodide) {
      this.pyodide = null
    }
    PyodideStatisticsService.instance = null
  }
}

// 싱글톤 인스턴스 export
export const pyodideStats = PyodideStatisticsService.getInstance()