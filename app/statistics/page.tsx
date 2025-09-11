'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import DataUpload from './components/DataUpload'
import DataValidation from './components/DataValidation'
import AutoFlow from './components/AutoFlow'
import ManualFlow from './components/ManualFlow'
import PyodideManager from '@/lib/pyodide/manager'

export default function StatisticsPage() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'auto' | 'manual'>(
    (searchParams.get('mode') as 'auto' | 'manual') || 'auto'
  )
  const [data, setData] = useState<any>(null)
  const [validatedData, setValidatedData] = useState<any>(null)
  const [pyodide, setPyodide] = useState<PyodideManager | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ stage: '', progress: 0, message: '' })
  
  // Initialize Pyodide
  useEffect(() => {
    const initPyodide = async () => {
      setLoading(true)
      try {
        const manager = PyodideManager.getInstance()
        
        manager.onProgress = (stage, progress, message) => {
          setProgress({ stage, progress, message })
        }
        
        await manager.initialize(true) // Use Web Worker
        setPyodide(manager)
      } catch (error) {
        console.error('Failed to initialize Pyodide:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initPyodide()
    
    return () => {
      // Cleanup
      const manager = PyodideManager.getInstance()
      manager.destroy()
    }
  }, [])
  
  const handleDataLoad = (loadedData: any) => {
    setData(loadedData)
  }
  
  const handleValidation = (validated: any) => {
    setValidatedData(validated)
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="glass-effect rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">통계 분석</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">분석 모드:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('manual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'manual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                수동
              </button>
              <button
                onClick={() => setMode('auto')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'auto'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                자동
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading Pyodide */}
      {loading && (
        <div className="glass-effect rounded-lg p-8 mb-6">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-semibold mb-2">통계 엔진 로딩 중...</p>
            <p className="text-sm text-gray-600">{progress.message}</p>
            <div className="mt-4 bg-gray-200 rounded-full h-2 max-w-md mx-auto">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      {!loading && pyodide && (
        <>
          {/* Step 1: Data Upload */}
          {!data && (
            <DataUpload onDataLoad={handleDataLoad} />
          )}
          
          {/* Step 2: Data Validation */}
          {data && !validatedData && (
            <DataValidation 
              data={data} 
              pyodide={pyodide}
              onValidated={handleValidation}
            />
          )}
          
          {/* Step 3: Analysis Flow */}
          {validatedData && (
            mode === 'auto' ? (
              <AutoFlow 
                data={validatedData} 
                pyodide={pyodide}
              />
            ) : (
              <ManualFlow 
                data={validatedData}
                pyodide={pyodide}
              />
            )
          )}
        </>
      )}
      
      {/* Error State */}
      {!loading && !pyodide && (
        <div className="glass-effect rounded-lg p-8 text-center">
          <p className="text-red-600 mb-4">통계 엔진 로딩 실패</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  )
}