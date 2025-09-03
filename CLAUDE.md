# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

국립수산과학원을 위한 **통계 분석 웹 애플리케이션**입니다. 모듈화된 컴포넌트 구조로 개발하여 빌드 시 **단일 HTML 파일**로 배포됩니다. Pyodide를 통해 Python scipy.stats를 사용하여 통계 계산을 수행합니다.

**대상 사용자**: 
- 수산과학 연구자 (어획량, 자원평가, 성장분석)
- 양식업 관리자 (생산성, 생존율 분석)
- 수질 모니터링 담당자

**핵심 기능**:
- 일반 통계: t-test, ANOVA, 회귀분석, 상관분석
- 수산 특화: CPUE 분석, von Bertalanffy 성장모델, 자원평가
- 시계열 분석: 어획량 예측, 계절성 분석

## 개발 환경

### 운영체제 및 터미널
- **OS**: Windows (D:\Projects\Statics)
- **터미널**: Git Bash (Unix 명령어 사용)
- **경로 형식**: `/d/Projects/Statics` (Git Bash에서)
- **Python**: Windows Python 사용 (python.exe)

### 로컬 테스트 서버

#### ⚠️ 중요: 서버 실행 방법
**PowerShell에서 (권장):**
```powershell
# PowerShell에서 실행
cd D:\Projects\Statics
python -m http.server 8000
```

**CMD에서:**
```cmd
cd D:\Projects\Statics
python -m http.server 8000
```

**Git Bash에서 (권장하지 않음):**
```bash
cd /d/Projects/Statics
python -m http.server 8000
# Git Bash는 종종 문제 발생 - PowerShell 사용 권장
```

#### ⚠️ 절대 하지 말아야 할 것들
1. **Git Bash에서 백그라운드 실행 시도 금지** (`&`, `nohup` 등)
2. **Bash 도구로 서버 실행 금지** - Windows Python 직접 실행 필요
3. **file:// 프로토콜로 HTML 열기 금지** - CORS 오류 발생

#### 서버 실행 확인
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```
위 메시지가 나타나야 정상

#### 테스트 URL
- http://localhost:8000/simple-stats.html (가장 안정적)
- http://localhost:8000/test-pyodide.html (기본 테스트)
- http://localhost:8000/index.html (인터랙티브 플로우)

### 문제 해결

#### Python 프로세스 충돌 시
```powershell
# PowerShell에서
taskkill /F /IM python.exe
```

#### 서버가 응답하지 않을 때
1. 모든 Python 프로세스 종료
2. PowerShell 새 창 열기
3. 서버 재시작

### Pyodide 로딩 시간
- 첫 로딩: 30-40초 (CDN에서 다운로드)
- numpy 설치: 5-10초
- scipy 설치: 10-15초
- 전체: 약 1분

### 주의사항
- **CORS 정책**: file:// 프로토콜로 직접 열면 Pyodide 로드 실패
- **반드시 HTTP 서버 필요**: Python 서버 또는 VS Code Live Server 사용
- **브라우저 요구사항**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- **메모리 요구사항**: 최소 4GB RAM (Pyodide + scipy)

## 핵심 아키텍처 결정사항

### 단일 HTML 파일 방식
- 모든 것을 하나의 HTML 파일에 임베드 (목표: 40-50MB)
- Pyodide 런타임을 Base64로 인코딩하여 포함
- 한글 폰트(Pretendard)를 서브셋으로 만들어 Base64로 포함
- 완전한 오프라인 작동 - CDN 의존성 없음

### 기술 스택
- **통계 엔진**: Pyodide (WebAssembly의 Python 3.11) + scipy.stats
- **시각화**: Chart.js (CDN 아닌 임베드)
- **스타일링**: Tailwind 스타일 유틸리티 클래스 (purge 후 임베드)
- **데이터 처리**: JavaScript로 파싱, Python으로 통계 계산
- **UI 디자인**: 그라디언트 배경의 글라스모피즘

### 중요 제약사항
- **파일 크기 제한**: 50MB 이하 유지
- **브라우저 메모리**: 최대 10,000개 데이터 포인트 처리
- **오프라인 우선**: 초기 로드 후 네트워크 요청 없음
- **한글 지원**: 완전한 한글 UI 및 리포트

## 빌드 명령어

### 모듈 개발 및 빌드
```bash
# 개발 모드 빌드 (압축 없음, 디버깅 용이)
python build.py --dev

# 프로덕션 빌드 (압축 적용, 파일 크기 최적화)
python build.py

# 특정 모듈만 포함하여 빌드
python build.py --modules core,statistics,fisheries

# 테스트 서버 실행
python -m http.server 8000
# http://localhost:8000/dist/statistical-analysis-platform.html
```

### 오프라인 번들 생성 (향후)
```bash
# Pyodide 오프라인 번들 생성
python build/create_pyodide_bundle.py

# 한글 폰트 서브셋 생성
python build/create_font_subset.py

# 완전 오프라인 버전 빌드
python build.py --offline
```

## 개발 워크플로우

### 현재 구현 상태
1. ✅ 문서화 (PRD, 기술 명세, 디자인 시스템)
2. ✅ Pyodide와 폰트용 빌드 스크립트
3. 🔄 기본 HTML/UI 구조 (70% 완료)
4. ⏳ Pyodide 통합
5. ⏳ 데이터 파싱 모듈
6. ⏳ 통계 엔진
7. ⏳ 사후분석
8. ⏳ Chart.js 시각화
9. ⏳ Excel/PDF 내보내기
10. ⏳ 최종 최적화

### 모듈화 구조 (NEW!)
```
D:\Projects\Statics\
├── src/                        # 모듈화된 소스 코드
│   ├── components/            # HTML 컴포넌트
│   │   ├── header.html
│   │   ├── step1-data-input.html
│   │   ├── step2-data-validation.html
│   │   └── ...
│   ├── js/                   # JavaScript 모듈
│   │   ├── core/             # 핵심 기능
│   │   │   ├── data-handler.js
│   │   │   └── statistics-engine.js
│   │   ├── statistics/       # 통계 모듈
│   │   │   ├── basic-tests.js
│   │   │   ├── correlation-regression.js
│   │   │   └── time-series.js
│   │   └── fisheries/        # 수산과학 특화
│   │       ├── cpue-analysis.js
│   │       ├── growth-analysis.js
│   │       └── stock-assessment.js
│   ├── css/                  # 스타일시트
│   │   └── styles.css
│   └── template.html         # 메인 템플릿
├── dist/                     # 빌드 출력
│   └── statistical-analysis-platform.html
├── build.py                  # 모듈 빌드 스크립트
└── build/                    # 기타 빌드 도구
├── assets/                     # 생성된 자산 (폰트, 번들)
├── cache/                      # 빌드 스크립트용 다운로드 캐시
└── *.md                        # 문서 파일들
```

## 통계 분석 플로우

앱이 자동으로 적절한 통계 검정을 선택합니다:

```
데이터 입력 → 그룹 감지 → 가정 검정 → 검정 방법 선택 → 사후분석 (필요시)

2그룹:
  - 정규분포 + 등분산 → Independent t-test
  - 정규분포 + 이분산 → Welch's t-test  
  - 비정규분포 → Mann-Whitney U

3그룹 이상:
  - 정규분포 + 등분산 → One-way ANOVA → Tukey HSD
  - 정규분포 + 이분산 → Welch's ANOVA → Games-Howell
  - 비정규분포 → Kruskal-Wallis → Dunn's test
```

## Python 통계 함수

Pyodide 내 통계 엔진이 구현하는 기능:
- 95% 신뢰구간을 포함한 기술통계
- 정규성 검정 (n<50은 Shapiro-Wilk, n≥50은 Kolmogorov-Smirnov)
- 등분산성 검정 (Levene's, Bartlett's)
- 효과 크기 (Cohen's d, eta-squared)
- 사후검정 보정 (Bonferroni 조정)

참고: scipy 0.24.1에는 tukey_hsd가 없어서 수동 구현 필요

## 에러 처리 전략

사용자 친화적인 한글 메시지와 복구 옵션으로 에러 처리:
- **PYODIDE_LOAD_FAILED**: 임베드 버전으로 폴백하여 재시도
- **DATA_INVALID**: 구체적인 검증 오류 표시
- **MEMORY_EXCEEDED**: 데이터 축소 제안
- **CALCULATION_FAILED**: 재시작 옵션 제공

## 성능 고려사항

- 초기 로딩: ~30초 (오프라인 도구로는 허용 가능)
- UI 블로킹 방지를 위해 무거운 계산은 Web Worker 사용
- Pyodide 런타임용 IndexedDB 캐싱 (향후 최적화)
- 최대 데이터: 100,000행 × 50열

## 테스트 요구사항

주요 테스트 시나리오 (전체 목록은 TEST_CASES.md 참조):
- TC-006: ANOVA 정확도 (R/SPSS와 비교)
- TC-007: 사후분석 자동화
- FT-001~FT-003: 수산과학 특화 데이터 (어획량, 수질, 성장률)
- PT-001: 8GB RAM에서 로딩 시간 < 30초
- BT-001~BT-004: 브라우저 호환성 (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)

## 중요 참고사항

1. **변경 후 항상 린트/타입체크 실행**: 현재 린터 미설정, 추가 시 커밋 전 실행 필수

2. **기능 구현 후 테스트 확인**: 새로운 기능을 구현한 후에는 반드시 테스트 코드를 작성하고 실행하여 정상 작동을 확인해야 함
   - 단위 테스트: 개별 함수/모듈 동작 검증
   - 통합 테스트: 전체 플로우 검증 (데이터 입력 → 분석 → 결과 출력)
   - 통계 정확도 테스트: scipy.stats 출력과 비교하여 0.0001 오차 이내 확인

3. **메모리 관리**: Python 가비지 컬렉션 수동 트리거 필요:
   ```javascript
   pyodide.runPython('import gc; gc.collect()')
   ```

4. **폰트 렌더링**: Pretendard 폰트 서브셋은 일반적인 한글만 포함. 희귀 문자는 시스템 폰트로 폴백

5. **통계 정확도**: 모든 계산은 scipy.stats 출력과 0.0001 오차 이내로 일치해야 함

6. **내보내기 인코딩**: Excel 내보내기는 한글을 올바르게 처리해야 함 (UTF-8 BOM)

## 다음 개발 단계

IMPLEMENTATION_PLAN.md의 우선순위 (인터랙티브 플로우 반영):
1. 인터랙티브 플로우 기반 구조 구축 (상태 관리, UI 컴포넌트)
2. 자동 분석 엔진 (정규성/등분산성 자동 검정)
3. 방법 추천 엔진 (조건별 최적 검정 방법 제안)
4. Pyodide 통합 및 Python 환경 설정
5. 사용자 확인 인터페이스 구현
6. 통계 분석 실행 모듈
7. Chart.js 시각화 및 의사결정 과정 시각화
8. Excel/PDF 내보내기
9. 에러 처리 및 복구
10. 최종 빌드 및 최적화