#!/usr/bin/env python3
"""
통계 분석 플랫폼 빌드 스크립트
모듈화된 컴포넌트들을 하나의 HTML 파일로 합칩니다.
"""

import os
import re
import json
import base64
from pathlib import Path
from datetime import datetime

class StatisticsPlatformBuilder:
    def __init__(self, src_dir="src", output_file="dist/statistical-analysis-platform.html"):
        self.src_dir = Path(src_dir)
        self.output_file = Path(output_file)
        self.components = {}
        self.styles = []
        self.scripts = []
        
    def read_file(self, filepath):
        """파일 읽기"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    
    def collect_components(self):
        """HTML 컴포넌트 수집"""
        components_dir = self.src_dir / "components"
        if components_dir.exists():
            for html_file in components_dir.glob("*.html"):
                component_name = html_file.stem
                self.components[component_name] = self.read_file(html_file)
                print(f"  + 컴포넌트 로드: {component_name}")
    
    def collect_styles(self):
        """CSS 파일 수집"""
        css_dir = self.src_dir / "css"
        if css_dir.exists():
            for css_file in css_dir.glob("*.css"):
                content = self.read_file(css_file)
                self.styles.append(f"/* {css_file.name} */\n{content}")
                print(f"  + 스타일 로드: {css_file.name}")
    
    def collect_scripts(self):
        """JavaScript 파일 수집"""
        js_dir = self.src_dir / "js"
        if js_dir.exists():
            for js_file in js_dir.glob("*.js"):
                content = self.read_file(js_file)
                # ES6 모듈 구문을 일반 스크립트로 변환
                content = self.transform_es6_modules(content)
                self.scripts.append(f"// {js_file.name}\n{content}")
                print(f"  + 스크립트 로드: {js_file.name}")
    
    def transform_es6_modules(self, content):
        """ES6 모듈 구문을 일반 스크립트로 변환"""
        # export 제거
        content = re.sub(r'export\s+(class|function|const|let|var)\s+', r'\1 ', content)
        content = re.sub(r'export\s+\{[^}]+\}', '', content)
        # import 제거 (CDN 라이브러리는 전역으로 사용)
        content = re.sub(r'import\s+.*?from\s+[\'"][^\'"]+[\'"];?\n?', '', content)
        return content
    
    def minify_css(self, css):
        """CSS 간단 압축"""
        # 주석 제거
        css = re.sub(r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', '', css)
        # 불필요한 공백 제거
        css = re.sub(r'\s+', ' ', css)
        css = re.sub(r'\s*([{}:;,])\s*', r'\1', css)
        return css.strip()
    
    def minify_js(self, js):
        """JavaScript 간단 압축"""
        # 한 줄 주석 제거 (문자열 내부 제외)
        js = re.sub(r'(?<!:)//[^\n]*', '', js)
        # 여러 줄 주석 제거
        js = re.sub(r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', '', js)
        # 불필요한 줄바꿈과 공백 제거
        js = re.sub(r'\s+', ' ', js)
        js = re.sub(r'\s*([{}();,:])\s*', r'\1', js)
        return js.strip()
    
    def build_html(self):
        """최종 HTML 파일 생성"""
        # 템플릿 읽기
        template_path = self.src_dir / "template.html"
        if template_path.exists():
            template = self.read_file(template_path)
        else:
            template = self.create_default_template()
        
        # 스타일 합치기
        combined_styles = '\n'.join(self.styles)
        if len(combined_styles) > 50000:  # 50KB 이상이면 압축
            combined_styles = self.minify_css(combined_styles)
        
        # 스크립트 합치기
        combined_scripts = '\n'.join(self.scripts)
        if len(combined_scripts) > 100000:  # 100KB 이상이면 압축
            combined_scripts = self.minify_js(combined_scripts)
        
        # 컴포넌트 합치기
        components_html = '\n'.join([
            f"<!-- {name} -->\n{content}"
            for name, content in self.components.items()
        ])
        
        # 템플릿에 삽입
        html = template
        html = html.replace('<!-- {{STYLES}} -->', f'<style>\n{combined_styles}\n</style>')
        html = html.replace('<!-- {{COMPONENTS}} -->', components_html)
        html = html.replace('<!-- {{SCRIPTS}} -->', f'<script>\n{combined_scripts}\n</script>')
        html = html.replace('{{BUILD_DATE}}', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        html = html.replace('{{VERSION}}', '1.0.0')
        
        return html
    
    def create_default_template(self):
        """기본 템플릿 생성"""
        return '''<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>통계 분석 플랫폼 | 국립수산과학원</title>
    <meta name="description" content="SciPy 기반 통계 분석 플랫폼">
    <meta name="build-date" content="{{BUILD_DATE}}">
    <meta name="version" content="{{VERSION}}">
    
    <!-- External Libraries -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script defer src="https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js"></script>
    <script src="https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"></script>
    
    <!-- {{STYLES}} -->
</head>
<body>
    <div class="min-h-screen p-4 md:p-8">
        <!-- {{COMPONENTS}} -->
    </div>
    
    <!-- {{SCRIPTS}} -->
</body>
</html>'''
    
    def save_output(self, content):
        """출력 파일 저장"""
        # 디렉토리 생성
        self.output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # 파일 저장
        with open(self.output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # 파일 크기 확인
        file_size = os.path.getsize(self.output_file)
        size_mb = file_size / (1024 * 1024)
        
        print(f"\n[SUCCESS] 빌드 완료!")
        print(f"  - 출력 파일: {self.output_file}")
        print(f"  - 파일 크기: {size_mb:.2f} MB")
        
        if size_mb > 10:
            print(f"[WARNING] 파일 크기가 10MB를 초과합니다. 압축을 고려하세요.")
    
    def build(self):
        """빌드 실행"""
        print("[BUILD] 통계 분석 플랫폼 빌드 시작...\n")
        
        # 1. 컴포넌트 수집
        print("[1/5] 컴포넌트 수집 중...")
        self.collect_components()
        
        # 2. 스타일 수집
        print("\n[2/5] 스타일 수집 중...")
        self.collect_styles()
        
        # 3. 스크립트 수집
        print("\n[3/5] 스크립트 수집 중...")
        self.collect_scripts()
        
        # 4. HTML 생성
        print("\n[4/5] HTML 생성 중...")
        html_content = self.build_html()
        
        # 5. 파일 저장
        print("\n[5/5] 파일 저장 중...")
        self.save_output(html_content)
        
        return True


def main():
    """메인 함수"""
    builder = StatisticsPlatformBuilder()
    
    # 개발 모드와 프로덕션 모드 구분
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--dev':
        # 개발 모드: 압축하지 않음
        builder.minify_css = lambda x: x
        builder.minify_js = lambda x: x
        print("[DEV] 개발 모드로 빌드합니다.\n")
    else:
        print("[PROD] 프로덕션 모드로 빌드합니다.\n")
    
    builder.build()


if __name__ == "__main__":
    main()