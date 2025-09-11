'use client'

import { useState, useEffect } from 'react'
import DecisionEngine from '@/lib/intelligence/decision-engine'
import type PyodideManager from '@/lib/pyodide/manager'

interface AutoFlowProps {
  data: any
  pyodide: PyodideManager
}

interface Step {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  result?: any
  error?: string
}

export default function AutoFlow({ data, pyodide }: AutoFlowProps) {
  const [steps, setSteps] = useState<Step[]>([
    { id: 'validation', name: '데이터 검증', status: 'pending' },
    { id: 'assumptions', name: '가정 검정', status: 'pending' },
    { id: 'recommendation', name: '방법 추천', status: 'pending' },
    { id: 'analysis', name: '통계 분석', status: 'pending' },
    { id: 'posthoc', name: '사후 분석', status: 'pending' },
    { id: 'results', name: '결과 생성', status: 'pending' }
  ])
  
  const [currentStep, setCurrentStep] = useState(0)
  const [results, setResults] = useState<any>(null)
  const [confirmDialog, setConfirmDialog] = useState<any>(null)
  const [isPaused, setIsPaused] = useState(false)
  
  const engine = new DecisionEngine(pyodide)
  
  useEffect(() => {
    if (!isPaused && currentStep < steps.length) {
      runNextStep()
    }
  }, [currentStep, isPaused])
  
  const runNextStep = async () => {
    const step = steps[currentStep]
    
    // Update step status
    setSteps(prev => prev.map((s, i) => 
      i === currentStep ? { ...s, status: 'running' } : s
    ))
    
    try {
      let result: any = null
      
      switch (step.id) {
        case 'validation':
          result = await engine.validateData(data)
          break
          
        case 'assumptions':
          result = await engine.testAssumptions(data)
          
          // In auto mode, automatically choose the first option if confirmation needed
          if (result.needsConfirmation && result.options && result.options.length > 0) {
            // Log the decision for transparency
            console.log('가정 검정 결과:', result.message)
            console.log('자동 선택:', result.options[0])
            
            // Auto-select the first option (usually the most conservative choice)
            result.userChoice = result.options[0]
            result.autoSelected = true
          }
          break
          
        case 'recommendation':
          const assumptionResult = steps.find(s => s.id === 'assumptions')?.result
          result = await engine.recommendMethod(data, assumptionResult)
          
          // In auto mode, automatically use the recommended method
          console.log('추천 방법:', result.method, `(신뢰도: ${result.confidence}%)`)
          console.log('추천 이유:', result.reasoning)
          result.confirmed = true
          result.autoSelected = true
          break
          
        case 'analysis':
          const method = steps[2].result?.method || 'anova'
          result = await engine.runAnalysis(method, data)
          break
          
        case 'posthoc':
          if (steps[3].result?.needsPostHoc) {
            result = await engine.runPostHoc(steps[3].result, data)
          } else {
            result = { skipped: true, reason: '사후분석 불필요' }
          }
          break
          
        case 'results':
          result = engine.generateResults(steps)
          setResults(result)
          break
      }
      
      proceedToNext(result)
      
    } catch (error) {
      setSteps(prev => prev.map((s, i) => 
        i === currentStep ? { ...s, status: 'error', error: (error as Error).message } : s
      ))
      setIsPaused(true)
    }
  }
  
  const proceedToNext = (result: any) => {
    setSteps(prev => prev.map((s, i) => 
      i === currentStep ? { ...s, status: 'completed', result } : s
    ))
    setCurrentStep(prev => prev + 1)
    setIsPaused(false)
    setConfirmDialog(null)
  }
  
  const retry = () => {
    setSteps(prev => prev.map((s, i) => 
      i === currentStep ? { ...s, status: 'pending', error: undefined } : s
    ))
    setIsPaused(false)
    runNextStep()
  }
  
  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="glass-effect rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">자동 분석 진행 중</h2>
        
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-4">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step.status === 'completed' ? 'bg-green-500 text-white' :
                  step.status === 'running' ? 'bg-blue-500 text-white animate-pulse' :
                  step.status === 'error' ? 'bg-red-500 text-white' :
                  'bg-gray-200 text-gray-600'}
              `}>
                {step.status === 'completed' ? '✓' :
                 step.status === 'error' ? '✗' :
                 index + 1}
              </div>
              
              <div className="flex-1">
                <p className={`font-medium ${
                  step.status === 'running' ? 'text-blue-600' :
                  step.status === 'completed' ? 'text-green-600' :
                  step.status === 'error' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {step.name}
                </p>
                {step.error && (
                  <p className="text-sm text-red-500 mt-1">{step.error}</p>
                )}
                {step.result?.autoSelected && step.result?.userChoice && (
                  <p className="text-xs text-gray-500 mt-1">
                    자동 선택: {step.result.userChoice}
                  </p>
                )}
                {step.result?.method && step.status === 'completed' && (
                  <p className="text-xs text-gray-500 mt-1">
                    방법: {step.result.method}
                  </p>
                )}
              </div>
              
              {step.status === 'running' && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
            </div>
          ))}
        </div>
        
        {/* Control Buttons */}
        <div className="mt-6 flex space-x-3">
          {isPaused && !confirmDialog && (
            <>
              <button
                onClick={() => setIsPaused(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                계속
              </button>
              {steps[currentStep]?.status === 'error' && (
                <button
                  onClick={retry}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  재시도
                </button>
              )}
            </>
          )}
          
          {!isPaused && currentStep < steps.length && (
            <button
              onClick={() => setIsPaused(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              일시정지
            </button>
          )}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="glass-effect rounded-lg p-6 border-2 border-blue-200">
          <h3 className="text-lg font-semibold mb-3">{confirmDialog.title}</h3>
          <p className="text-gray-700 mb-4">{confirmDialog.message}</p>
          {confirmDialog.details && (
            <div className="bg-gray-50 rounded p-3 mb-4">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {confirmDialog.details}
              </pre>
            </div>
          )}
          <div className="flex space-x-3">
            {confirmDialog.options.map((option: string) => (
              <button
                key={option}
                onClick={() => confirmDialog.onConfirm(option)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Results Display */}
      {results && (
        <div className="glass-effect rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">분석 결과</h3>
          <div className="space-y-4">
            {/* Result summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-800">분석 완료</p>
              <p className="text-sm text-green-600 mt-1">
                {results.summary}
              </p>
            </div>
            
            {/* Detailed results */}
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(results.details, null, 2)}
              </pre>
            </div>
            
            {/* Export options */}
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Excel 다운로드
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                PDF 보고서
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}