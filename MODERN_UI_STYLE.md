# 🎨 모던 UI 스타일 가이드
**2024-2025 트렌드를 반영한 세련된 통계앱 디자인**

---

## 1. 🌈 고급 색상 시스템

### 1.1 그라디언트 & 글라스모피즘
```css
:root {
  /* 프리미엄 그라디언트 */
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-success: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --gradient-info: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  --gradient-warm: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  
  /* 서브틀 그라디언트 (배경용) */
  --gradient-subtle: linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%);
  --gradient-mesh: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.1) 0px, transparent 50%),
                    radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%),
                    radial-gradient(at 0% 50%, hsla(355,100%,93%,0.1) 0px, transparent 50%);
}

/* 글라스모피즘 효과 */
.glass {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}

.glass-dark {
  background: rgba(17, 25, 40, 0.75);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.125);
}
```

### 1.2 뉴모피즘 (Neumorphism)
```css
.neu-card {
  background: linear-gradient(145deg, #f0f0f3, #cacace);
  box-shadow: 20px 20px 60px #bebec2,
              -20px -20px 60px #ffffff;
  border-radius: 20px;
}

.neu-button {
  background: linear-gradient(145deg, #e6e6e9, #ffffff);
  box-shadow: 5px 5px 15px #d1d1d4,
              -5px -5px 15px #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.neu-button:active {
  box-shadow: inset 5px 5px 15px #d1d1d4,
              inset -5px -5px 15px #ffffff;
}
```

---

## 2. 🎯 모던 컴포넌트 디자인

### 2.1 플로팅 카드 효과
```css
.floating-card {
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.floating-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
}

.floating-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.15),
              0 15px 15px -5px rgba(0, 0, 0, 0.08);
}
```

### 2.2 애니메이션 버튼
```css
.btn-modern {
  position: relative;
  padding: 12px 32px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-radius: 50px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
}

.btn-modern::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn-modern:hover::before {
  width: 300px;
  height: 300px;
}

.btn-modern:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(103, 126, 234, 0.3);
}

/* 마이크로 인터랙션 */
.btn-modern:active {
  transform: scale(0.98);
}
```

### 2.3 모던 입력 필드
```css
.input-modern {
  position: relative;
}

.input-modern input {
  width: 100%;
  padding: 16px 20px;
  font-size: 16px;
  color: #333;
  border: 2px solid transparent;
  border-radius: 12px;
  background: #f8f9ff;
  outline: none;
  transition: all 0.3s ease;
}

.input-modern input:focus {
  background: white;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-modern label {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
  transition: all 0.3s ease;
}

.input-modern input:focus + label,
.input-modern input:not(:placeholder-shown) + label {
  top: -10px;
  left: 16px;
  font-size: 12px;
  color: #667eea;
  background: white;
  padding: 0 4px;
}
```

---

## 3. 📊 통계 시각화 스타일

### 3.1 프리미엄 차트 스타일
```javascript
// Chart.js 커스텀 테마
const modernChartTheme = {
  colors: {
    primary: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
    secondary: ['#4facfe', '#00f2fe', '#43e97b', '#38f9d7'],
    neutral: ['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8']
  },
  
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 25, 40, 0.9)',
        backdropFilter: 'blur(10px)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.parsed.y.toFixed(3)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      }
    }
  }
};
```

### 3.2 p-value 시각화 (고급)
```html
<div class="p-value-visualizer">
  <!-- 그라디언트 바 -->
  <div class="p-value-gradient-bar">
    <div class="gradient-track">
      <div class="significance-zones">
        <div class="zone highly-significant"></div>
        <div class="zone very-significant"></div>
        <div class="zone significant"></div>
        <div class="zone not-significant"></div>
      </div>
      <!-- 애니메이션 마커 -->
      <div class="p-value-indicator" style="left: 15%">
        <div class="pulse-ring"></div>
        <div class="marker-dot"></div>
        <div class="value-tooltip">p = 0.003</div>
      </div>
    </div>
  </div>
</div>
```

```css
.p-value-gradient-bar {
  position: relative;
  height: 40px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gradient-track {
  height: 100%;
  background: linear-gradient(90deg, 
    #ef4444 0%,    /* p < 0.001 */
    #f97316 10%,   /* p < 0.01 */
    #eab308 30%,   /* p < 0.05 */
    #22c55e 50%);  /* p > 0.05 */
}

.p-value-indicator {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.pulse-ring {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.3);
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  border: 3px solid #ef4444;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
```

---

## 4. 🎬 고급 애니메이션

### 4.1 페이지 전환 효과
```css
@keyframes slideUpFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-on-scroll {
  opacity: 0;
  animation: slideUpFadeIn 0.6s ease-out forwards;
  animation-delay: calc(var(--delay) * 100ms);
}

/* 스태거 애니메이션 */
.stagger-item:nth-child(1) { --delay: 1; }
.stagger-item:nth-child(2) { --delay: 2; }
.stagger-item:nth-child(3) { --delay: 3; }
```

### 4.2 로딩 애니메이션 (DNA 스타일)
```html
<div class="dna-loader">
  <div class="helix">
    <div class="strand"></div>
    <div class="strand"></div>
  </div>
</div>
```

```css
.dna-loader {
  width: 60px;
  height: 60px;
  position: relative;
}

.helix {
  width: 100%;
  height: 100%;
  animation: rotate 2s linear infinite;
}

.strand {
  position: absolute;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #667eea, #764ba2);
  left: 50%;
  transform: translateX(-50%);
}

.strand:nth-child(1) {
  animation: strand1 1s ease-in-out infinite;
}

.strand:nth-child(2) {
  animation: strand2 1s ease-in-out infinite;
}

@keyframes strand1 {
  0%, 100% { transform: translateX(-20px) scaleY(0.5); }
  50% { transform: translateX(20px) scaleY(1); }
}

@keyframes strand2 {
  0%, 100% { transform: translateX(20px) scaleY(1); }
  50% { transform: translateX(-20px) scaleY(0.5); }
}
```

---

## 5. 🌟 특수 효과

### 5.1 파티클 배경
```javascript
// 동적 파티클 배경 (Canvas)
class ParticleBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.init();
  }
  
  init() {
    // 통계 기호 파티클: Σ, μ, σ, χ², π
    const symbols = ['Σ', 'μ', 'σ', 'χ²', 'π', '∞', '∫'];
    
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 20 + 10,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.1 + 0.05
      });
    }
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach(particle => {
      this.ctx.font = `${particle.size}px 'Fira Code'`;
      this.ctx.fillStyle = `rgba(102, 126, 234, ${particle.opacity})`;
      this.ctx.fillText(particle.symbol, particle.x, particle.y);
      
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // 화면 밖으로 나가면 반대편에서 나타남
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.y > this.canvas.height) particle.y = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
    });
    
    requestAnimationFrame(() => this.animate());
  }
}
```

### 5.2 성공 애니메이션
```css
.success-checkmark {
  width: 80px;
  height: 80px;
  position: relative;
  margin: 0 auto;
}

.success-checkmark .circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke: #22c55e;
  fill: none;
  animation: circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.success-checkmark .check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  stroke: #22c55e;
  animation: check 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes circle {
  100% { stroke-dashoffset: 0; }
}

@keyframes check {
  100% { stroke-dashoffset: 0; }
}
```

---

## 6. 📱 반응형 & 적응형 디자인

### 6.1 플루이드 타이포그래피
```css
/* Clamp를 사용한 반응형 폰트 크기 */
.fluid-text-hero {
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.1;
}

.fluid-text-body {
  font-size: clamp(0.875rem, 2vw, 1.125rem);
}

/* 컨테이너 쿼리 (최신) */
@container (min-width: 400px) {
  .card-title {
    font-size: 1.5rem;
  }
}
```

### 6.2 다크모드 지원
```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a202c;
  --shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --bg-primary: #1a202c;
  --text-primary: #f7fafc;
  --shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
}

/* 자동 다크모드 감지 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-primary: #1a202c;
    --text-primary: #f7fafc;
  }
}

/* 부드러운 테마 전환 */
* {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

---

## 7. 🎯 실제 적용 예시

### 7.1 완성된 결과 카드
```html
<div class="floating-card glass">
  <!-- 상단 그라디언트 바 -->
  <div class="card-gradient-bar"></div>
  
  <!-- 헤더 -->
  <div class="card-header">
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                 bg-clip-text text-transparent">
        One-way ANOVA
      </h3>
      <span class="badge-modern badge-danger">
        <span class="pulse-dot"></span>
        Significant
      </span>
    </div>
  </div>
  
  <!-- 통계 값 -->
  <div class="stats-grid">
    <div class="stat-box glass-dark">
      <div class="stat-icon">
        <svg>...</svg>
      </div>
      <div class="stat-content">
        <div class="stat-label">F-statistic</div>
        <div class="stat-value-large">24.83</div>
      </div>
    </div>
    
    <div class="stat-box glass-dark">
      <div class="stat-content">
        <div class="stat-label">p-value</div>
        <div class="stat-value-large text-gradient">
          0.0001 ***
        </div>
      </div>
    </div>
  </div>
  
  <!-- 시각화 -->
  <div class="p-value-visualizer">
    <!-- 위의 p-value 시각화 컴포넌트 -->
  </div>
  
  <!-- 액션 버튼 -->
  <div class="card-actions">
    <button class="btn-modern">
      <span>View Details</span>
      <svg class="icon-arrow">...</svg>
    </button>
  </div>
</div>
```

---

## 8. 🚀 퍼포먼스 최적화

### 8.1 CSS 최적화
```css
/* GPU 가속 활용 */
.accelerated {
  transform: translateZ(0);
  will-change: transform;
}

/* 부드러운 애니메이션을 위한 최적화 */
.smooth-transition {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}
```

---

이제 정말 **세련되고 모던한** 통계앱이 될 것입니다! 
- 글라스모피즘
- 뉴모피즘  
- 그라디언트
- 마이크로 인터랙션
- 파티클 효과
- 플루이드 디자인

모두 적용되어 2024-2025년 최신 트렌드를 반영한 프리미엄 디자인입니다! 🎨✨