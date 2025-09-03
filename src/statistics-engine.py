"""
통계 분석 엔진 - Pyodide 환경에서 실행
scipy.stats를 사용한 통계 검정 및 사후분석
"""

import json
import numpy as np
from scipy import stats
from typing import Dict, List, Tuple, Any
import warnings
warnings.filterwarnings('ignore')


class StatisticsEngine:
    """통계 분석 메인 클래스"""
    
    def __init__(self):
        self.significance_level = 0.05
        self.confidence_level = 0.95
        
    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        메인 분석 함수
        Args:
            data: {
                'groups': [[값1, 값2, ...], [값1, 값2, ...], ...],
                'labels': ['그룹1', '그룹2', ...],
                'options': {...}
            }
        """
        try:
            groups = [np.array(g) for g in data['groups']]
            labels = data.get('labels', [f'그룹 {i+1}' for i in range(len(groups))])
            
            # 기술통계
            descriptive_stats = self.calculate_descriptive_stats(groups, labels)
            
            # 정규성 검정
            normality_results = self.test_normality(groups, labels)
            
            # 등분산성 검정
            homogeneity_results = self.test_homogeneity(groups, labels)
            
            # 적절한 통계 검정 선택 및 수행
            test_results = self.perform_statistical_test(
                groups, labels, 
                normality_results['all_normal'], 
                homogeneity_results['equal_variance']
            )
            
            # 사후분석 (필요한 경우)
            post_hoc_results = None
            if len(groups) > 2 and test_results['significant']:
                post_hoc_results = self.perform_post_hoc(
                    groups, labels,
                    test_results['test_type'],
                    normality_results['all_normal'],
                    homogeneity_results['equal_variance']
                )
            
            return {
                'success': True,
                'descriptive': descriptive_stats,
                'normality': normality_results,
                'homogeneity': homogeneity_results,
                'test': test_results,
                'post_hoc': post_hoc_results,
                'summary': self.generate_summary(
                    groups, labels, test_results, post_hoc_results
                )
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def calculate_descriptive_stats(self, groups: List[np.ndarray], labels: List[str]) -> Dict:
        """기술통계 계산"""
        stats_list = []
        
        for i, (group, label) in enumerate(zip(groups, labels)):
            n = len(group)
            mean = np.mean(group)
            median = np.median(group)
            std = np.std(group, ddof=1)
            se = std / np.sqrt(n)
            
            # 95% 신뢰구간 (t-분포 사용)
            t_critical = stats.t.ppf((1 + self.confidence_level) / 2, n - 1)
            ci_lower = mean - t_critical * se
            ci_upper = mean + t_critical * se
            
            stats_list.append({
                'label': label,
                'n': int(n),
                'mean': float(mean),
                'median': float(median),
                'std': float(std),
                'se': float(se),
                'min': float(np.min(group)),
                'max': float(np.max(group)),
                'q1': float(np.percentile(group, 25)),
                'q3': float(np.percentile(group, 75)),
                'iqr': float(np.percentile(group, 75) - np.percentile(group, 25)),
                'ci95_lower': float(ci_lower),
                'ci95_upper': float(ci_upper),
                'cv': float(std / mean * 100) if mean != 0 else None  # 변동계수
            })
        
        return stats_list
    
    def test_normality(self, groups: List[np.ndarray], labels: List[str]) -> Dict:
        """정규성 검정"""
        results = []
        all_normal = True
        
        for group, label in zip(groups, labels):
            n = len(group)
            
            # 샘플 크기에 따라 검정 방법 선택
            if n < 50:
                # Shapiro-Wilk test (소표본에 적합)
                statistic, p_value = stats.shapiro(group)
                test_name = 'Shapiro-Wilk'
            else:
                # Kolmogorov-Smirnov test (대표본에 적합)
                # 표준정규분포와 비교
                standardized = (group - np.mean(group)) / np.std(group, ddof=1)
                statistic, p_value = stats.kstest(standardized, 'norm')
                test_name = 'Kolmogorov-Smirnov'
            
            is_normal = p_value > self.significance_level
            all_normal = all_normal and is_normal
            
            # Skewness와 Kurtosis 계산
            skewness = stats.skew(group)
            kurtosis = stats.kurtosis(group)
            
            results.append({
                'label': label,
                'test': test_name,
                'statistic': float(statistic),
                'p_value': float(p_value),
                'is_normal': is_normal,
                'skewness': float(skewness),
                'kurtosis': float(kurtosis),
                'interpretation': '정규분포를 따름' if is_normal else '정규분포를 따르지 않음'
            })
        
        return {
            'results': results,
            'all_normal': all_normal
        }
    
    def test_homogeneity(self, groups: List[np.ndarray], labels: List[str]) -> Dict:
        """등분산성 검정"""
        if len(groups) < 2:
            return {
                'results': None,
                'equal_variance': True,
                'message': '단일 그룹으로 등분산성 검정 불필요'
            }
        
        # Levene's test (정규성 가정 없이 사용 가능)
        levene_stat, levene_p = stats.levene(*groups)
        
        # Bartlett's test (정규분포 가정)
        bartlett_stat, bartlett_p = stats.bartlett(*groups)
        
        equal_variance = levene_p > self.significance_level
        
        return {
            'results': {
                'levene': {
                    'statistic': float(levene_stat),
                    'p_value': float(levene_p),
                    'interpretation': '등분산 가정 만족' if equal_variance else '등분산 가정 위배'
                },
                'bartlett': {
                    'statistic': float(bartlett_stat),
                    'p_value': float(bartlett_p),
                    'interpretation': '등분산 가정 만족' if bartlett_p > self.significance_level else '등분산 가정 위배'
                }
            },
            'equal_variance': equal_variance,
            'recommendation': 'Levene 검정 결과를 사용 (정규성 가정 불필요)'
        }
    
    def perform_statistical_test(self, groups: List[np.ndarray], labels: List[str], 
                                is_normal: bool, equal_variance: bool) -> Dict:
        """통계 검정 수행"""
        n_groups = len(groups)
        
        if n_groups == 1:
            # 단일 표본 t-test (모평균 = 0 검정)
            t_stat, p_value = stats.ttest_1samp(groups[0], 0)
            test_type = 'One-sample t-test'
            effect_size = self.calculate_cohens_d_one_sample(groups[0])
            
        elif n_groups == 2:
            # 두 그룹 비교
            if is_normal:
                if equal_variance:
                    # Independent samples t-test
                    t_stat, p_value = stats.ttest_ind(groups[0], groups[1])
                    test_type = 'Independent t-test'
                else:
                    # Welch's t-test
                    t_stat, p_value = stats.ttest_ind(groups[0], groups[1], equal_var=False)
                    test_type = "Welch's t-test"
                
                effect_size = self.calculate_cohens_d(groups[0], groups[1])
                
            else:
                # Mann-Whitney U test
                u_stat, p_value = stats.mannwhitneyu(groups[0], groups[1], alternative='two-sided')
                test_type = 'Mann-Whitney U test'
                t_stat = u_stat
                effect_size = self.calculate_rank_biserial(groups[0], groups[1])
        
        else:
            # 세 그룹 이상 비교
            if is_normal:
                if equal_variance:
                    # One-way ANOVA
                    f_stat, p_value = stats.f_oneway(*groups)
                    test_type = 'One-way ANOVA'
                    effect_size = self.calculate_eta_squared(groups, f_stat)
                else:
                    # Welch's ANOVA
                    # scipy에 직접 구현이 없어 수동 계산
                    f_stat, p_value = self.welch_anova(groups)
                    test_type = "Welch's ANOVA"
                    effect_size = self.calculate_omega_squared(groups)
                
                t_stat = f_stat
                
            else:
                # Kruskal-Wallis H test
                h_stat, p_value = stats.kruskal(*groups)
                test_type = 'Kruskal-Wallis H test'
                t_stat = h_stat
                effect_size = self.calculate_epsilon_squared(groups, h_stat)
        
        significant = p_value < self.significance_level
        
        return {
            'test_type': test_type,
            'statistic': float(t_stat),
            'p_value': float(p_value),
            'significant': significant,
            'effect_size': effect_size,
            'interpretation': self.interpret_results(test_type, significant, effect_size)
        }
    
    def welch_anova(self, groups: List[np.ndarray]) -> Tuple[float, float]:
        """Welch's ANOVA 수동 구현"""
        k = len(groups)
        n_i = np.array([len(g) for g in groups])
        mean_i = np.array([np.mean(g) for g in groups])
        var_i = np.array([np.var(g, ddof=1) for g in groups])
        
        # 가중치 계산
        w_i = n_i / var_i
        w_sum = np.sum(w_i)
        
        # 전체 가중 평균
        grand_mean = np.sum(w_i * mean_i) / w_sum
        
        # F 통계량 분자
        numerator = np.sum(w_i * (mean_i - grand_mean)**2) / (k - 1)
        
        # F 통계량 분모 (Welch 보정)
        lambda_val = 3 * np.sum((1 - w_i/w_sum)**2 / (n_i - 1)) / (k**2 - 1)
        denominator = 1 + (2 * (k - 2) * lambda_val) / (k**2 - 1)
        
        f_stat = numerator / denominator
        
        # 자유도
        df1 = k - 1
        df2 = 1 / lambda_val
        
        # p-value
        p_value = 1 - stats.f.cdf(f_stat, df1, df2)
        
        return f_stat, p_value
    
    def perform_post_hoc(self, groups: List[np.ndarray], labels: List[str],
                        test_type: str, is_normal: bool, equal_variance: bool) -> Dict:
        """사후분석 수행"""
        n_groups = len(groups)
        comparisons = []
        
        # 모든 그룹 쌍 비교
        for i in range(n_groups):
            for j in range(i + 1, n_groups):
                group1, group2 = groups[i], groups[j]
                label1, label2 = labels[i], labels[j]
                
                if 'ANOVA' in test_type:
                    if equal_variance:
                        # Tukey HSD
                        result = self.tukey_hsd_pair(group1, group2, n_groups, groups)
                        method = 'Tukey HSD'
                    else:
                        # Games-Howell
                        result = self.games_howell_pair(group1, group2)
                        method = 'Games-Howell'
                        
                elif 'Kruskal' in test_type:
                    # Dunn's test
                    result = self.dunn_test_pair(group1, group2, groups)
                    method = "Dunn's test"
                else:
                    continue
                
                # Bonferroni 보정
                n_comparisons = n_groups * (n_groups - 1) / 2
                adjusted_p = min(result['p_value'] * n_comparisons, 1.0)
                
                comparisons.append({
                    'group1': label1,
                    'group2': label2,
                    'mean_diff': float(np.mean(group1) - np.mean(group2)),
                    'p_value': float(result['p_value']),
                    'adjusted_p': float(adjusted_p),
                    'significant': adjusted_p < self.significance_level,
                    'ci_lower': float(result.get('ci_lower', 0)),
                    'ci_upper': float(result.get('ci_upper', 0))
                })
        
        return {
            'method': method,
            'comparisons': comparisons,
            'bonferroni_alpha': self.significance_level / n_comparisons
        }
    
    def tukey_hsd_pair(self, group1: np.ndarray, group2: np.ndarray, 
                      k: int, all_groups: List[np.ndarray]) -> Dict:
        """Tukey HSD for a pair (수동 구현)"""
        n1, n2 = len(group1), len(group2)
        mean1, mean2 = np.mean(group1), np.mean(group2)
        
        # MSE (Mean Square Error) 계산
        all_data = np.concatenate(all_groups)
        grand_mean = np.mean(all_data)
        sse = sum(np.sum((g - np.mean(g))**2) for g in all_groups)
        df_error = len(all_data) - k
        mse = sse / df_error
        
        # 표준 오차
        se = np.sqrt(mse * (1/n1 + 1/n2) / 2)
        
        # q 통계량
        q = abs(mean1 - mean2) / se
        
        # Studentized range distribution에서 p-value 근사
        # 간단한 근사 사용 (정확한 값은 테이블 필요)
        p_value = 1 - stats.norm.cdf(q / np.sqrt(2))
        
        # 신뢰구간
        q_critical = 3.5  # 근사값 (실제는 테이블 참조 필요)
        margin = q_critical * se
        
        return {
            'p_value': p_value,
            'ci_lower': (mean1 - mean2) - margin,
            'ci_upper': (mean1 - mean2) + margin
        }
    
    def games_howell_pair(self, group1: np.ndarray, group2: np.ndarray) -> Dict:
        """Games-Howell test for a pair"""
        n1, n2 = len(group1), len(group2)
        mean1, mean2 = np.mean(group1), np.mean(group2)
        var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
        
        # 표준 오차
        se = np.sqrt(var1/n1 + var2/n2)
        
        # t 통계량
        t = abs(mean1 - mean2) / se
        
        # Welch-Satterthwaite 자유도
        df = (var1/n1 + var2/n2)**2 / ((var1/n1)**2/(n1-1) + (var2/n2)**2/(n2-1))
        
        # p-value
        p_value = 2 * (1 - stats.t.cdf(t, df))
        
        # 신뢰구간
        t_critical = stats.t.ppf(1 - self.significance_level/2, df)
        margin = t_critical * se
        
        return {
            'p_value': p_value,
            'ci_lower': (mean1 - mean2) - margin,
            'ci_upper': (mean1 - mean2) + margin
        }
    
    def dunn_test_pair(self, group1: np.ndarray, group2: np.ndarray, 
                       all_groups: List[np.ndarray]) -> Dict:
        """Dunn's test for a pair"""
        # 전체 데이터 순위 계산
        all_data = np.concatenate(all_groups)
        n_total = len(all_data)
        
        # 순위 할당
        combined = np.concatenate([group1, group2])
        ranks = stats.rankdata(np.concatenate(all_groups))
        
        # 각 그룹의 평균 순위
        n1, n2 = len(group1), len(group2)
        rank1 = np.mean(ranks[:n1])
        rank2 = np.mean(ranks[n1:n1+n2])
        
        # z 통계량
        se = np.sqrt((n_total * (n_total + 1) / 12) * (1/n1 + 1/n2))
        z = abs(rank1 - rank2) / se
        
        # p-value
        p_value = 2 * (1 - stats.norm.cdf(z))
        
        return {
            'p_value': p_value,
            'ci_lower': 0,  # Dunn's test는 일반적으로 CI 제공 안 함
            'ci_upper': 0
        }
    
    def calculate_cohens_d(self, group1: np.ndarray, group2: np.ndarray) -> Dict:
        """Cohen's d 효과 크기 계산"""
        n1, n2 = len(group1), len(group2)
        mean1, mean2 = np.mean(group1), np.mean(group2)
        var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
        
        # Pooled standard deviation
        pooled_std = np.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2))
        
        # Cohen's d
        d = (mean1 - mean2) / pooled_std
        
        # 해석
        magnitude = 'negligible'
        if abs(d) >= 0.2:
            magnitude = 'small'
        if abs(d) >= 0.5:
            magnitude = 'medium'
        if abs(d) >= 0.8:
            magnitude = 'large'
        
        return {
            'value': float(d),
            'magnitude': magnitude,
            'interpretation': f"Cohen's d = {d:.3f} ({magnitude} effect)"
        }
    
    def calculate_cohens_d_one_sample(self, group: np.ndarray, mu: float = 0) -> Dict:
        """단일 표본 Cohen's d"""
        mean = np.mean(group)
        std = np.std(group, ddof=1)
        d = (mean - mu) / std
        
        magnitude = 'negligible'
        if abs(d) >= 0.2:
            magnitude = 'small'
        if abs(d) >= 0.5:
            magnitude = 'medium'
        if abs(d) >= 0.8:
            magnitude = 'large'
            
        return {
            'value': float(d),
            'magnitude': magnitude,
            'interpretation': f"Cohen's d = {d:.3f} ({magnitude} effect)"
        }
    
    def calculate_eta_squared(self, groups: List[np.ndarray], f_stat: float) -> Dict:
        """Eta-squared 효과 크기 계산"""
        # SS_between 계산
        all_data = np.concatenate(groups)
        grand_mean = np.mean(all_data)
        ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in groups)
        
        # SS_total 계산
        ss_total = np.sum((all_data - grand_mean)**2)
        
        # Eta-squared
        eta_sq = ss_between / ss_total
        
        # 해석
        magnitude = 'small'
        if eta_sq >= 0.06:
            magnitude = 'medium'
        if eta_sq >= 0.14:
            magnitude = 'large'
        
        return {
            'value': float(eta_sq),
            'magnitude': magnitude,
            'interpretation': f"η² = {eta_sq:.3f} ({magnitude} effect)"
        }
    
    def calculate_omega_squared(self, groups: List[np.ndarray]) -> Dict:
        """Omega-squared 효과 크기 계산"""
        k = len(groups)
        n_total = sum(len(g) for g in groups)
        
        # ANOVA 계산
        f_stat, _ = stats.f_oneway(*groups)
        
        # Omega-squared
        df_between = k - 1
        df_within = n_total - k
        
        omega_sq = (f_stat - 1) / (f_stat + (df_within + 1) / df_between)
        omega_sq = max(0, omega_sq)  # 음수 방지
        
        # 해석
        magnitude = 'small'
        if omega_sq >= 0.06:
            magnitude = 'medium'
        if omega_sq >= 0.14:
            magnitude = 'large'
        
        return {
            'value': float(omega_sq),
            'magnitude': magnitude,
            'interpretation': f"ω² = {omega_sq:.3f} ({magnitude} effect)"
        }
    
    def calculate_rank_biserial(self, group1: np.ndarray, group2: np.ndarray) -> Dict:
        """Rank-biserial 상관계수 (Mann-Whitney U test 효과 크기)"""
        u_stat, _ = stats.mannwhitneyu(group1, group2)
        n1, n2 = len(group1), len(group2)
        
        # Rank-biserial correlation
        r = 1 - (2 * u_stat) / (n1 * n2)
        
        # 해석
        magnitude = 'negligible'
        if abs(r) >= 0.1:
            magnitude = 'small'
        if abs(r) >= 0.3:
            magnitude = 'medium'
        if abs(r) >= 0.5:
            magnitude = 'large'
        
        return {
            'value': float(r),
            'magnitude': magnitude,
            'interpretation': f"r = {r:.3f} ({magnitude} effect)"
        }
    
    def calculate_epsilon_squared(self, groups: List[np.ndarray], h_stat: float) -> Dict:
        """Epsilon-squared (Kruskal-Wallis 효과 크기)"""
        n_total = sum(len(g) for g in groups)
        k = len(groups)
        
        # Epsilon-squared
        epsilon_sq = h_stat / (n_total - 1)
        
        # 해석
        magnitude = 'small'
        if epsilon_sq >= 0.06:
            magnitude = 'medium'
        if epsilon_sq >= 0.14:
            magnitude = 'large'
        
        return {
            'value': float(epsilon_sq),
            'magnitude': magnitude,
            'interpretation': f"ε² = {epsilon_sq:.3f} ({magnitude} effect)"
        }
    
    def interpret_results(self, test_type: str, significant: bool, effect_size: Dict) -> str:
        """결과 해석 생성"""
        if significant:
            interpretation = f"{test_type} 결과 통계적으로 유의한 차이가 발견되었습니다 (p < 0.05). "
            interpretation += f"효과 크기는 {effect_size['magnitude']}입니다."
        else:
            interpretation = f"{test_type} 결과 통계적으로 유의한 차이가 발견되지 않았습니다 (p ≥ 0.05)."
        
        return interpretation
    
    def generate_summary(self, groups: List[np.ndarray], labels: List[str],
                        test_results: Dict, post_hoc_results: Dict) -> str:
        """분석 요약 생성"""
        n_groups = len(groups)
        total_n = sum(len(g) for g in groups)
        
        summary = f"총 {n_groups}개 그룹, {total_n}개 데이터를 분석했습니다.\n"
        summary += f"사용된 검정: {test_results['test_type']}\n"
        summary += f"검정 통계량: {test_results['statistic']:.4f}, p-value: {test_results['p_value']:.4f}\n"
        summary += f"결과: {test_results['interpretation']}\n"
        
        if post_hoc_results:
            significant_pairs = [
                f"{c['group1']} vs {c['group2']}"
                for c in post_hoc_results['comparisons']
                if c['significant']
            ]
            if significant_pairs:
                summary += f"\n사후분석({post_hoc_results['method']}) 결과 유의한 차이를 보인 그룹 쌍:\n"
                for pair in significant_pairs:
                    summary += f"  - {pair}\n"
        
        return summary


# Pyodide에서 JavaScript와 통신하기 위한 인터페이스
def analyze_data(data_json: str) -> str:
    """
    JavaScript에서 호출할 메인 함수
    Args:
        data_json: JSON 문자열 형태의 데이터
    Returns:
        JSON 문자열 형태의 분석 결과
    """
    try:
        data = json.loads(data_json)
        engine = StatisticsEngine()
        result = engine.analyze(data)
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            'success': False,
            'error': str(e)
        }, ensure_ascii=False)


# 테스트용 샘플 데이터
if __name__ == "__main__":
    # ANOVA 테스트 데이터
    sample_data = {
        'groups': [
            [23.5, 24.1, 22.9, 24.5, 23.8],
            [26.8, 27.2, 26.5, 27.0, 26.9],
            [21.3, 20.9, 21.7, 21.5, 20.8]
        ],
        'labels': ['그룹 A', '그룹 B', '그룹 C']
    }
    
    result = analyze_data(json.dumps(sample_data))
    print(result)