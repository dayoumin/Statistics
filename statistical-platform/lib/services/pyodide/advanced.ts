/**
 * 고급 분석 서비스 모듈 (PCA, 클러스터링, 시계열)
 */

import { BasePyodideService } from './base'
import type {
  IAdvancedService,
  PCAResult,
  ClusteringResult,
  TimeSeriesResult
} from './types'

export class AdvancedService extends BasePyodideService implements IAdvancedService {
  private static instance: AdvancedService | null = null

  private constructor() {
    super()
  }

  static getInstance(): AdvancedService {
    if (!AdvancedService.instance) {
      AdvancedService.instance = new AdvancedService()
    }
    return AdvancedService.instance
  }

  /**
   * 주성분 분석 (PCA)
   */
  async pca(
    dataMatrix: number[][],
    columns?: string[],
    nComponents?: number,
    standardize: boolean = true
  ): Promise<PCAResult> {
    await this.initialize()
    this.setData('data_matrix', dataMatrix)
    this.setData('column_names', columns || dataMatrix[0]?.map((_, i) => `Var${i + 1}`) || [])
    this.setData('n_components', nComponents || Math.min(dataMatrix.length, dataMatrix[0]?.length || 0))
    this.setData('standardize', standardize)

    const py_result = await this.runPythonSafely(`
      import pandas as pd
      from sklearn.decomposition import PCA
      from sklearn.preprocessing import StandardScaler

      # 데이터 준비
      X = np.array(data_matrix)

      if X.shape[0] < 2 or X.shape[1] < 2:
        py_result = {'error': 'PCA requires at least 2 samples and 2 variables'}
      else:
        # 결측값 처리
        df = pd.DataFrame(X, columns=column_names[:X.shape[1]])
        df_clean = df.dropna()

        if len(df_clean) < 2:
          py_result = {'error': 'Too many missing values for PCA'}
        else:
          X_clean = df_clean.values
          n_samples, n_features = X_clean.shape

          # 표준화 (선택적)
          if standardize:
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X_clean)
          else:
            X_scaled = X_clean

          # PCA 수행
          max_components = min(n_samples, n_features)
          actual_n_components = min(n_components, max_components)

          pca = PCA(n_components=actual_n_components)
          X_transformed = pca.fit_transform(X_scaled)

          # 주성분 계수 (로딩)
          loadings = pca.components_.T * np.sqrt(pca.explained_variance_)

          # 누적 설명 분산
          cumulative_variance = np.cumsum(pca.explained_variance_ratio_)

          py_result = {
            'components': pca.components_.tolist(),
            'explainedVariance': pca.explained_variance_.tolist(),
            'explainedVarianceRatio': pca.explained_variance_ratio_.tolist(),
            'cumulativeVarianceRatio': cumulative_variance.tolist(),
            'loadings': loadings.tolist(),
            'scores': X_transformed.tolist(),
            'eigenvalues': pca.explained_variance_.tolist(),
            'nComponents': int(actual_n_components),
            'nSamples': int(n_samples),
            'nFeatures': int(n_features),
            'featureNames': column_names[:n_features],
            'isStandardized': bool(standardize)
          }

          # Kaiser 기준 (고유값 > 1) 적용 정보
          kaiser_components = np.sum(pca.explained_variance_ > 1)
          py_result['kaiserComponents'] = int(kaiser_components)

          # 첫 번째 주성분들의 해석을 위한 로딩 정보
          if actual_n_components >= 2:
            pc1_loadings = loadings[:, 0]
            pc2_loadings = loadings[:, 1]
            py_result['pc1Interpretation'] = {
              'strongestPositive': column_names[np.argmax(pc1_loadings)] if len(column_names) > np.argmax(pc1_loadings) else f'Var{np.argmax(pc1_loadings)+1}',
              'strongestNegative': column_names[np.argmin(pc1_loadings)] if len(column_names) > np.argmin(pc1_loadings) else f'Var{np.argmin(pc1_loadings)+1}',
              'maxLoading': float(np.max(np.abs(pc1_loadings)))
            }
            py_result['pc2Interpretation'] = {
              'strongestPositive': column_names[np.argmax(pc2_loadings)] if len(column_names) > np.argmax(pc2_loadings) else f'Var{np.argmax(pc2_loadings)+1}',
              'strongestNegative': column_names[np.argmin(pc2_loadings)] if len(column_names) > np.argmin(pc2_loadings) else f'Var{np.argmin(pc2_loadings)+1}',
              'maxLoading': float(np.max(np.abs(pc2_loadings)))
            }

      import json
      json.dumps(py_result)
    `)

    const result = JSON.parse(py_result)
    if (result.error) {
      throw new Error(result.error)
    }

    return result as PCAResult
  }

  /**
   * K-means 클러스터링
   */
  async clustering(data: number[][], nClusters: number, method: string = 'kmeans'): Promise<ClusteringResult> {
    await this.initialize()
    this.setData('data_matrix', data)
    this.setData('n_clusters', nClusters)
    this.setData('method', method.toLowerCase())

    const py_result = await this.runPythonSafely(`
      import pandas as pd
      from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
      from sklearn.preprocessing import StandardScaler
      from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score

      # 데이터 준비
      X = np.array(data_matrix)

      if X.shape[0] < n_clusters:
        py_result = {'error': f'Number of samples ({X.shape[0]}) must be >= number of clusters ({n_clusters})'}
      elif n_clusters < 2:
        py_result = {'error': 'Number of clusters must be at least 2'}
      else:
        # 결측값 처리
        df = pd.DataFrame(X)
        df_clean = df.dropna()

        if len(df_clean) < n_clusters:
          py_result = {'error': 'Too many missing values for clustering'}
        else:
          X_clean = df_clean.values

          # 데이터 표준화
          scaler = StandardScaler()
          X_scaled = scaler.fit_transform(X_clean)

          # 클러스터링 수행
          if method == 'kmeans':
            clusterer = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = clusterer.fit_predict(X_scaled)
            centers_scaled = clusterer.cluster_centers_
            # 원본 스케일로 변환
            centers = scaler.inverse_transform(centers_scaled)
            inertia = clusterer.inertia_

          elif method == 'hierarchical':
            clusterer = AgglomerativeClustering(n_clusters=n_clusters)
            labels = clusterer.fit_predict(X_scaled)
            # 계층적 클러스터링은 중심점이 없으므로 각 클러스터의 평균으로 계산
            centers = []
            for i in range(n_clusters):
              cluster_points = X_clean[labels == i]
              if len(cluster_points) > 0:
                centers.append(np.mean(cluster_points, axis=0).tolist())
              else:
                centers.append([0] * X_clean.shape[1])
            inertia = 0  # 계층적 클러스터링에서는 해당 없음

          elif method == 'dbscan':
            # DBSCAN은 클러스터 수를 지정하지 않으므로 eps 값을 조정해야 함
            clusterer = DBSCAN(eps=0.5, min_samples=5)
            labels = clusterer.fit_predict(X_scaled)
            unique_labels = np.unique(labels)
            n_clusters_found = len(unique_labels) - (1 if -1 in unique_labels else 0)

            centers = []
            for label in unique_labels:
              if label != -1:  # 노이즈 포인트 제외
                cluster_points = X_clean[labels == label]
                centers.append(np.mean(cluster_points, axis=0).tolist())

            inertia = 0  # DBSCAN에서는 해당 없음
            n_clusters = n_clusters_found

          else:
            py_result = {'error': f'Unknown clustering method: {method}'}

          if 'py_result' not in locals() or 'error' not in py_result:
            # 클러스터링 품질 지표 계산
            if len(np.unique(labels)) > 1:
              silhouette_avg = silhouette_score(X_scaled, labels)
              calinski_harabasz = calinski_harabasz_score(X_scaled, labels)
              davies_bouldin = davies_bouldin_score(X_scaled, labels)
            else:
              silhouette_avg = 0
              calinski_harabasz = 0
              davies_bouldin = float('inf')

            # 클러스터별 통계
            cluster_stats = []
            for i in range(n_clusters):
              cluster_mask = labels == i
              cluster_size = np.sum(cluster_mask)
              if cluster_size > 0:
                cluster_data = X_clean[cluster_mask]
                cluster_stats.append({
                  'clusterId': int(i),
                  'size': int(cluster_size),
                  'percentage': float(cluster_size / len(X_clean) * 100),
                  'center': centers[i] if i < len(centers) else [0] * X_clean.shape[1]
                })

            py_result = {
              'labels': labels.tolist(),
              'centers': centers,
              'inertia': float(inertia),
              'silhouetteScore': float(silhouette_avg),
              'calinskiHarabaszScore': float(calinski_harabasz),
              'daviesBouldinScore': float(davies_bouldin),
              'nClusters': int(n_clusters),
              'nSamples': int(len(X_clean)),
              'nFeatures': int(X_clean.shape[1]),
              'method': method,
              'clusterStats': cluster_stats
            }

            # 노이즈 포인트 정보 (DBSCAN의 경우)
            if method == 'dbscan':
              n_noise = np.sum(labels == -1)
              py_result['nNoise'] = int(n_noise)
              py_result['noiseRatio'] = float(n_noise / len(X_clean))

      import json
      json.dumps(py_result)
    `)

    const result = JSON.parse(py_result)
    if (result.error) {
      throw new Error(result.error)
    }

    return result as ClusteringResult
  }

  /**
   * 시계열 분해 (계절성, 추세, 잔차)
   */
  async timeSeriesDecomposition(data: number[], period?: number): Promise<TimeSeriesResult> {
    await this.initialize()
    this.setData('time_series', data)
    this.setData('period', period || this.detectPeriod(data))

    const py_result = await this.runPythonSafely(`
      # 결측값 제거
      ts_data = np.array([x for x in time_series if x is not None and not np.isnan(x)])

      if len(ts_data) < period * 2:
        py_result = {'error': f'Time series too short for decomposition with period {period}'}
      else:
        try:
          # statsmodels를 사용한 시계열 분해
          import statsmodels.api as sm
          from statsmodels.tsa.seasonal import seasonal_decompose

          # 분해 수행 (additive model)
          decomposition = seasonal_decompose(ts_data, model='additive', period=period)

          py_result = {
            'trend': decomposition.trend.tolist(),
            'seasonal': decomposition.seasonal.tolist(),
            'residual': decomposition.resid.tolist(),
            'observed': ts_data.tolist(),
            'period': int(period),
            'method': 'Additive decomposition',
            'length': int(len(ts_data))
          }

          # 계절성 강도 계산
          seasonal_strength = np.var(decomposition.seasonal, ddof=1) / np.var(ts_data, ddof=1)
          trend_strength = np.var(decomposition.trend[~np.isnan(decomposition.trend)], ddof=1) / np.var(ts_data, ddof=1)

          py_result['seasonalStrength'] = float(seasonal_strength)
          py_result['trendStrength'] = float(trend_strength)

        except ImportError:
          # statsmodels가 없는 경우 간단한 이동평균 분해
          # 추세: 이동평균
          window = period
          trend = np.convolve(ts_data, np.ones(window)/window, mode='same')

          # 계절성: 주기별 평균에서 추세 제거
          detrended = ts_data - trend
          seasonal_pattern = np.zeros(period)
          for i in range(period):
            seasonal_pattern[i] = np.mean(detrended[i::period])

          # 전체 시계열에 계절성 패턴 적용
          seasonal = np.tile(seasonal_pattern, len(ts_data) // period + 1)[:len(ts_data)]

          # 잔차
          residual = ts_data - trend - seasonal

          py_result = {
            'trend': trend.tolist(),
            'seasonal': seasonal.tolist(),
            'residual': residual.tolist(),
            'observed': ts_data.tolist(),
            'period': int(period),
            'method': 'Simple moving average decomposition',
            'length': int(len(ts_data)),
            'note': 'Limited decomposition without statsmodels'
          }

      import json
      json.dumps(py_result)
    `)

    const result = JSON.parse(py_result)
    if (result.error) {
      throw new Error(result.error)
    }

    return result as TimeSeriesResult
  }

  /**
   * 시계열 주기 자동 감지 (간단한 자기상관 기반)
   */
  private detectPeriod(data: number[]): number {
    // 간단한 주기 감지 로직
    const cleanData = data.filter(x => x !== null && !isNaN(x))

    if (cleanData.length < 10) return 4  // 기본값

    // 일반적인 주기들을 테스트 (4, 7, 12, 24 등)
    const commonPeriods = [4, 7, 12, 24, 52]
    let bestPeriod = 4

    for (const period of commonPeriods) {
      if (cleanData.length >= period * 2) {
        bestPeriod = period
        break
      }
    }

    return bestPeriod
  }

  /**
   * Cronbach's Alpha 신뢰도 분석
   */
  async cronbachAlpha(items: number[][]): Promise<{
    alpha: number
    itemTotalCorrelations: number[]
    alphaIfDeleted: number[]
    nItems: number
    nObservations: number
  }> {
    await this.initialize()
    this.setData('items_data', items)

    const py_result = await this.runPythonSafely(`
      # 데이터 행렬로 변환 (observations x items)
      X = np.array(items_data)

      if X.shape[1] < 2:
        py_result = {'error': 'Need at least 2 items for reliability analysis'}
      elif X.shape[0] < 2:
        py_result = {'error': 'Need at least 2 observations for reliability analysis'}
      else:
        # 결측값이 있는 행 제거
        valid_rows = ~np.isnan(X).any(axis=1)
        X_clean = X[valid_rows]

        if X_clean.shape[0] < 2:
          py_result = {'error': 'Too many missing values for reliability analysis'}
        else:
          n_obs, n_items = X_clean.shape

          # 각 항목의 분산
          item_variances = np.var(X_clean, axis=0, ddof=1)

          # 총점의 분산
          total_scores = np.sum(X_clean, axis=1)
          total_variance = np.var(total_scores, ddof=1)

          # Cronbach's alpha 계산
          alpha = (n_items / (n_items - 1)) * (1 - np.sum(item_variances) / total_variance)

          # 항목-전체 상관 (corrected item-total correlation)
          item_total_corr = []
          alpha_if_deleted = []

          for i in range(n_items):
            # 해당 항목을 제외한 총점
            other_items_scores = np.sum(X_clean[:, [j for j in range(n_items) if j != i]], axis=1)

            # 항목과 나머지 총점 간의 상관
            corr = np.corrcoef(X_clean[:, i], other_items_scores)[0, 1]
            item_total_corr.append(float(corr))

            # 해당 항목을 제거했을 때의 alpha
            if n_items > 2:
              other_items = X_clean[:, [j for j in range(n_items) if j != i]]
              other_variances = np.var(other_items, axis=0, ddof=1)
              other_total_var = np.var(np.sum(other_items, axis=1), ddof=1)
              alpha_without_item = ((n_items - 1) / (n_items - 2)) * (1 - np.sum(other_variances) / other_total_var)
            else:
              alpha_without_item = 0

            alpha_if_deleted.append(float(alpha_without_item))

          py_result = {
            'alpha': float(alpha),
            'itemTotalCorrelations': item_total_corr,
            'alphaIfDeleted': alpha_if_deleted,
            'nItems': int(n_items),
            'nObservations': int(n_obs),
            'interpretation': {
              'excellent': bool(alpha >= 0.9),
              'good': bool(0.8 <= alpha < 0.9),
              'acceptable': bool(0.7 <= alpha < 0.8),
              'questionable': bool(0.6 <= alpha < 0.7),
              'poor': bool(alpha < 0.6)
            }
          }

      import json
      json.dumps(py_result)
    `)

    const result = JSON.parse(py_result)
    if (result.error) {
      throw new Error(result.error)
    }

    return result
  }
}