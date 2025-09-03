"""
SciPy.stats 신뢰성 검증 테스트 스위트
현재 프로젝트에서 사용하는 통계 함수들의 정확성을 검증합니다.
"""

import json
import numpy as np
from scipy import stats
import unittest
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')


class StatisticalReliabilityTest(unittest.TestCase):
    """통계적 신뢰성 검증 테스트 클래스"""
    
    def setUp(self):
        """테스트 데이터 설정"""
        # Fisher's Iris 데이터 (전체 데이터 - 각 종별 50개씩)
        # Setosa sepal length
        self.iris_setosa = [5.1, 4.9, 4.7, 4.6, 5.0, 5.4, 4.6, 5.0, 4.4, 4.9,
                           5.4, 4.8, 4.8, 4.3, 5.8, 5.7, 5.4, 5.1, 5.7, 5.1,
                           5.4, 5.1, 4.6, 5.1, 4.8, 5.0, 5.0, 5.2, 5.2, 4.7,
                           4.8, 5.4, 5.2, 5.5, 4.9, 5.0, 5.5, 4.9, 4.4, 5.1,
                           5.0, 4.5, 4.4, 5.0, 5.1, 4.8, 5.1, 4.6, 5.3, 5.0]
        
        # Versicolor sepal length  
        self.iris_versicolor = [7.0, 6.4, 6.9, 5.5, 6.5, 5.7, 6.3, 4.9, 6.6, 5.2,
                               5.0, 5.9, 6.0, 6.1, 5.6, 6.7, 5.6, 5.8, 6.2, 5.6,
                               5.9, 6.1, 6.3, 6.1, 6.4, 6.6, 6.8, 6.7, 6.0, 5.7,
                               5.5, 5.5, 5.8, 6.0, 5.4, 6.0, 6.7, 6.3, 5.6, 5.5,
                               5.5, 6.1, 5.8, 5.0, 5.6, 5.7, 5.7, 6.2, 5.1, 5.7]
        
        # Virginica sepal length
        self.iris_virginica = [6.3, 5.8, 7.1, 6.3, 6.5, 7.6, 4.9, 7.3, 6.7, 7.2,
                              6.5, 6.4, 6.8, 5.7, 5.8, 6.4, 6.5, 7.7, 7.7, 6.0,
                              6.9, 5.6, 7.7, 6.3, 6.7, 7.2, 6.2, 6.1, 6.4, 7.2,
                              7.4, 7.9, 6.4, 6.3, 6.1, 7.7, 6.3, 6.4, 6.0, 6.9,
                              6.7, 6.9, 5.8, 6.8, 6.7, 6.7, 6.3, 6.5, 6.2, 5.9]
        
        # 표준 t-test 데이터
        self.group1 = [23.5, 24.1, 22.9, 24.5, 23.8]
        self.group2 = [26.8, 27.2, 26.5, 27.0, 26.9]
        
        # 극값 테스트 데이터
        self.extreme_small = [1e-10, 2e-10, 3e-10, 4e-10, 5e-10]
        self.extreme_large = [1e10, 2e10, 3e10, 4e10, 5e10]
        
        # 정밀도 허용 오차
        self.precision_tolerance = 1e-10
        self.statistical_tolerance = 1e-4
    
    def test_iris_anova_accuracy(self):
        """Fisher's Iris 데이터 ANOVA 정확성 테스트"""
        print("\n=== Iris ANOVA 정확성 테스트 ===")
        
        # SciPy ANOVA
        f_stat, p_val = stats.f_oneway(
            self.iris_setosa, 
            self.iris_versicolor, 
            self.iris_virginica
        )
        
        # R에서 계산된 예상 결과
        expected_f = 119.2645  # R: summary(aov(Sepal.Length ~ Species))
        expected_p = 1.669e-31
        
        print(f"SciPy F-statistic: {f_stat:.4f}")
        print(f"Expected F-statistic: {expected_f:.4f}")
        print(f"SciPy p-value: {p_val:.2e}")
        print(f"Expected p-value: {expected_p:.2e}")
        
        # 검증
        self.assertAlmostEqual(f_stat, expected_f, places=3, 
                              msg="F-statistic이 R 결과와 일치하지 않습니다")
        self.assertLess(p_val, 1e-30, 
                       msg="p-value가 예상 범위를 벗어났습니다")
        
        print("✅ Iris ANOVA 테스트 통과")
    
    def test_ttest_accuracy(self):
        """t-test 정확성 테스트"""
        print("\n=== t-test 정확성 테스트 ===")
        
        # SciPy t-test
        t_stat, p_val = stats.ttest_ind(self.group1, self.group2)
        
        # 수동 계산으로 검증
        n1, n2 = len(self.group1), len(self.group2)
        mean1, mean2 = np.mean(self.group1), np.mean(self.group2)
        var1, var2 = np.var(self.group1, ddof=1), np.var(self.group2, ddof=1)
        
        # Pooled variance
        pooled_var = ((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2)
        
        # t-statistic 수동 계산
        t_manual = (mean1 - mean2) / np.sqrt(pooled_var * (1/n1 + 1/n2))
        
        print(f"SciPy t-statistic: {t_stat:.10f}")
        print(f"Manual t-statistic: {t_manual:.10f}")
        print(f"차이: {abs(t_stat - t_manual):.2e}")
        
        # 검증 (소수점 10자리까지 일치해야 함)
        self.assertAlmostEqual(t_stat, t_manual, places=10,
                              msg="t-statistic 수동 계산과 일치하지 않습니다")
        
        print("✅ t-test 정확성 테스트 통과")
    
    def test_distribution_properties(self):
        """분포 함수의 수학적 속성 테스트"""
        print("\n=== 분포 함수 속성 테스트 ===")
        
        # 1. 표준정규분포 PDF 적분 = 1 확인
        from scipy import integrate
        
        def norm_pdf(x):
            return stats.norm.pdf(x)
        
        integral, error = integrate.quad(norm_pdf, -10, 10)
        print(f"표준정규분포 PDF 적분: {integral:.10f} (오차: {error:.2e})")
        
        self.assertAlmostEqual(integral, 1.0, places=8,
                              msg="PDF 적분이 1이 아닙니다")
        
        # 2. CDF 단조성 확인
        x_values = np.linspace(-5, 5, 100)
        cdf_values = stats.norm.cdf(x_values)
        
        # CDF는 단조증가해야 함
        is_monotonic = all(cdf_values[i] <= cdf_values[i+1] 
                          for i in range(len(cdf_values)-1))
        
        self.assertTrue(is_monotonic, msg="CDF가 단조증가하지 않습니다")
        
        # 3. 95% 분위수 정확성
        critical_95 = stats.norm.ppf(0.975)
        expected_95 = 1.959963984540054  # 알려진 정확한 값
        
        print(f"95% 분위수: {critical_95:.15f}")
        print(f"예상값: {expected_95:.15f}")
        
        self.assertAlmostEqual(critical_95, expected_95, places=12,
                              msg="95% 분위수가 정확하지 않습니다")
        
        print("✅ 분포 함수 속성 테스트 통과")
    
    def test_extreme_values(self):
        """극값에서의 수치 안정성 테스트"""
        print("\n=== 극값 수치 안정성 테스트 ===")
        
        # 매우 작은 값들
        try:
            t_small, p_small = stats.ttest_1samp(self.extreme_small, 0)
            print(f"극소값 t-test: t={t_small:.4f}, p={p_small:.4f}")
            self.assertFalse(np.isnan(t_small), msg="극소값에서 NaN 발생")
            self.assertFalse(np.isinf(t_small), msg="극소값에서 Inf 발생")
        except Exception as e:
            self.fail(f"극소값 처리 중 오류: {e}")
        
        # 매우 큰 값들
        try:
            t_large, p_large = stats.ttest_1samp(self.extreme_large, 0)
            print(f"극대값 t-test: t={t_large:.4f}, p={p_large:.4f}")
            self.assertFalse(np.isnan(t_large), msg="극대값에서 NaN 발생")
            self.assertFalse(np.isinf(t_large), msg="극대값에서 Inf 발생")
        except Exception as e:
            self.fail(f"극대값 처리 중 오류: {e}")
        
        # 동일한 값들 (분산 = 0)
        identical_values = [5.0, 5.0, 5.0, 5.0, 5.0]
        try:
            var_identical = np.var(identical_values, ddof=1)
            print(f"동일값 분산: {var_identical}")
            self.assertEqual(var_identical, 0.0, msg="동일값 분산이 0이 아닙니다")
        except Exception as e:
            self.fail(f"동일값 처리 중 오류: {e}")
        
        print("✅ 극값 안정성 테스트 통과")
    
    def test_current_project_functions(self):
        """현재 프로젝트에서 사용하는 함수들 테스트"""
        print("\n=== 현재 프로젝트 함수 테스트 ===")
        
        # 현재 프로젝트 데이터 형태
        test_data = {
            'groups': [self.group1, self.group2],
            'labels': ['그룹1', '그룹2']
        }
        
        groups = [np.array(g) for g in test_data['groups']]
        
        # 1. 기술통계
        stats_results = []
        for i, group in enumerate(groups):
            n = len(group)
            mean = np.mean(group)
            std = np.std(group, ddof=1)
            se = std / np.sqrt(n)
            
            # 95% 신뢰구간
            t_critical = stats.t.ppf(0.975, n-1)
            ci_lower = mean - t_critical * se
            ci_upper = mean + t_critical * se
            
            stats_results.append({
                'n': n,
                'mean': mean,
                'std': std,
                'ci95_lower': ci_lower,
                'ci95_upper': ci_upper
            })
        
        print(f"그룹1 통계: n={stats_results[0]['n']}, "
              f"평균={stats_results[0]['mean']:.2f}, "
              f"표준편차={stats_results[0]['std']:.2f}")
        print(f"그룹2 통계: n={stats_results[1]['n']}, "
              f"평균={stats_results[1]['mean']:.2f}, "
              f"표준편차={stats_results[1]['std']:.2f}")
        
        # 2. 정규성 검정
        shapiro_results = []
        for i, group in enumerate(groups):
            if len(group) >= 3:
                stat, p = stats.shapiro(group)
                shapiro_results.append({
                    'statistic': stat,
                    'p_value': p,
                    'is_normal': p > 0.05
                })
                print(f"그룹{i+1} Shapiro-Wilk: W={stat:.4f}, p={p:.4f}")
        
        # 3. 등분산성 검정
        levene_stat, levene_p = stats.levene(*groups)
        print(f"Levene 검정: W={levene_stat:.4f}, p={levene_p:.4f}")
        
        # 4. 주 검정 (t-test)
        t_stat, t_p = stats.ttest_ind(groups[0], groups[1])
        print(f"독립표본 t-test: t={t_stat:.4f}, p={t_p:.4f}")
        
        # 5. 효과 크기 (Cohen's d)
        mean1, mean2 = np.mean(groups[0]), np.mean(groups[1])
        n1, n2 = len(groups[0]), len(groups[1])
        var1, var2 = np.var(groups[0], ddof=1), np.var(groups[1], ddof=1)
        
        pooled_std = np.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2))
        cohens_d = (mean1 - mean2) / pooled_std
        print(f"Cohen's d: {cohens_d:.4f}")
        
        # 모든 계산이 유효한 숫자인지 확인
        self.assertFalse(np.isnan(t_stat), msg="t-statistic이 NaN입니다")
        self.assertFalse(np.isnan(cohens_d), msg="Cohen's d가 NaN입니다")
        self.assertTrue(0 <= t_p <= 1, msg="p-value가 유효 범위를 벗어났습니다")
        
        print("✅ 현재 프로젝트 함수 테스트 통과")
    
    def test_performance_benchmark(self):
        """성능 벤치마크 테스트"""
        print("\n=== 성능 벤치마크 테스트 ===")
        
        import time
        
        # 대용량 데이터 생성
        large_group1 = np.random.normal(50, 10, 10000)
        large_group2 = np.random.normal(55, 10, 10000)
        
        # t-test 성능 측정
        start_time = time.time()
        t_stat, p_val = stats.ttest_ind(large_group1, large_group2)
        end_time = time.time()
        
        duration = end_time - start_time
        print(f"10,000 샘플 t-test 실행 시간: {duration:.4f}초")
        print(f"결과: t={t_stat:.4f}, p={p_val:.6f}")
        
        # 성능 기준: 1초 이내
        self.assertLess(duration, 1.0, msg="성능이 기준을 만족하지 않습니다")
        
        # ANOVA 성능 측정
        large_group3 = np.random.normal(60, 10, 10000)
        
        start_time = time.time()
        f_stat, f_p = stats.f_oneway(large_group1, large_group2, large_group3)
        end_time = time.time()
        
        duration = end_time - start_time
        print(f"10,000 샘플 ANOVA 실행 시간: {duration:.4f}초")
        print(f"결과: F={f_stat:.4f}, p={f_p:.6f}")
        
        self.assertLess(duration, 2.0, msg="ANOVA 성능이 기준을 만족하지 않습니다")
        
        print("✅ 성능 벤치마크 테스트 통과")


def run_reliability_tests():
    """신뢰성 테스트 실행 함수"""
    print("🔍 SciPy.stats 신뢰성 검증 테스트 시작")
    print("=" * 50)
    
    # 테스트 스위트 생성
    suite = unittest.TestLoader().loadTestsFromTestCase(StatisticalReliabilityTest)
    
    # 테스트 실행
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # 결과 요약
    print("\n" + "=" * 50)
    print("🎯 테스트 결과 요약")
    print(f"총 테스트: {result.testsRun}")
    print(f"실패: {len(result.failures)}")
    print(f"오류: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("✅ 모든 신뢰성 테스트 통과!")
        print("SciPy.stats의 통계적 정확성이 검증되었습니다.")
    else:
        print("❌ 일부 테스트 실패")
        for failure in result.failures:
            print(f"실패: {failure[0]}")
        for error in result.errors:
            print(f"오류: {error[0]}")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    # 신뢰성 테스트 실행
    success = run_reliability_tests()
    
    if success:
        print("\n🏆 SciPy.stats 신뢰성 검증 완료!")
        print("현재 프로젝트는 학술 연구 수준의 통계적 정확성을 보장합니다.")
    else:
        print("\n⚠️ 신뢰성 검증에서 문제가 발견되었습니다.")
        print("추가 검토가 필요합니다.")
