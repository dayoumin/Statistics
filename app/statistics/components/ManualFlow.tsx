'use client'

import { useState, useEffect } from 'react'
import type PyodideManager from '@/lib/pyodide/manager'

// Analysis Results Component
function AnalysisResults({ data, method, pyodide }: { 
  data: any, 
  method: string, 
  pyodide: PyodideManager 
}) {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const runAnalysis = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get the data in the right format
        const analysisData = prepareDataForAnalysis(data, method)
        
        // Run the analysis
        const result = await pyodide.runAnalysis(method, analysisData)
        setResults(result)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    
    runAnalysis()
  }, [data, method, pyodide])
  
  const prepareDataForAnalysis = (data: any, method: string) => {
    // For t-test and ANOVA, we need groups
    if (method === 't-test' || method === 'anova') {
      // If data already has Group column, use it
      if (data.Group) {
        return data
      }
      // Otherwise, create groups from the data
      const values = data.Value || Object.values(data)[0]
      if (Array.isArray(values)) {
        // Split data into two groups for t-test
        const mid = Math.floor(values.length / 2)
        return {
          group1: values.slice(0, mid),
          group2: values.slice(mid)
        }
      }
    }
    // For correlation/regression, we need X and Y
    else if (method === 'correlation' || method === 'regression') {
      // Check if we have X and Y columns
      if (data.X && data.Y) {
        return data
      }
      // Otherwise use first two numeric columns
      const numericColumns = Object.keys(data).filter(key => {
        const values = data[key]
        return Array.isArray(values) && values.some(v => typeof v === 'number')
      })
      if (numericColumns.length >= 2) {
        return {
          x: data[numericColumns[0]],
          y: data[numericColumns[1]]
        }
      }
    }
    
    return data
  }
  
  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">분석 중...</p>
        <div className="mt-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">오류: {error}</p>
      </div>
    )
  }
  
  if (!results) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-800">결과가 없습니다</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 font-medium">분석 완료</p>
        <p className="text-sm text-gray-600 mt-1">
          선택한 방법: {method}
        </p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">통계 결과</h4>
        <div className="space-y-2 text-sm">
          {results.p_value !== undefined && (
            <div>
              <span className="font-medium">p-value:</span> {results.p_value?.toFixed(4)}
            </div>
          )}
          {results.statistic !== undefined && (
            <div>
              <span className="font-medium">통계량:</span> {results.statistic?.toFixed(4)}
            </div>
          )}
          {results.mean !== undefined && (
            <div>
              <span className="font-medium">평균:</span> {results.mean?.toFixed(2)}
            </div>
          )}
          {results.std !== undefined && (
            <div>
              <span className="font-medium">표준편차:</span> {results.std?.toFixed(2)}
            </div>
          )}
          {results.correlation !== undefined && (
            <div>
              <span className="font-medium">상관계수:</span> {results.correlation?.toFixed(4)}
            </div>
          )}
          {results.r_squared !== undefined && (
            <div>
              <span className="font-medium">R²:</span> {results.r_squared?.toFixed(4)}
            </div>
          )}
        </div>
      </div>
      
      {results.p_value !== undefined && (
        <div className={`rounded-lg p-4 ${
          results.p_value < 0.05 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <p className={`font-medium ${
            results.p_value < 0.05 ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {results.p_value < 0.05 
              ? '✅ 통계적으로 유의합니다 (p < 0.05)' 
              : '⚠️ 통계적으로 유의하지 않습니다 (p ≥ 0.05)'}
          </p>
        </div>
      )}
      
      <div className="flex space-x-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Excel 다운로드
        </button>
        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
          보고서 생성
        </button>
      </div>
    </div>
  )
}

interface ManualFlowProps {
  data: any
  pyodide: PyodideManager
}

export default function ManualFlow({ data, pyodide }: ManualFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedMethod, setSelectedMethod] = useState('')
  
  const methods = [
    { id: 't-test', name: 'T-test', description: '두 그룹 평균 비교' },
    { id: 'anova', name: 'ANOVA', description: '세 그룹 이상 평균 비교' },
    { id: 'correlation', name: '상관분석', description: '변수 간 관계 분석' },
    { id: 'regression', name: '회귀분석', description: '예측 모델 구축' },
    { id: 'chi-square', name: '카이제곱 검정', description: '범주형 데이터 분석' }
  ]
  
  return (
    <div className="glass-effect rounded-lg p-8">
      <h2 className="text-xl font-semibold mb-6">수동 분석 모드</h2>
      
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map(step => (
          <div
            key={step}
            className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}
          >
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'}
              `}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Content based on step */}
      {currentStep === 1 && (
        <div>
          <h3 className="font-medium mb-4">분석 방법 선택</h3>
          <div className="grid grid-cols-2 gap-3">
            {methods.map(method => (
              <button
                key={method.id}
                onClick={() => {
                  setSelectedMethod(method.id)
                  setCurrentStep(2)
                }}
                className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-gray-600">{method.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {currentStep === 2 && (
        <div>
          <h3 className="font-medium mb-4">변수 선택</h3>
          <p className="text-gray-600 mb-4">
            {selectedMethod} 분석을 위한 변수를 선택하세요
          </p>
          <div className="space-y-3">
            {data.headers?.map((header: string) => (
              <label key={header} className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>{header}</span>
              </label>
            ))}
          </div>
          <button
            onClick={() => setCurrentStep(3)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다음
          </button>
        </div>
      )}
      
      {currentStep === 3 && (
        <div>
          <h3 className="font-medium mb-4">옵션 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                유의수준
              </label>
              <select className="w-full p-2 border rounded">
                <option>0.05</option>
                <option>0.01</option>
                <option>0.001</option>
              </select>
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                사후분석 수행
              </label>
            </div>
          </div>
          <button
            onClick={() => setCurrentStep(4)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            분석 실행
          </button>
        </div>
      )}
      
      {currentStep === 4 && (
        <div>
          <h3 className="font-medium mb-4">분석 결과</h3>
          <AnalysisResults 
            data={data} 
            method={selectedMethod} 
            pyodide={pyodide}
          />
        </div>
      )}
    </div>
  )
}