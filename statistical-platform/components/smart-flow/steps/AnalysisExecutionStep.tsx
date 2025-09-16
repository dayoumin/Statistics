'use client'

import { useEffect, useState } from 'react'
import { BarChart3, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatisticalAnalysisService } from '@/lib/services/statistical-analysis-service'
import { useSmartFlowStore } from '@/lib/stores/smart-flow-store'

interface AnalysisExecutionStepProps {
  method: string | null
  onAnalysisComplete: (results: any) => void
}

export function AnalysisExecutionStep({ method, onAnalysisComplete }: AnalysisExecutionStepProps) {
  const [progress, setProgress] = useState(0)
  const [currentTask, setCurrentTask] = useState('')
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pyodideLoading, setPyodideLoading] = useState(false)
  const [assumptionResults, setAssumptionResults] = useState<{
    normality?: { group1: any, group2: any }
    homogeneity?: any
  }>({})
  
  // Store에서 업로드된 데이터 가져오기
  const { uploadedData } = useSmartFlowStore()

  const tasks = [
    'Pyodide 환경 준비',
    '데이터 전처리',
    '정규성 검정',
    '등분산성 검정',
    `${method || '통계 분석'} 수행 중`,
    '결과 생성'
  ]

  useEffect(() => {
    const runAnalysis = async () => {
      if (!uploadedData || uploadedData.length === 0) {
        setError('분석할 데이터가 없습니다.')
        return
      }

      setPyodideLoading(true)
      setError(null)
      setProgress(0)
      setCompletedTasks([])
      
      try {
        const service = StatisticalAnalysisService.getInstance()
        
        // Step 1: Pyodide 초기화
        setCurrentTask('Pyodide 환경 준비')
        await service.initialize()
        setCompletedTasks(['Pyodide 환경 준비'])
        setProgress(20)
        setPyodideLoading(false)
        
        // Step 2: 데이터 전처리
        setCurrentTask('데이터 전처리')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 데이터 준비 (임시로 첫 2개 컬럼 사용)
        const columns = Object.keys(uploadedData[0])
        let data1: number[] = []
        let data2: number[] = []
        
        if (columns.length >= 2) {
          // 숫자형 컬럼 찾기
          const numericColumns = columns.filter(col => {
            const values = uploadedData.map(row => row[col])
            return values.every(v => !isNaN(Number(v)))
          })
          
          if (numericColumns.length >= 2) {
            data1 = uploadedData.map(row => Number(row[numericColumns[0]]))
            data2 = uploadedData.map(row => Number(row[numericColumns[1]]))
          } else if (numericColumns.length === 1) {
            // 하나의 숫자 컬럼과 범주형 컬럼으로 그룹 나누기
            const numericCol = numericColumns[0]
            const categoricalCol = columns.find(col => col !== numericCol)
            
            if (categoricalCol) {
              const groups = [...new Set(uploadedData.map(row => row[categoricalCol]))]
              if (groups.length === 2) {
                data1 = uploadedData
                  .filter(row => row[categoricalCol] === groups[0])
                  .map(row => Number(row[numericCol]))
                data2 = uploadedData
                  .filter(row => row[categoricalCol] === groups[1])
                  .map(row => Number(row[numericCol]))
              }
            }
          }
        }
        
        if (data1.length === 0 || data2.length === 0) {
          setError('분석 가능한 수치 데이터가 없습니다. 데이터를 확인해주세요.')
          setProgress(0)
          return
        }
        
        setCompletedTasks(prev => [...prev, '데이터 전처리'])
        setProgress(40)
        
        // Step 3: 모든 가정 검정 자동 수행
        setCurrentTask('가정 검정 수행 중')
        
        // 분석 방법에 따른 검정 타입 결정
        let testType: 'ttest' | 'anova' | 'regression' | 'correlation' = 'ttest'
        if (method?.includes('ANOVA')) testType = 'anova'
        else if (method?.includes('상관')) testType = 'correlation'
        else if (method?.includes('회귀')) testType = 'regression'
        
        // 모든 가정 검정 한번에 수행
        const allAssumptions = await service.performAllAssumptionTests(data1, data2, testType)
        
        setAssumptionResults(allAssumptions)
        
        // 검정 결과 로깅
        console.log('=== 모든 가정 검정 결과 ===')
        console.log('1. 정규성:', allAssumptions.normality)
        console.log('2. 등분산성:', allAssumptions.homogeneity)
        console.log('3. 독립성:', allAssumptions.independence)
        console.log('4. 선형성:', allAssumptions.linearity)
        console.log('5. 이상치:', allAssumptions.outliers)
        console.log('6. 표본 크기:', allAssumptions.sampleSize)
        
        // 가정 위반 시 경고 및 대안 제시
        const violations = []
        
        if (allAssumptions.normality && 
            (!allAssumptions.normality.group1.isNormal || !allAssumptions.normality.group2.isNormal)) {
          violations.push('정규성 위반 → Mann-Whitney U test 고려')
        }
        
        if (allAssumptions.homogeneity && !allAssumptions.homogeneity.isHomogeneous) {
          violations.push('등분산성 위반 → Welch t-test 자동 적용')
        }
        
        if (allAssumptions.outliers && 
            (allAssumptions.outliers.group1.hasOutliers || allAssumptions.outliers.group2.hasOutliers)) {
          const totalOutliers = allAssumptions.outliers.group1.iqrMethod + allAssumptions.outliers.group2.iqrMethod
          violations.push(`이상치 ${totalOutliers}개 발견 → 제거 또는 비모수 검정 고려`)
        }
        
        if (allAssumptions.sampleSize && !allAssumptions.sampleSize.isAdequate) {
          violations.push('표본 크기 부족 → 결과 해석 주의')
        }
        
        if (violations.length > 0) {
          console.warn('⚠ 가정 위반 사항:', violations.join(', '))
        } else {
          console.log('✅ 모든 가정 충족')
        }
        
        setCompletedTasks(prev => [...prev, '정규성 검정', '등분산성 검정'])
        setProgress(60)
        
        // Step 5: 실제 통계 분석 수행
        setCurrentTask(`${method || 't-검정'} 수행 중`)
        
        let result
        if (method?.includes('ANOVA')) {
          result = await service.performANOVA([data1, data2])
        } else if (method?.includes('상관')) {
          result = await service.performCorrelation(data1, data2)
        } else if (method?.includes('회귀')) {
          result = await service.performRegression(data1, data2)
        } else {
          // 기본: t-검정
          const testType = method?.includes('대응') ? 'paired' : 'independent'
          result = await service.performTTest(data1, data2, testType)
        }
        
        setCompletedTasks(prev => [...prev, `${method || 't-검정'} 수행 중`])
        setProgress(80)
        
        // Step 6: 결과 생성
        setCurrentTask('결과 생성')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 가정 검정 결과를 분석 결과에 추가
        const enhancedResult = {
          ...result,
          assumptions: {
            normality: assumptionResults.normality,
            homogeneity: assumptionResults.homogeneity
          }
        }
        
        setCompletedTasks(prev => [...prev, '결과 생성'])
        setProgress(100)
        
        // 결과 전달
        onAnalysisComplete(enhancedResult)
        
      } catch (err) {
        console.error('Analysis error:', err)
        setError(`통계 분석 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
        setPyodideLoading(false)
      }
    }
    
    runAnalysis()
  }, [method, onAnalysisComplete, uploadedData])

  return (
    <div className="space-y-6">
      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </Card>
      )}
      
      {pyodideLoading && (
        <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Python 환경을 준비하고 있습니다...
            </p>
          </div>
        </Card>
      )}
      
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <BarChart3 className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold mb-2">통계 분석 진행 중...</h3>
        <p className="text-muted-foreground mb-6">잠시만 기다려주세요</p>
        
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-3">
            {tasks.map((task, index) => {
              const isCompleted = completedTasks.includes(task)
              const isCurrent = currentTask === task
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted" />
                  )}
                  <span className={`text-sm ${
                    isCompleted ? 'text-muted-foreground' : 
                    isCurrent ? 'font-medium' : 'text-muted-foreground/50'
                  }`}>
                    {task}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">📊 분석 정보</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 선택된 방법: {method || '독립표본 t-검정'}</li>
          <li>• 신뢰수준: 95%</li>
          <li>• SciPy 통계 엔진 사용</li>
        </ul>
      </div>
      
      {/* 모든 가정 검정 결과 표시 */}
      {assumptionResults.normality && (
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
          <h4 className="font-medium mb-3">🔍 가정 검정 결과 (자동 수행)</h4>
          <div className="space-y-3 text-sm">
            
            {/* 정규성 검정 */}
            {assumptionResults.normality && (
              <div className="border-l-2 border-blue-400 pl-3">
                <p className="font-medium mb-1">📊 정규성 검정</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>그룹 1 ({assumptionResults.normality.group1?.method}):</span>
                    <span className={assumptionResults.normality.group1?.isNormal ? 'text-green-600' : 'text-orange-600'}>
                      {assumptionResults.normality.group1?.isNormal ? '✓ 만족' : '⚠ 위반'} 
                      (p={assumptionResults.normality.group1?.pValue?.toFixed(4)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>그룹 2 ({assumptionResults.normality.group2?.method}):</span>
                    <span className={assumptionResults.normality.group2?.isNormal ? 'text-green-600' : 'text-orange-600'}>
                      {assumptionResults.normality.group2?.isNormal ? '✓ 만족' : '⚠ 위반'}
                      (p={assumptionResults.normality.group2?.pValue?.toFixed(4)})
                    </span>
                  </div>
                  {assumptionResults.normality.group1?.skewness && (
                    <div className="text-gray-500">
                      왜도: G1={assumptionResults.normality.group1.skewness.toFixed(2)}, 
                      G2={assumptionResults.normality.group2?.skewness?.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 등분산성 검정 */}
            {assumptionResults.homogeneity && (
              <div className="border-l-2 border-blue-400 pl-3">
                <p className="font-medium mb-1">📏 등분산성 검정</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Levene's test:</span>
                    <span className={assumptionResults.homogeneity.isHomogeneous ? 'text-green-600' : 'text-orange-600'}>
                      {assumptionResults.homogeneity.isHomogeneous ? '✓ 만족' : '⚠ 위반'}
                      (p={assumptionResults.homogeneity.levene?.pValue?.toFixed(4)})
                    </span>
                  </div>
                  {assumptionResults.homogeneity.varianceRatio && (
                    <div className="text-gray-500">
                      분산비: {assumptionResults.homogeneity.varianceRatio.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 이상치 검정 */}
            {assumptionResults.outliers && (
              <div className="border-l-2 border-blue-400 pl-3">
                <p className="font-medium mb-1">🔴 이상치 탐지</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>그룹 1:</span>
                    <span className={assumptionResults.outliers.group1?.hasOutliers ? 'text-orange-600' : 'text-green-600'}>
                      {assumptionResults.outliers.group1?.iqrMethod || 0}개 발견
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>그룹 2:</span>
                    <span className={assumptionResults.outliers.group2?.hasOutliers ? 'text-orange-600' : 'text-green-600'}>
                      {assumptionResults.outliers.group2?.iqrMethod || 0}개 발견
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 표본 크기 및 검정력 */}
            {assumptionResults.sampleSize && (
              <div className="border-l-2 border-blue-400 pl-3">
                <p className="font-medium mb-1">📈 표본 크기 및 검정력</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>표본 크기:</span>
                    <span className={assumptionResults.sampleSize.isAdequate ? 'text-green-600' : 'text-orange-600'}>
                      n1={assumptionResults.sampleSize.group1Size}, n2={assumptionResults.sampleSize.group2Size}
                    </span>
                  </div>
                  {assumptionResults.sampleSize.estimatedPower && (
                    <div className="flex justify-between">
                      <span>검정력:</span>
                      <span>{(assumptionResults.sampleSize.estimatedPower * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  {assumptionResults.sampleSize.cohensD > 0 && (
                    <div className="flex justify-between">
                      <span>효과크기 (Cohen's d):</span>
                      <span>{assumptionResults.sampleSize.cohensD.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 독립성 검정 (회귀분석) */}
            {assumptionResults.independence && (
              <div className="border-l-2 border-blue-400 pl-3">
                <p className="font-medium mb-1">🔗 독립성 검정</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Durbin-Watson:</span>
                    <span className={assumptionResults.independence.isIndependent ? 'text-green-600' : 'text-orange-600'}>
                      {assumptionResults.independence.durbinWatson?.toFixed(3)}
                      {assumptionResults.independence.isIndependent ? ' ✓' : ' ⚠'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 선형성 검정 (상관/회귀) */}
            {assumptionResults.linearity && (
              <div className="border-l-2 border-blue-400 pl-3">
                <p className="font-medium mb-1">📉 선형성 검정</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>선형 관계:</span>
                    <span className={assumptionResults.linearity.isLinear ? 'text-green-600' : 'text-orange-600'}>
                      {assumptionResults.linearity.isLinear ? '✓ 있음' : '⚠ 약함'}
                      (R²={assumptionResults.linearity.rSquared?.toFixed(3)})
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 종합 권장사항 */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="font-medium text-xs mb-1">💡 권장사항</p>
              <div className="space-y-1">
                {assumptionResults.normality && 
                 (!assumptionResults.normality.group1?.isNormal || !assumptionResults.normality.group2?.isNormal) && (
                  <p className="text-xs text-orange-600">
                    • 정규성 위반 → Mann-Whitney U test 등 비모수 검정 고려
                  </p>
                )}
                {assumptionResults.homogeneity && !assumptionResults.homogeneity.isHomogeneous && (
                  <p className="text-xs text-orange-600">
                    • 등분산성 위반 → Welch's t-test 자동 적용됨
                  </p>
                )}
                {assumptionResults.outliers && 
                 (assumptionResults.outliers.group1?.hasOutliers || assumptionResults.outliers.group2?.hasOutliers) && (
                  <p className="text-xs text-orange-600">
                    • 이상치 발견 → 제거 또는 로버스트 방법 고려
                  </p>
                )}
                {assumptionResults.sampleSize && !assumptionResults.sampleSize.isAdequate && (
                  <p className="text-xs text-orange-600">
                    • 표본 크기 부족 → 더 많은 데이터 수집 권장
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}