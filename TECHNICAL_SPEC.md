# 기술 명세서 (Technical Specification)
**프로젝트**: 전문가급 통계 분석 플랫폼  
**버전**: 2.0  
**작성일**: 2025-09-12  
**기술 스택**: Next.js 15 + TypeScript + shadcn/ui + Pyodide

---

## 1. 시스템 아키텍처

### 1.1 기술 스택 구성
```
┌─────────────────────────────────────┐
│      Next.js 15 App Router          │
│         (React 19 기반)              │
├─────────────────────────────────────┤
│    TypeScript + Tailwind CSS        │
│        + shadcn/ui                  │
├─────────────────────────────────────┤
│        Pyodide Runtime              │
│    (Python 3.11 in WASM)            │
├─────────────────────────────────────┤
│     Statistical Engine              │
│  (SciPy + NumPy + Pandas)           │
├─────────────────────────────────────┤
│    Visualization Layer              │
│        (Recharts)                   │
└─────────────────────────────────────┘
```

### 1.2 데이터 플로우
```
사용자 입력 → React Form → Validation → Pyodide Worker → 
통계 계산 → Type-safe Response → UI Update → 시각화
```

---

## 2. 핵심 컴포넌트 명세

### 2.1 Pyodide Manager (싱글톤 패턴)
```typescript
// lib/pyodide/manager.ts
export class PyodideManager {
  private static instance: PyodideManager | null = null
  private pyodide: any = null
  private isLoading = false
  private loadPromise: Promise<void> | null = null

  static getInstance(): PyodideManager {
    if (!PyodideManager.instance) {
      PyodideManager.instance = new PyodideManager()
    }
    return PyodideManager.instance
  }

  async initialize(): Promise<void> {
    if (this.pyodide) return
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise
    }

    this.isLoading = true
    this.loadPromise = this.loadPyodide()
    
    try {
      await this.loadPromise
    } finally {
      this.isLoading = false
    }
  }

  private async loadPyodide(): Promise<void> {
    const pyodide = await (window as any).loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
    })
    
    await pyodide.loadPackage(['numpy', 'scipy', 'pandas'])
    
    // 통계 함수 초기화
    await pyodide.runPythonAsync(`
      import numpy as np
      import scipy.stats as stats
      import pandas as pd
      import json
      
      def run_statistical_test(test_type, data, options=None):
          """통합 통계 테스트 실행기"""
          # 구현 코드...
    `)
    
    this.pyodide = pyodide
  }

  async runPython(code: string): Promise<any> {
    if (!this.pyodide) {
      await this.initialize()
    }
    return this.pyodide.runPythonAsync(code)
  }
}
```

### 2.2 통계 분석 타입 정의
```typescript
// lib/statistics.ts

// 기술통계 결과
export interface DescriptiveStatistics {
  count: number
  mean: number
  median: number
  mode: number | null
  standardDeviation: number
  variance: number
  range: number
  min: number
  max: number
  q1: number
  q3: number
  iqr: number
  skewness: number
  kurtosis: number
  coefficientOfVariation: number
}

// t-검정 결과
export interface TTestResult {
  testType: 'one-sample' | 'independent' | 'paired'
  statistic: number
  pValue: number
  degreesOfFreedom: number
  confidenceInterval: [number, number]
  effectSize: {
    cohensD: number
    interpretation: string
  }
  powerAnalysis: {
    achievedPower: number
    requiredSampleSize: number
  }
  assumptions: AssumptionCheck[]
  conclusion: string
}

// ANOVA 결과
export interface AnovaResult {
  type: 'one-way' | 'two-way' | 'repeated-measures'
  fStatistic: number
  pValue: number
  dfBetween: number
  dfWithin: number
  msBetween: number
  msWithin: number
  effectSize: {
    etaSquared: number
    partialEtaSquared: number
    omegaSquared: number
  }
  postHoc?: PostHocResult[]
  assumptions: AssumptionCheck[]
}

// 가정 검정
export interface AssumptionCheck {
  name: string
  met: boolean
  description: string
  testStatistic?: number
  pValue?: number
  visualization?: string // base64 encoded plot
}
```

### 2.3 데이터 처리 시스템
```typescript
// lib/data/handler.ts

export class DataHandler {
  private data: DataFrame | null = null
  private metadata: DataMetadata

  constructor() {
    this.metadata = {
      fileName: '',
      fileSize: 0,
      rowCount: 0,
      columnCount: 0,
      columns: [],
      dataTypes: {},
      missingValues: {}
    }
  }

  async parseCSV(file: File): Promise<DataFrame> {
    const text = await file.text()
    const lines = text.trim().split('\n')
    const delimiter = this.detectDelimiter(text)
    
    // Papa Parse 또는 자체 파서 사용
    const parsed = this.parseWithDelimiter(lines, delimiter)
    
    // 데이터 검증
    this.validateData(parsed)
    
    // 메타데이터 추출
    this.extractMetadata(parsed)
    
    this.data = parsed
    return parsed
  }

  private detectDelimiter(text: string): string {
    const delimiters = [',', '\t', ';', '|']
    const counts = delimiters.map(d => ({
      delimiter: d,
      count: (text.match(new RegExp(d, 'g')) || []).length
    }))
    
    return counts.sort((a, b) => b.count - a.count)[0].delimiter
  }

  private validateData(data: DataFrame): void {
    // 데이터 타입 검증
    // 결측치 확인
    // 이상치 탐지
    // 데이터 일관성 검사
  }

  transformData(transformations: DataTransformation[]): DataFrame {
    let transformed = { ...this.data }
    
    for (const transform of transformations) {
      switch (transform.type) {
        case 'normalize':
          transformed = this.normalize(transformed, transform.options)
          break
        case 'standardize':
          transformed = this.standardize(transformed, transform.options)
          break
        case 'log':
          transformed = this.logTransform(transformed, transform.options)
          break
        case 'removeOutliers':
          transformed = this.removeOutliers(transformed, transform.options)
          break
      }
    }
    
    return transformed
  }
}
```

---

## 3. API 명세

### 3.1 통계 분석 API
```typescript
// app/api/analysis/route.ts

export async function POST(request: Request) {
  const { testType, data, options } = await request.json()
  
  try {
    // 입력 검증
    validateInput(testType, data, options)
    
    // Pyodide 실행
    const manager = PyodideManager.getInstance()
    const result = await manager.runPython(`
      run_statistical_test('${testType}', ${JSON.stringify(data)}, ${JSON.stringify(options)})
    `)
    
    // 결과 타입 변환
    const typedResult = parseResult(result, testType)
    
    return NextResponse.json({
      success: true,
      result: typedResult,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}
```

### 3.2 데이터 업로드 API
```typescript
// app/api/data/upload/route.ts

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  
  // 파일 크기 제한 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }
  
  try {
    const handler = new DataHandler()
    const data = await handler.parseCSV(file)
    
    // 세션 스토리지에 저장
    const sessionId = generateSessionId()
    await saveToSession(sessionId, data)
    
    return NextResponse.json({
      sessionId,
      metadata: handler.getMetadata(),
      preview: data.slice(0, 10) // 처음 10행 미리보기
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to parse file',
      details: error.message 
    }, { status: 400 })
  }
}
```

---

## 4. 상태 관리

### 4.1 Zustand Store 구조
```typescript
// lib/store.ts

interface StatisticsStore {
  // 데이터
  currentData: DataFrame | null
  sessionId: string | null
  
  // 분석 결과
  analysisHistory: AnalysisResult[]
  currentAnalysis: AnalysisResult | null
  
  // UI 상태
  isLoading: boolean
  error: string | null
  
  // 사용자 설정
  preferences: UserPreferences
  
  // 액션
  setData: (data: DataFrame) => void
  runAnalysis: (type: string, options: any) => Promise<void>
  clearResults: () => void
  updatePreferences: (prefs: Partial<UserPreferences>) => void
}

export const useStatisticsStore = create<StatisticsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        currentData: null,
        sessionId: null,
        analysisHistory: [],
        currentAnalysis: null,
        isLoading: false,
        error: null,
        preferences: defaultPreferences,
        
        // 액션 구현
        setData: (data) => set({ currentData: data }),
        
        runAnalysis: async (type, options) => {
          set({ isLoading: true, error: null })
          
          try {
            const response = await fetch('/api/analysis', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                testType: type,
                data: get().currentData,
                options
              })
            })
            
            const result = await response.json()
            
            if (result.success) {
              set({
                currentAnalysis: result.result,
                analysisHistory: [...get().analysisHistory, result.result]
              })
            } else {
              set({ error: result.error })
            }
          } catch (error) {
            set({ error: error.message })
          } finally {
            set({ isLoading: false })
          }
        },
        
        clearResults: () => set({ 
          currentAnalysis: null, 
          analysisHistory: [] 
        }),
        
        updatePreferences: (prefs) => set({ 
          preferences: { ...get().preferences, ...prefs } 
        })
      }),
      {
        name: 'statistics-storage',
        partialize: (state) => ({ 
          preferences: state.preferences,
          analysisHistory: state.analysisHistory.slice(-10) // 최근 10개만 저장
        })
      }
    )
  )
)
```

---

## 5. UI 컴포넌트 시스템

### 5.1 데이터 테이블 컴포넌트
```typescript
// components/data/DataTable.tsx

interface DataTableProps {
  data: DataFrame
  onEdit?: (row: number, col: number, value: any) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  selectable?: boolean
  editable?: boolean
}

export function DataTable({ 
  data, 
  onEdit, 
  onSort, 
  selectable = false, 
  editable = false 
}: DataTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  
  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox onCheckedChange={handleSelectAll} />
              </TableHead>
            )}
            {data.columns.map(column => (
              <TableHead 
                key={column}
                onClick={() => handleSort(column)}
                className="cursor-pointer hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  {column}
                  {sortConfig?.column === column && (
                    <SortIcon direction={sortConfig.direction} />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Virtual scrolling for large datasets */}
          <VirtualList
            height={600}
            itemCount={data.rows.length}
            itemSize={48}
            renderItem={({ index }) => (
              <DataRow
                row={data.rows[index]}
                index={index}
                selected={selectedRows.has(index)}
                editable={editable}
                onEdit={onEdit}
                onSelect={handleRowSelect}
              />
            )}
          />
        </TableBody>
      </Table>
    </div>
  )
}
```

### 5.2 분석 마법사 컴포넌트
```typescript
// components/analysis/AnalysisWizard.tsx

export function AnalysisWizard() {
  const [step, setStep] = useState(0)
  const [testType, setTestType] = useState<string>('')
  const [variables, setVariables] = useState<Variable[]>([])
  const [options, setOptions] = useState<AnalysisOptions>({})
  
  const steps = [
    { title: '테스트 선택', component: <TestSelector onSelect={setTestType} /> },
    { title: '변수 선택', component: <VariableSelector onSelect={setVariables} /> },
    { title: '가정 검정', component: <AssumptionChecker variables={variables} /> },
    { title: '옵션 설정', component: <OptionsPanel test={testType} onChange={setOptions} /> },
    { title: '결과 확인', component: <ResultsPreview test={testType} variables={variables} options={options} /> }
  ]
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>통계 분석 마법사</CardTitle>
        <Progress value={(step + 1) / steps.length * 100} />
      </CardHeader>
      <CardContent className="min-h-[400px]">
        {steps[step].component}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          {step + 1} / {steps.length} - {steps[step].title}
        </span>
        <Button 
          onClick={() => step === steps.length - 1 ? handleAnalysis() : setStep(step + 1)}
        >
          {step === steps.length - 1 ? '분석 실행' : '다음'}
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

## 6. 성능 최적화

### 6.1 Pyodide 최적화
```typescript
// 1. 지연 로딩
const PyodideLoader = dynamic(() => import('@/lib/pyodide/loader'), {
  ssr: false,
  loading: () => <LoadingSpinner />
})

// 2. 웹 워커 사용
const worker = new Worker('/workers/pyodide.worker.js')
worker.postMessage({ type: 'init' })

// 3. 결과 캐싱
const cache = new Map<string, any>()
const getCachedResult = (key: string) => {
  if (cache.has(key)) {
    return cache.get(key)
  }
  const result = computeExpensiveOperation(key)
  cache.set(key, result)
  return result
}
```

### 6.2 React 최적화
```typescript
// 1. 메모이제이션
const MemoizedChart = memo(Chart, (prev, next) => 
  prev.data === next.data && prev.type === next.type
)

// 2. 가상 스크롤링
import { VariableSizeList } from 'react-window'

// 3. 상태 분리
const useAnalysisState = () => {
  const data = useStatisticsStore(state => state.currentData)
  const analysis = useStatisticsStore(state => state.currentAnalysis)
  return { data, analysis }
}
```

---

## 7. 에러 처리

### 7.1 전역 에러 바운더리
```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러 로깅
    console.error('Application error:', error)
    
    // Sentry 또는 다른 에러 추적 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      captureException(error)
    }
  }, [error])
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>오류가 발생했습니다</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={reset} className="w-full">
            다시 시도
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
```

### 7.2 분석 에러 처리
```typescript
class StatisticalError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'StatisticalError'
  }
}

// 사용 예시
if (data.length < MIN_SAMPLE_SIZE) {
  throw new StatisticalError(
    `최소 ${MIN_SAMPLE_SIZE}개 이상의 데이터가 필요합니다.`,
    'INSUFFICIENT_DATA',
    { provided: data.length, required: MIN_SAMPLE_SIZE }
  )
}
```

---

## 8. 테스트 전략

### 8.1 단위 테스트
```typescript
// __tests__/statistics.test.ts
import { describe, it, expect } from '@jest/globals'
import { calculateMean, calculateTTest } from '@/lib/statistics'

describe('Statistics Functions', () => {
  describe('calculateMean', () => {
    it('should calculate mean correctly', () => {
      expect(calculateMean([1, 2, 3, 4, 5])).toBe(3)
    })
    
    it('should handle empty array', () => {
      expect(() => calculateMean([])).toThrow('INSUFFICIENT_DATA')
    })
  })
  
  describe('t-test', () => {
    it('should match R output', () => {
      const result = calculateTTest(
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6]
      )
      expect(result.pValue).toBeCloseTo(0.0421, 4)
    })
  })
})
```

### 8.2 통합 테스트
```typescript
// __tests__/integration/analysis-flow.test.ts
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Analysis Flow', () => {
  it('should complete full analysis workflow', async () => {
    render(<AnalysisPage />)
    
    // 파일 업로드
    const file = new File(['col1,col2\n1,2\n3,4'], 'test.csv')
    const input = screen.getByLabelText('Upload CSV')
    await userEvent.upload(input, file)
    
    // 테스트 선택
    await userEvent.click(screen.getByText('t-test'))
    
    // 분석 실행
    await userEvent.click(screen.getByText('Run Analysis'))
    
    // 결과 확인
    await waitFor(() => {
      expect(screen.getByText(/p-value/i)).toBeInTheDocument()
    })
  })
})
```

---

## 9. 보안 고려사항

### 9.1 입력 검증
```typescript
// 파일 업로드 검증
const validateFile = (file: File): boolean => {
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large')
  }
  
  return true
}

// SQL Injection 방지 (데이터베이스 사용 시)
const sanitizeInput = (input: string): string => {
  return input.replace(/[^a-zA-Z0-9_-]/g, '')
}
```

### 9.2 CORS 설정
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}
```

---

## 10. 배포 및 모니터링

### 10.1 Docker 컨테이너화
```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

### 10.2 성능 모니터링
```typescript
// lib/monitoring.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  
  // 성능 데이터 수집
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', {
      name,
      value: Math.round(end - start),
      event_category: 'Performance',
    })
  }
}

// 사용 예시
measurePerformance('analysis_complete', () => {
  runComplexAnalysis()
})
```

---

## 11. 향후 확장 계획

### 11.1 AI 모델 통합
- Ollama 기반 로컬 LLM 통합
- 자동 분석 방법 추천
- 결과 해석 자동화

### 11.2 실시간 협업
- WebSocket 기반 실시간 동기화
- 다중 사용자 동시 편집
- 분석 결과 공유

### 11.3 클라우드 연동
- AWS S3 파일 스토리지
- Google Sheets 연동
- API 서비스 제공

---

*최종 업데이트: 2025-09-12*  
*다음 리뷰: Phase 2 완료 시*