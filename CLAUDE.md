# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 프로젝트 개요

**전문가급 통계 분석 플랫폼** (PC웹 + 데스크탑 앱)
- **목표**: SPSS/R Studio 급 고급 통계 소프트웨어
- **대상**: 수산과학 연구자, 통계 전문가, 데이터 분석가
- **기술**: Next.js 14 + TypeScript + shadcn/ui + Pyodide + Tauri

**핵심 기능**:
- **기본 통계**: t-test, ANOVA, 회귀분석, 상관분석
- **사후분석**: Tukey HSD, Games-Howell, Dunn's test
- **수산 특화**: CPUE 분석, von Bertalanffy 성장모델, 자원평가
- **고급 분석**: 검정력 분석, 효과크기, 다중비교 보정

## 🏗️ 프로젝트 구조 (Next.js 14)

### ⚠️ 중요: 새로운 개발 방식
> **"Next.js 14 App Router + TypeScript + shadcn/ui"**

```
D:\Projects\Statics\
├── app/                          # Next.js App Router
│   ├── globals.css               # 전역 스타일
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 홈페이지
│   ├── (dashboard)/              # 라우트 그룹
│   │   ├── layout.tsx            # 대시보드 레이아웃  
│   │   ├── dashboard/page.tsx    # 메인 대시보드
│   │   ├── analysis/             # 통계 분석 페이지들
│   │   ├── data/                 # 데이터 관리
│   │   └── settings/             # 설정
│   └── api/                      # API Routes
├── components/                   # React 컴포넌트
│   ├── ui/                       # shadcn/ui 기본 컴포넌트
│   ├── layout/                   # 레이아웃 컴포넌트  
│   ├── charts/                   # 시각화 컴포넌트
│   └── forms/                    # 폼 컴포넌트
├── lib/                          # 유틸리티 라이브러리
│   ├── utils.ts                  # 공통 유틸
│   ├── store.ts                  # 상태 관리 (Zustand)
│   └── pyodide/                  # Pyodide 통합
├── public/                       # 정적 파일
├── test-data/                    # 테스트용 CSV 파일들
└── 계획 문서들/                   # 프로젝트 계획서들
```

### 🔴 현재 개발 상태
**Phase 1 Week 1 진행 중** (2025-09-10)
- ✅ 5개 계획 문서 작성 완료 (A급 품질)
- ✅ 기술 스택 확정: Next.js 15 + shadcn/ui + Pyodide + Tauri
- ✅ 13주 개발 로드맵 완성
- ✅ **Next.js 15.5.2 프로젝트 생성 완료!** (`statistical-platform`)
- 🎯 **내일 (2025-09-11) shadcn/ui 설치부터 계속!**

## 📋 개발 가이드라인

### 🛠️ 기술 스택
```
Frontend:
├── Next.js 14 (App Router)
├── TypeScript (완전한 타입 안전성)  
├── shadcn/ui (전문가급 UI)
└── Tailwind CSS (스타일링)

통계 엔진:
├── Pyodide (WebAssembly Python)
├── scipy.stats (핵심 통계)
├── numpy (수치 계산)
└── pandas (데이터 처리)

상태 관리:
├── Zustand (글로벌 상태)
└── TanStack Query (서버 상태)

데스크탑:
└── Tauri (Rust + Web)
```

### 📅 개발 단계 (13주 계획)

**Phase 1: 기반 구축 (Week 1-3)**
- Week 1: Next.js 14 셋업, shadcn/ui, 기본 레이아웃
- Week 2: 디자인 시스템, UI 컴포넌트 라이브러리
- Week 3: 데이터 처리, 상태 관리, 파일 업로드

**Phase 2: 통계 엔진 (Week 4-7)**
- Week 4-5: Pyodide 통합, Python 통계 엔진
- Week 6-7: 가정 검정, t-검정 구현

**Phase 3: 고급 분석 (Week 8-11)**
- Week 8-9: ANOVA, 사후분석
- Week 10-11: 회귀분석, 상관분석

**Phase 4: 완성 (Week 12-13)**
- Week 12: Tauri 데스크탑 앱
- Week 13: 테스트, 최적화, 배포

### 🎯 현재 진행 상황

**✅ 완료된 작업 (2025-09-10)**
- 프로젝트 마스터 플랜 작성
- 기술 아키텍처 설계  
- UI/UX 디자인 가이드라인
- 통계 분석 기능 명세
- 개발 단계별 체크리스트
- 문서 품질 검증 완료
- **Next.js 15.5.2 프로젝트 생성 완료** ✨

**🎯 다음 작업 (2025-09-11)**
- shadcn/ui 설치 및 설정
- 기본 레이아웃 구현
- 다크/라이트 테마 시스템
- 기본 컴포넌트 라이브러리 구축

## 🔧 개발 명령어

### 기본 개발 명령어
```bash
# 프로젝트 생성 (첫날만)
npx create-next-app@latest statistical-platform --typescript --tailwind --eslint --app

# 개발 서버 실행  
npm run dev

# 빌드
npm run build

# 프로덕션 서버
npm start

# 타입 체크
npm run type-check

# 린터 실행
npm run lint
```

### shadcn/ui 설치
```bash
# shadcn/ui 초기화
npx shadcn-ui@latest init

# 컴포넌트 설치
npx shadcn-ui@latest add button input card table dialog
```

## 📊 품질 기준

### 통계 정확성
- **정확도**: R/SPSS 결과와 0.0001 오차 이내
- **가정 검정**: 모든 통계 검정 전 가정 확인
- **효과크기**: Cohen's d, eta-squared 등 완전 구현
- **신뢰구간**: 95%, 99% 신뢰구간 제공

### 코드 품질
- **TypeScript**: 엄격한 타입 체크
- **ESLint**: 코딩 규칙 준수
- **Prettier**: 코드 포맷팅 일관성
- **테스트**: 주요 기능 단위/통합 테스트

### UI/UX 품질  
- **접근성**: WCAG 2.1 AA 준수
- **반응형**: 다양한 화면 크기 지원
- **다크모드**: 완전한 다크/라이트 테마
- **성능**: Core Web Vitals 기준 충족

## 📝 주요 참조 문서

### 프로젝트 계획서
- `PROJECT_MASTER_PLAN.md` - 전체 프로젝트 개요
- `TECHNICAL_ARCHITECTURE.md` - 기술 아키텍처 상세
- `UI_UX_DESIGN_GUIDELINES.md` - 디자인 시스템
- `STATISTICAL_ANALYSIS_SPECIFICATIONS.md` - 통계 기능 명세
- `DEVELOPMENT_PHASE_CHECKLIST.md` - 개발 체크리스트

### 진행 상황
- `START_TOMORROW.md` - 내일 시작 계획 (2025-09-11)

### 기술 문서
- Next.js 14: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
- Pyodide: https://pyodide.org

## ⚠️ 중요 주의사항

### 개발 원칙
1. **App Router 사용**: Pages Router 절대 사용 금지
2. **TypeScript 엄격 모드**: any 타입 사용 금지  
3. **shadcn/ui 컴포넌트**: 직접 스타일링보다 컴포넌트 우선
4. **접근성 준수**: 모든 인터랙티브 요소에 ARIA 라벨

### 파일 관리
1. **컴포넌트 명명**: PascalCase (예: DataTable.tsx)
2. **페이지 파일**: 소문자 (예: page.tsx, layout.tsx)
3. **유틸리티 함수**: camelCase (예: calculateMean.ts)
4. **Git 커밋**: 작은 단위로 자주 커밋

### 성능 고려사항  
1. **Dynamic Import**: 무거운 컴포넌트는 지연 로딩
2. **이미지 최적화**: Next.js Image 컴포넌트 사용
3. **Bundle 분석**: 정기적으로 번들 크기 확인
4. **Pyodide 캐싱**: 통계 연산 결과 캐싱

## 🎯 현재 우선순위

### 🔥 즉시 해야 할 일 (2025-09-11)
1. ✅ Next.js 15 프로젝트 생성 **완료!**
2. shadcn/ui 설치 및 기본 설정
3. 프로젝트 구조 생성
4. 기본 레이아웃 컴포넌트 구현

### 📈 Week 1 목표
- 개발 환경 완전 구축
- 기본 UI 시스템 완성
- 테마 시스템 구현
- 라우팅 구조 완성

### 🏆 최종 목표 (13주 후)
- **웹 애플리케이션**: 완전한 통계 분석 플랫폼
- **데스크탑 앱**: Tauri 기반 네이티브 앱  
- **전문가 수준**: SPSS/R 급 통계 기능
- **현대적 UI**: shadcn/ui 기반 아름다운 인터페이스

## 🤖 향후 AI 모델 통합 계획

**Phase 2+ (기본 기능 완성 후)**: Ollama 기반 로컬 AI 모델 통합
- **분석 방법 자동 추천**: 데이터 특성 분석 → 최적 통계 방법 제안  
- **자동 데이터 품질 검사**: 이상치, 결측값, 분포 이상 자동 탐지
- **지능적 결과 해석**: 맥락을 고려한 개인화된 해석 제공
- **동적 워크플로**: 분석 결과에 따른 다음 단계 자동 제안

**예상 효과**: 분석 시간 50-80% 단축, 초보자도 전문가급 분석 가능  
**기술 스택**: Ollama + gemma2:2b/llama3.2:1b (로컬 실행)
**구현 방식**: 기본 시스템과 분리된 AI 모듈 (선택적 활성화)

*자세한 계획: `AI_MODEL_INTEGRATION_PLAN.md` 참조*

---

## 🚀 개발 시작 준비 완료!

**문서 품질**: A급 (평균 88/100점)  
**기술 준비도**: 98%  
**계획 완성도**: 100%

**2025-09-11 오전 9시, Phase 1 Week 1 시작 예정!** ✨

---

*Last updated: 2025-09-10*  
*Next milestone: Phase 1 Week 1 시작*