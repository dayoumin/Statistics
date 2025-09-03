#!/usr/bin/env python3
"""
Pyodide 오프라인 번들 생성 스크립트
완전 오프라인 환경을 위한 Pyodide 및 필수 패키지 번들링
"""

import os
import sys
import json
import base64
import hashlib
import urllib.request
import zipfile
from pathlib import Path
from typing import Dict, List

# Pyodide 버전 및 설정
PYODIDE_VERSION = "0.24.1"
PYODIDE_BASE_URL = f"https://cdn.jsdelivr.net/pyodide/v{PYODIDE_VERSION}/full/"

# 필수 패키지 목록
REQUIRED_PACKAGES = [
    "numpy",
    "scipy", 
    "pandas",
    "micropip",
    "packaging"
]

# 통계 분석에 필요한 scipy 하위 모듈만 선택
SCIPY_MODULES = [
    "scipy.stats",
    "scipy.special",
    "scipy.optimize"
]

class PyodideBundler:
    def __init__(self, output_dir: str = "assets"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.cache_dir = Path("cache")
        self.cache_dir.mkdir(exist_ok=True)
        
    def download_file(self, url: str, filename: str) -> bytes:
        """파일 다운로드 및 캐싱"""
        cache_path = self.cache_dir / filename
        
        if cache_path.exists():
            print(f"캐시에서 로드: {filename}")
            return cache_path.read_bytes()
        
        print(f"다운로드 중: {url}")
        try:
            response = urllib.request.urlopen(url)
            data = response.read()
            cache_path.write_bytes(data)
            return data
        except Exception as e:
            print(f"다운로드 실패: {e}")
            return None
    
    def create_pyodide_core(self) -> Dict:
        """Pyodide 코어 파일 다운로드 및 번들링"""
        print("\n=== Pyodide 코어 번들링 ===")
        
        core_files = {
            "pyodide.js": f"{PYODIDE_BASE_URL}pyodide.js",
            "pyodide.asm.wasm": f"{PYODIDE_BASE_URL}pyodide.asm.wasm",
            "pyodide.asm.js": f"{PYODIDE_BASE_URL}pyodide.asm.js",
            "pyodide-lock.json": f"{PYODIDE_BASE_URL}pyodide-lock.json"
        }
        
        bundle = {}
        total_size = 0
        
        for filename, url in core_files.items():
            data = self.download_file(url, filename)
            if data:
                # JavaScript 파일은 텍스트로, WASM은 Base64로
                if filename.endswith('.js') or filename.endswith('.json'):
                    bundle[filename] = data.decode('utf-8')
                else:
                    bundle[filename] = base64.b64encode(data).decode('ascii')
                
                size_mb = len(data) / (1024 * 1024)
                total_size += size_mb
                print(f"  ✓ {filename}: {size_mb:.2f} MB")
        
        print(f"코어 총 크기: {total_size:.2f} MB")
        return bundle
    
    def create_packages_bundle(self) -> Dict:
        """필수 Python 패키지 번들링"""
        print("\n=== Python 패키지 번들링 ===")
        
        # pyodide-lock.json에서 패키지 정보 가져오기
        lock_url = f"{PYODIDE_BASE_URL}pyodide-lock.json"
        lock_data = self.download_file(lock_url, "pyodide-lock.json")
        lock_info = json.loads(lock_data)
        
        packages = {}
        total_size = 0
        
        for pkg_name in REQUIRED_PACKAGES:
            if pkg_name in lock_info["packages"]:
                pkg_info = lock_info["packages"][pkg_name]
                pkg_filename = pkg_info["file_name"]
                pkg_url = f"{PYODIDE_BASE_URL}{pkg_filename}"
                
                data = self.download_file(pkg_url, pkg_filename)
                if data:
                    packages[pkg_name] = {
                        "filename": pkg_filename,
                        "data": base64.b64encode(data).decode('ascii'),
                        "depends": pkg_info.get("depends", [])
                    }
                    
                    size_mb = len(data) / (1024 * 1024)
                    total_size += size_mb
                    print(f"  ✓ {pkg_name}: {size_mb:.2f} MB")
        
        print(f"패키지 총 크기: {total_size:.2f} MB")
        return packages
    
    def optimize_scipy(self, scipy_data: bytes) -> bytes:
        """scipy 최적화 - 필요한 모듈만 추출"""
        # TODO: scipy wheel 파일을 열어서 필요한 모듈만 추출
        # 현재는 전체 scipy 사용 (추후 최적화)
        return scipy_data
    
    def create_loader_script(self) -> str:
        """Pyodide 로더 JavaScript 생성"""
        return '''
// Pyodide 오프라인 로더
class PyodideOfflineLoader {
    constructor() {
        this.pyodide = null;
        this.isReady = false;
        this.loadingProgress = 0;
    }
    
    async initialize(progressCallback) {
        try {
            // 1. Base64 디코딩 함수
            const base64ToUint8Array = (base64) => {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes;
            };
            
            // 2. WASM 파일을 Blob URL로 변환
            const wasmBlob = new Blob(
                [base64ToUint8Array(PYODIDE_BUNDLE.core['pyodide.asm.wasm'])],
                { type: 'application/wasm' }
            );
            const wasmUrl = URL.createObjectURL(wasmBlob);
            
            // 3. Pyodide 초기화 옵션
            const config = {
                indexURL: './',
                fullStdLib: false,
                // WASM URL 오버라이드
                _loadPackage: async (name) => {
                    if (PYODIDE_BUNDLE.packages[name]) {
                        const pkgData = PYODIDE_BUNDLE.packages[name];
                        const bytes = base64ToUint8Array(pkgData.data);
                        return bytes;
                    }
                    throw new Error(`Package ${name} not found in bundle`);
                }
            };
            
            // 4. Pyodide 로드
            progressCallback({ step: 'core', progress: 10, message: 'Python 환경 초기화...' });
            
            // eval을 사용하여 Pyodide JS 실행
            eval(PYODIDE_BUNDLE.core['pyodide.js']);
            
            this.pyodide = await loadPyodide(config);
            progressCallback({ step: 'core', progress: 30, message: 'Python 환경 로드 완료' });
            
            // 5. 필수 패키지 설치
            const packages = ['numpy', 'scipy', 'pandas'];
            for (let i = 0; i < packages.length; i++) {
                const pkg = packages[i];
                progressCallback({
                    step: 'packages',
                    progress: 30 + (i + 1) * 20,
                    message: `${pkg} 설치 중...`
                });
                
                await this.installPackageFromBundle(pkg);
            }
            
            // 6. 통계 함수 정의
            await this.defineStatisticalFunctions();
            progressCallback({ step: 'complete', progress: 100, message: '준비 완료!' });
            
            this.isReady = true;
            return this.pyodide;
            
        } catch (error) {
            console.error('Pyodide 초기화 실패:', error);
            throw error;
        }
    }
    
    async installPackageFromBundle(packageName) {
        const pkgData = PYODIDE_BUNDLE.packages[packageName];
        if (!pkgData) {
            throw new Error(`Package ${packageName} not in bundle`);
        }
        
        // 패키지 데이터를 Python으로 전달하여 설치
        await this.pyodide.runPythonAsync(`
            import micropip
            import base64
            import io
            
            # Base64 디코딩
            pkg_data = base64.b64decode("${pkgData.data}")
            
            # 메모리에서 직접 설치
            await micropip.install(io.BytesIO(pkg_data))
        `);
    }
    
    async defineStatisticalFunctions() {
        // 통계 분석 함수 정의
        await this.pyodide.runPythonAsync(`
            import numpy as np
            import scipy.stats as stats
            import pandas as pd
            import json
            import warnings
            warnings.filterwarnings('ignore')
            
            class StatisticalAnalyzer:
                def __init__(self):
                    self.results = {}
                
                def analyze(self, data_json):
                    data = json.loads(data_json)
                    groups = [np.array(g) for g in data['groups']]
                    
                    # 분석 수행
                    self.results['descriptive'] = self._descriptive_stats(groups)
                    self.results['assumptions'] = self._check_assumptions(groups)
                    
                    if len(groups) == 2:
                        self.results['main_test'] = self._two_group_test(groups)
                    else:
                        self.results['main_test'] = self._multi_group_test(groups)
                    
                    if self.results['main_test']['p_value'] < 0.05 and len(groups) > 2:
                        self.results['post_hoc'] = self._post_hoc_analysis(groups)
                    
                    return json.dumps(self.results)
                
                def _descriptive_stats(self, groups):
                    stats_list = []
                    for group in groups:
                        if len(group) > 0:
                            stats_list.append({
                                'n': int(len(group)),
                                'mean': float(np.mean(group)),
                                'std': float(np.std(group, ddof=1)) if len(group) > 1 else 0,
                                'median': float(np.median(group)),
                                'min': float(np.min(group)),
                                'max': float(np.max(group))
                            })
                    return stats_list
                
                def _check_assumptions(self, groups):
                    normality = []
                    for group in groups:
                        if len(group) >= 3:
                            if len(group) < 50:
                                stat, p = stats.shapiro(group)
                                test_name = 'Shapiro-Wilk'
                            else:
                                stat, p = stats.normaltest(group)
                                test_name = 'DAgostino-Pearson'
                            
                            normality.append({
                                'test': test_name,
                                'p_value': float(p),
                                'is_normal': p > 0.05
                            })
                        else:
                            normality.append({
                                'test': 'Too few samples',
                                'p_value': None,
                                'is_normal': False
                            })
                    
                    # 등분산성 검정
                    if len(groups) >= 2 and all(len(g) >= 2 for g in groups):
                        stat_lev, p_lev = stats.levene(*groups)
                        homogeneity = {
                            'levene': {'p_value': float(p_lev), 'equal_var': p_lev > 0.05}
                        }
                    else:
                        homogeneity = None
                    
                    return {
                        'normality': normality,
                        'homogeneity': homogeneity,
                        'all_normal': all(n.get('is_normal', False) for n in normality),
                        'equal_variance': homogeneity['levene']['equal_var'] if homogeneity else None
                    }
                
                def _two_group_test(self, groups):
                    assumptions = self.results['assumptions']
                    
                    if assumptions['all_normal'] and assumptions['equal_variance']:
                        stat, p = stats.ttest_ind(groups[0], groups[1])
                        test_type = 'Independent t-test'
                    elif assumptions['all_normal'] and not assumptions['equal_variance']:
                        stat, p = stats.ttest_ind(groups[0], groups[1], equal_var=False)
                        test_type = "Welch's t-test"
                    else:
                        stat, p = stats.mannwhitneyu(groups[0], groups[1])
                        test_type = 'Mann-Whitney U test'
                    
                    return {
                        'test_type': test_type,
                        'statistic': float(stat),
                        'p_value': float(p),
                        'significant': p < 0.05
                    }
                
                def _multi_group_test(self, groups):
                    assumptions = self.results['assumptions']
                    
                    if assumptions['all_normal'] and assumptions['equal_variance']:
                        stat, p = stats.f_oneway(*groups)
                        test_type = 'One-way ANOVA'
                    else:
                        stat, p = stats.kruskal(*groups)
                        test_type = 'Kruskal-Wallis test'
                    
                    return {
                        'test_type': test_type,
                        'statistic': float(stat),
                        'p_value': float(p),
                        'significant': p < 0.05
                    }
                
                def _post_hoc_analysis(self, groups):
                    # Tukey HSD 구현 (scipy 0.24.1에는 없으므로 수동 구현)
                    from itertools import combinations
                    
                    results = []
                    n_groups = len(groups)
                    
                    for i, j in combinations(range(n_groups), 2):
                        # Pairwise t-test with Bonferroni correction
                        stat, p = stats.ttest_ind(groups[i], groups[j])
                        p_adjusted = min(1.0, p * (n_groups * (n_groups - 1) / 2))
                        
                        results.append({
                            'group1': i,
                            'group2': j,
                            'p_value': float(p),
                            'p_adjusted': float(p_adjusted),
                            'significant': p_adjusted < 0.05
                        })
                    
                    return results
            
            # 전역 인스턴스 생성
            analyzer = StatisticalAnalyzer()
            print("통계 분석 엔진 준비 완료")
        `);
    }
}

// 전역 로더 인스턴스
window.pyodideLoader = new PyodideOfflineLoader();
'''
    
    def generate_html_template(self, bundle: Dict) -> str:
        """최종 HTML 파일 생성"""
        print("\n=== HTML 파일 생성 ===")
        
        # 번들 데이터를 JSON으로 변환
        bundle_json = json.dumps(bundle, separators=(',', ':'))
        
        # 파일 크기 계산
        total_size = len(bundle_json.encode('utf-8')) / (1024 * 1024)
        print(f"번들 JSON 크기: {total_size:.2f} MB")
        
        template = f'''<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>통계 분석 도구 - 국립수산과학원</title>
    
    <!-- 보안 정책 -->
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'self' data: blob:;
        script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob:;
        connect-src 'none';
    ">
    
    <!-- Pyodide 번들 데이터 -->
    <script>
        const PYODIDE_BUNDLE = {bundle_json};
    </script>
    
    <!-- Pyodide 로더 -->
    <script>
        {self.create_loader_script()}
    </script>
    
    <!-- 스타일은 다음 단계에서 추가 -->
    <style>
        /* 임시 스타일 */
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        
        .loading-container {{
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
            color: white;
        }}
        
        .loading-spinner {{
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }}
        
        @keyframes spin {{
            to {{ transform: rotate(360deg); }}
        }}
        
        .loading-text {{
            margin-top: 20px;
            font-size: 18px;
        }}
        
        .progress-bar {{
            width: 300px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            margin-top: 20px;
            overflow: hidden;
        }}
        
        .progress-fill {{
            height: 100%;
            background: white;
            transition: width 0.3s ease;
        }}
    </style>
</head>
<body>
    <div id="app">
        <!-- 로딩 화면 -->
        <div class="loading-container" id="loadingScreen">
            <div class="loading-spinner"></div>
            <div class="loading-text" id="loadingText">Python 환경 준비 중...</div>
            <div class="progress-bar">
                <div class="progress-fill" id="progressBar" style="width: 0%"></div>
            </div>
        </div>
        
        <!-- 메인 앱 (로딩 후 표시) -->
        <div id="mainApp" style="display: none;">
            <!-- 다음 단계에서 구현 -->
        </div>
    </div>
    
    <script>
        // 앱 초기화
        window.addEventListener('DOMContentLoaded', async () => {{
            try {{
                // Pyodide 로드
                await window.pyodideLoader.initialize((progress) => {{
                    document.getElementById('loadingText').textContent = progress.message;
                    document.getElementById('progressBar').style.width = progress.progress + '%';
                }});
                
                // 로딩 완료
                document.getElementById('loadingScreen').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                
                console.log('앱 준비 완료!');
                
            }} catch (error) {{
                console.error('초기화 실패:', error);
                document.getElementById('loadingText').textContent = 
                    '초기화 실패. 페이지를 새로고침해주세요.';
            }}
        }});
    </script>
</body>
</html>'''
        
        return template
    
    def build(self):
        """전체 빌드 프로세스"""
        print("=== Pyodide 오프라인 번들 생성 시작 ===\n")
        
        # 1. Pyodide 코어 번들링
        core_bundle = self.create_pyodide_core()
        
        # 2. 패키지 번들링
        packages_bundle = self.create_packages_bundle()
        
        # 3. 전체 번들 생성
        full_bundle = {
            "core": core_bundle,
            "packages": packages_bundle
        }
        
        # 4. HTML 파일 생성
        html_content = self.generate_html_template(full_bundle)
        
        # 5. 파일 저장
        output_path = self.output_dir / "statistics_tool_bundle.html"
        output_path.write_text(html_content, encoding='utf-8')
        
        # 파일 크기 확인
        file_size_mb = output_path.stat().st_size / (1024 * 1024)
        print(f"\n=== 빌드 완료 ===")
        print(f"출력 파일: {output_path}")
        print(f"파일 크기: {file_size_mb:.2f} MB")
        
        if file_size_mb > 50:
            print("⚠️ 경고: 파일 크기가 50MB를 초과합니다. 최적화가 필요할 수 있습니다.")
        
        return output_path

if __name__ == "__main__":
    bundler = PyodideBundler(output_dir="assets")
    output_file = bundler.build()
    print(f"\n✅ 성공적으로 생성됨: {output_file}")