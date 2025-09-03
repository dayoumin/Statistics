# 📐 디자인 시스템 (Design System)
**프로젝트**: 수산과학원 통계분석 도구  
**버전**: 1.0  
**작성일**: 2025-01-03

> 모든 UI 컴포넌트가 따라야 할 시각적 규칙과 패턴

---

## 1. 🎨 색상 시스템 (Color System)

### 1.1 Primary Palette
```css
:root {
  /* 브랜드 색상 - 수산과학원 아이덴티티 */
  --primary-50:  #E8F5E9;
  --primary-100: #C8E6C9;
  --primary-200: #A5D6A7;
  --primary-300: #81C784;
  --primary-400: #66BB6A;
  --primary-500: #4CAF50;  /* Main */
  --primary-600: #43A047;
  --primary-700: #388E3C;
  --primary-800: #2E7D32;
  --primary-900: #1B5E20;
}
```

### 1.2 Semantic Colors (의미론적 색상)
```css
:root {
  /* 통계적 유의성 */
  --stat-highly-significant: #B71C1C;  /* p < 0.001 *** */
  --stat-very-significant:   #D32F2F;  /* p < 0.01  **  */
  --stat-significant:         #F57C00;  /* p < 0.05  *   */
  --stat-marginal:           #FFA726;  /* p < 0.10  .   */
  --stat-not-significant:    #66BB6A;  /* p ≥ 0.10      */
  
  /* 상태 색상 */
  --success: #4CAF50;
  --warning: #FF9800;
  --error:   #F44336;
  --info:    #2196F3;
  
  /* 중립 색상 */
  --gray-50:  #FAFAFA;
  --gray-100: #F5F5F5;
  --gray-200: #EEEEEE;
  --gray-300: #E0E0E0;
  --gray-400: #BDBDBD;
  --gray-500: #9E9E9E;
  --gray-600: #757575;
  --gray-700: #616161;
  --gray-800: #424242;
  --gray-900: #212121;
}
```

### 1.3 사용 규칙
```css
/* 배경 */
.bg-primary { background-color: var(--primary-500); }
.bg-surface { background-color: var(--gray-50); }
.bg-card { background-color: white; }

/* 텍스트 */
.text-primary { color: var(--primary-700); }
.text-secondary { color: var(--gray-600); }
.text-disabled { color: var(--gray-400); }

/* 유의성 표시 */
.significance-high { 
  color: var(--stat-highly-significant);
  font-weight: bold;
}
.significance-marker::after {
  content: attr(data-significance); /* ***, **, *, . */
  color: var(--stat-significant);
  margin-left: 4px;
}
```

---

## 2. 📏 타이포그래피 (Typography)

### 2.1 폰트 스택
```css
:root {
  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 
               'Segoe UI', 'Noto Sans KR', sans-serif;
  --font-mono: 'Fira Code', 'D2Coding', monospace;
}
```

### 2.2 텍스트 스케일
```css
/* Type Scale - Major Third (1.25) */
.text-xs   { font-size: 0.75rem; line-height: 1rem; }     /* 12px */
.text-sm   { font-size: 0.875rem; line-height: 1.25rem; } /* 14px */
.text-base { font-size: 1rem; line-height: 1.5rem; }      /* 16px */
.text-lg   { font-size: 1.125rem; line-height: 1.75rem; } /* 18px */
.text-xl   { font-size: 1.25rem; line-height: 1.75rem; }  /* 20px */
.text-2xl  { font-size: 1.563rem; line-height: 2rem; }    /* 25px */
.text-3xl  { font-size: 1.953rem; line-height: 2.25rem; } /* 31px */
.text-4xl  { font-size: 2.441rem; line-height: 2.5rem; }  /* 39px */

/* Font Weights */
.font-normal  { font-weight: 400; }
.font-medium  { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold    { font-weight: 700; }

/* 특수 용도 */
.stat-value {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```

### 2.3 사용 패턴
```html
<!-- 주 제목 -->
<h1 class="text-3xl font-bold text-gray-900">통계 분석 결과</h1>

<!-- 섹션 제목 -->
<h2 class="text-xl font-semibold text-gray-800">가정 검정</h2>

<!-- 통계 값 -->
<span class="stat-value text-2xl font-bold">F = 12.345</span>

<!-- p-value -->
<span class="text-sm font-medium significance-high">p < 0.001 ***</span>
```

---

## 3. 📦 스페이싱 시스템 (Spacing)

### 3.1 8px 그리드
```css
:root {
  --space-0:   0;
  --space-1:   0.25rem;  /* 4px */
  --space-2:   0.5rem;   /* 8px */
  --space-3:   0.75rem;  /* 12px */
  --space-4:   1rem;     /* 16px */
  --space-5:   1.25rem;  /* 20px */
  --space-6:   1.5rem;   /* 24px */
  --space-8:   2rem;     /* 32px */
  --space-10:  2.5rem;   /* 40px */
  --space-12:  3rem;     /* 48px */
  --space-16:  4rem;     /* 64px */
}

/* Tailwind 클래스 매핑 */
.p-4 { padding: var(--space-4); }
.m-4 { margin: var(--space-4); }
.gap-4 { gap: var(--space-4); }
```

---

## 4. 🎯 컴포넌트 라이브러리

### 4.1 버튼 (Buttons)
```css
/* Base Button */
.btn {
  @apply px-4 py-2 rounded-lg font-medium 
         transition-all duration-200 
         focus:outline-none focus:ring-2;
}

/* Primary Button */
.btn-primary {
  @apply btn bg-primary-600 text-white 
         hover:bg-primary-700 active:bg-primary-800
         focus:ring-primary-500;
}

/* Secondary Button */
.btn-secondary {
  @apply btn bg-gray-200 text-gray-800
         hover:bg-gray-300 active:bg-gray-400
         focus:ring-gray-500;
}

/* Analyze Button (특수) */
.btn-analyze {
  @apply btn bg-gradient-to-r from-primary-500 to-primary-600
         text-white font-semibold px-8 py-3
         hover:from-primary-600 hover:to-primary-700
         transform hover:scale-105 active:scale-95
         shadow-lg hover:shadow-xl;
}
```

### 4.2 카드 (Cards)
```css
/* Base Card */
.card {
  @apply bg-white rounded-xl shadow-md p-6;
}

/* Result Card */
.result-card {
  @apply card border-l-4;
}

.result-card.significant {
  @apply border-l-red-500 bg-red-50;
}

.result-card.not-significant {
  @apply border-l-green-500 bg-green-50;
}

/* Stat Card */
.stat-card {
  @apply card hover:shadow-lg transition-shadow;
}

.stat-card-header {
  @apply text-sm font-medium text-gray-600 mb-2;
}

.stat-card-value {
  @apply text-3xl font-bold text-gray-900;
}

.stat-card-detail {
  @apply text-sm text-gray-500 mt-2;
}
```

### 4.3 입력 필드 (Input Fields)
```css
/* Text Input */
.input {
  @apply w-full px-4 py-2 border border-gray-300 rounded-lg
         focus:outline-none focus:ring-2 focus:ring-primary-500
         focus:border-transparent;
}

/* Textarea */
.textarea {
  @apply input resize-vertical min-h-[120px];
}

/* File Drop Zone */
.drop-zone {
  @apply border-2 border-dashed border-gray-300 rounded-xl
         p-8 text-center cursor-pointer
         hover:border-primary-500 hover:bg-primary-50
         transition-colors duration-200;
}

.drop-zone.active {
  @apply border-primary-500 bg-primary-100;
}

.drop-zone.has-data {
  @apply border-solid border-green-500 bg-green-50;
}
```

### 4.4 테이블 (Tables)
```css
/* Data Table */
.data-table {
  @apply w-full bg-white rounded-lg overflow-hidden shadow;
}

.data-table thead {
  @apply bg-gray-100;
}

.data-table th {
  @apply px-4 py-3 text-left text-xs font-medium 
         text-gray-700 uppercase tracking-wider;
}

.data-table td {
  @apply px-4 py-3 text-sm text-gray-900 border-t border-gray-200;
}

.data-table tbody tr:hover {
  @apply bg-gray-50;
}

/* Result Table */
.result-table .significant-row {
  @apply bg-red-50 font-semibold;
}
```

### 4.5 알림 (Alerts)
```css
.alert {
  @apply p-4 rounded-lg border flex items-start;
}

.alert-success {
  @apply alert bg-green-50 border-green-200 text-green-800;
}

.alert-warning {
  @apply alert bg-yellow-50 border-yellow-200 text-yellow-800;
}

.alert-error {
  @apply alert bg-red-50 border-red-200 text-red-800;
}

.alert-info {
  @apply alert bg-blue-50 border-blue-200 text-blue-800;
}
```

### 4.6 로딩 상태 (Loading States)
```css
/* Skeleton */
.skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}

.skeleton-text {
  @apply skeleton h-4 w-3/4 mb-2;
}

.skeleton-box {
  @apply skeleton h-32 w-full;
}

/* Progress Bar */
.progress-bar {
  @apply w-full bg-gray-200 rounded-full h-2;
}

.progress-fill {
  @apply bg-gradient-to-r from-primary-400 to-primary-600
         h-full rounded-full transition-all duration-500;
}

/* Spinner */
.spinner {
  @apply animate-spin h-5 w-5 text-primary-600;
}
```

---

## 5. 📐 레이아웃 패턴

### 5.1 그리드 시스템
```css
/* Main Layout */
.layout-main {
  @apply min-h-screen bg-gray-50;
}

.layout-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}

/* 3-Column Layout */
.layout-three-col {
  @apply grid grid-cols-1 lg:grid-cols-12 gap-6;
}

.layout-sidebar-left {
  @apply lg:col-span-3;
}

.layout-content {
  @apply lg:col-span-6;
}

.layout-sidebar-right {
  @apply lg:col-span-3;
}

/* 2-Column Layout */
.layout-two-col {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}
```

### 5.2 섹션 구분
```css
.section {
  @apply mb-8;
}

.section-header {
  @apply mb-4 pb-2 border-b border-gray-200;
}

.section-title {
  @apply text-xl font-semibold text-gray-800;
}

.section-content {
  @apply space-y-4;
}
```

---

## 6. 🎬 애니메이션 & 트랜지션

### 6.1 트랜지션
```css
/* Standard Transitions */
.transition-colors { transition: color, background-color 200ms; }
.transition-shadow { transition: box-shadow 200ms; }
.transition-transform { transition: transform 200ms; }
.transition-all { transition: all 200ms; }

/* Easing Functions */
.ease-in { transition-timing-function: ease-in; }
.ease-out { transition-timing-function: ease-out; }
.ease-in-out { transition-timing-function: ease-in-out; }
```

### 6.2 애니메이션
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
.animate-slideIn { animation: slideIn 0.3s ease-out; }
.animate-pulse { animation: pulse 2s infinite; }
```

---

## 7. 📱 반응형 브레이크포인트

```css
/* Breakpoints */
:root {
  --screen-sm: 640px;   /* Mobile landscape */
  --screen-md: 768px;   /* Tablet */
  --screen-lg: 1024px;  /* Desktop */
  --screen-xl: 1280px;  /* Large Desktop */
  --screen-2xl: 1536px; /* Extra Large */
}

/* Media Queries */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

---

## 8. 🎯 통계 전용 컴포넌트

### 8.1 P-value 표시
```html
<div class="p-value-display">
  <span class="p-value-label">p-value:</span>
  <span class="p-value-number" data-significance="***">0.0002</span>
  <div class="p-value-bar">
    <div class="p-value-marker" style="left: 95%"></div>
  </div>
</div>
```

### 8.2 신뢰구간 표시
```html
<div class="confidence-interval">
  <span class="ci-label">95% CI:</span>
  <span class="ci-range">[23.45, 26.78]</span>
  <div class="ci-visual">
    <div class="ci-bar"></div>
    <div class="ci-point"></div>
  </div>
</div>
```

### 8.3 효과 크기 표시
```html
<div class="effect-size">
  <span class="effect-label">Cohen's d:</span>
  <span class="effect-value large">1.23</span>
  <span class="effect-interpretation">Large effect</span>
</div>
```

---

## 9. 🔍 접근성 (Accessibility)

### 9.1 색상 대비
- 텍스트/배경: 최소 4.5:1 (WCAG AA)
- 큰 텍스트: 최소 3:1
- 중요 정보는 색상만으로 구분하지 않음

### 9.2 포커스 표시
```css
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

### 9.3 ARIA 레이블
```html
<button aria-label="데이터 분석 시작" class="btn-analyze">
  분석 시작
</button>

<div role="alert" aria-live="polite" class="alert-success">
  분석이 완료되었습니다
</div>
```

---

## 10. 📋 사용 예제

### 완전한 결과 카드
```html
<div class="result-card significant">
  <div class="flex justify-between items-start mb-4">
    <h3 class="text-lg font-semibold text-gray-900">
      One-way ANOVA
    </h3>
    <span class="badge badge-danger">Significant</span>
  </div>
  
  <div class="grid grid-cols-2 gap-4 mb-4">
    <div class="stat-item">
      <div class="stat-label">F-statistic</div>
      <div class="stat-value">12.345</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">p-value</div>
      <div class="stat-value significance-high">
        0.0001 ***
      </div>
    </div>
  </div>
  
  <div class="alert alert-info">
    <svg class="w-4 h-4 mr-2">...</svg>
    <span>그룹 간 유의미한 차이가 발견되었습니다. 
          사후분석을 확인하세요.</span>
  </div>
</div>
```

---

## 11. 🚀 구현 체크리스트

- [ ] 색상 변수 정의
- [ ] 타이포그래피 스케일 적용
- [ ] 기본 컴포넌트 스타일
- [ ] 레이아웃 그리드
- [ ] 반응형 브레이크포인트
- [ ] 애니메이션 정의
- [ ] 접근성 확인
- [ ] 다크모드 지원 (선택)

---

*마지막 업데이트: 2025-01-03*
*디자인 시스템 버전: 1.0*