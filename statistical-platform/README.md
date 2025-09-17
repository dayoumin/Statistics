# 📊 통계 분석 플랫폼 (Statistical Analysis Platform)

> **전문가급 통계 분석을 누구나 쉽게** - SPSS/R 수준의 고급 통계를 웹 브라우저에서 구현한 차세대 통계 플랫폼

## 🚀 프로젝트 소개

이 프로젝트는 복잡한 통계 분석을 단순하고 직관적으로 만드는 웹 기반 통계 플랫폼입니다.
연구자, 데이터 분석가, 학생 등 누구나 전문적인 통계 분석을 수행할 수 있도록 설계되었습니다.

### ✨ 핵심 기능

- **🎯 스마트 분석 플로우**: 5단계 가이드형 인터페이스로 초보자도 쉽게 분석
- **📈 29개 통계 방법**: t-검정, ANOVA, 회귀분석, 비모수검정 등 포괄적 지원
- **🐍 Python 통계 엔진**: Pyodide를 통한 SciPy/NumPy 기반 정확한 계산
- **📊 실시간 시각화**: 대화형 차트와 그래프로 결과 즉시 확인
- **📄 자동 보고서**: PDF/Excel 형식의 전문 보고서 자동 생성
- **🌐 100% 웹 기반**: 설치 없이 브라우저에서 모든 기능 사용

## 🛠️ 기술 스택

```
Frontend:
├── Next.js 15 (App Router)
├── TypeScript
├── shadcn/ui
└── Tailwind CSS

통계 엔진:
├── Pyodide (WebAssembly Python)
├── SciPy / NumPy / Pandas
└── Plotly.js (시각화)

상태 관리:
├── Zustand
└── TanStack Query

개발 도구:
├── ESLint / Prettier
├── Vitest (테스트)
└── Storybook (문서화)
```

## 🚦 시작하기

### 필수 요구사항

- Node.js 18.17 이상
- npm 9.0 이상
- 모던 브라우저 (Chrome, Edge, Firefox, Safari 최신 버전)

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 브라우저에서 열기
# http://localhost:3000
```

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 📁 프로젝트 구조

```
statistical-platform/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # 대시보드 라우트 그룹
│   │   ├── dashboard/      # 메인 대시보드
│   │   ├── analysis/       # 통계 분석 페이지
│   │   ├── smart-flow/     # 스마트 분석 플로우
│   │   └── data/           # 데이터 관리
│   └── api/                # API 라우트
├── components/             # React 컴포넌트
│   ├── ui/                 # shadcn/ui 컴포넌트
│   ├── smart-flow/         # 스마트 플로우 컴포넌트
│   │   └── steps/          # 단계별 컴포넌트
│   └── charts/             # 차트 컴포넌트
├── lib/                    # 핵심 라이브러리
│   ├── statistics/         # 통계 모듈
│   ├── services/           # 서비스 레이어
│   │   └── executors/      # 통계 실행기
│   ├── stores/             # Zustand 스토어
│   └── utils/              # 유틸리티 함수
├── docs/                   # 📚 프로젝트 문서
│   ├── guides/             # 사용자 가이드
│   ├── workflow/           # 워크플로우 문서
│   ├── technical/          # 기술 문서
│   ├── specifications/     # 명세서
│   └── development/        # 개발 문서
└── types/                  # TypeScript 타입 정의
```

## 📖 문서

### 📚 사용자 가이드
- [통계 분석 쉽게 하기](docs/guides/EASY_STATISTICS_GUIDE.md)
- [연구자를 위한 가이드](docs/guides/RESEARCH_USER_GUIDE.md)

### 🔄 워크플로우 문서
- [Step 1: 데이터 업로드](docs/workflow/step1-data-upload.md)
- [Step 2: 데이터 검증](docs/workflow/step2-data-validation.md)
- [Step 3: 분석 목표 설정](docs/workflow/step3-purpose-input.md)
- [Step 4: 분석 실행](docs/workflow/step4-analysis-execution.md)
- [Step 5: 결과 및 액션](docs/workflow/step5-results-action.md)

### 🔧 기술 문서
- [통계 신뢰성 보고서](docs/technical/STATISTICAL_RELIABILITY_REPORT.md)
- [통계 라이브러리 표준](docs/technical/STATISTICS_LIBRARY_STANDARDS.md)

### 📋 명세서
- [통계 방법 레퍼런스](docs/specifications/STATISTICAL_METHODS_REFERENCE.md)

### 🛠️ 개발 문서
- [테스트 마스터 플랜](docs/development/TESTING_MASTER_PLAN.md)

## 🎯 주요 기능 소개

### 1. 스마트 분석 플로우 (`/smart-flow`)

5단계 가이드형 인터페이스로 통계 분석을 단순화:
1. **데이터 업로드**: CSV/Excel 파일 업로드 및 자동 파싱
2. **데이터 검증**: 자동 품질 검사 및 시각화
3. **분석 목표 설정**: 자연어로 질문 입력
4. **분석 실행**: AI 추천 방법으로 자동 분석
5. **결과 해석**: 시각화 및 보고서 생성

### 2. 통계 분석 메서드 (`/analysis`)

#### 기술통계
- 평균, 중앙값, 표준편차
- 정규성 검정 (Shapiro-Wilk)
- 등분산 검정 (Levene, Bartlett)

#### 가설 검정
- t-검정 (일표본, 독립표본, 대응표본)
- ANOVA (일원, 이원)
- 사후검정 (Tukey HSD, Games-Howell)

#### 상관 및 회귀
- Pearson/Spearman 상관분석
- 단순/다중 선형회귀
- 로지스틱 회귀

#### 비모수 검정
- Mann-Whitney U
- Wilcoxon signed-rank
- Kruskal-Wallis
- Friedman test

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# 테스트 커버리지
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

## 🤝 기여하기

프로젝트 기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

- **프로젝트 팀**: Statistical Platform Team
- **이메일**: contact@statplatform.com
- **GitHub**: [https://github.com/yourorg/statistical-platform](https://github.com/yourorg/statistical-platform)

## 🙏 Acknowledgments

- [Pyodide](https://pyodide.org/) - Python scientific stack in the browser
- [SciPy](https://scipy.org/) - Scientific computing in Python
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Next.js](https://nextjs.org/) - The React Framework

---

**Last Updated**: 2025-09-17
**Version**: 1.0.0-beta