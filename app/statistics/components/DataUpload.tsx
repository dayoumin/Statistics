'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface DataUploadProps {
  onDataLoad: (data: any) => void
}

export default function DataUpload({ onDataLoad }: DataUploadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    // Create column-based data structure for DataHandler
    const columnData: any = {}
    headers.forEach(header => {
      columnData[header] = []
    })
    
    // Parse rows and populate columns
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      headers.forEach((header, index) => {
        const value = values[index]
        // Try to parse as number
        const num = parseFloat(value)
        columnData[header].push(isNaN(num) ? value : num)
      })
    }
    
    return columnData
  }
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const file = acceptedFiles[0]
      if (!file) {
        throw new Error('파일이 선택되지 않았습니다')
      }
      
      const text = await file.text()
      const parsedData = parseCSV(text)
      
      onDataLoad(parsedData)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [onDataLoad])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  })
  
  // Sample data generator
  const loadSampleData = (type: string) => {
    let sampleData: any = null
    
    switch (type) {
      case 'two-groups':
        sampleData = {
          Group: [
            ...Array(30).fill('Control'),
            ...Array(30).fill('Treatment')
          ],
          Value: [
            ...Array(30).fill(0).map(() => 100 + Math.random() * 20),
            ...Array(30).fill(0).map(() => 110 + Math.random() * 20)
          ]
        }
        break
        
      case 'multiple-groups':
        sampleData = {
          Group: [
            ...Array(20).fill('A'),
            ...Array(20).fill('B'),
            ...Array(20).fill('C')
          ],
          Value: [
            ...Array(20).fill(0).map(() => 100 + Math.random() * 15),
            ...Array(20).fill(0).map(() => 105 + Math.random() * 15),
            ...Array(20).fill(0).map(() => 110 + Math.random() * 15)
          ]
        }
        break
        
      case 'correlation':
        const n = 50
        const xValues = Array(n).fill(0).map(() => Math.random() * 100)
        const yValues = xValues.map(x => 2 * x + Math.random() * 20 - 10)
        sampleData = {
          X: xValues,
          Y: yValues
        }
        break
    }
    
    if (sampleData) {
      onDataLoad(sampleData)
    }
  }
  
  return (
    <div className="glass-effect rounded-lg p-8">
      <h2 className="text-xl font-semibold mb-6">1단계: 데이터 업로드</h2>
      
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        
        {loading ? (
          <p className="text-gray-600">파일 처리 중...</p>
        ) : isDragActive ? (
          <p className="text-blue-600">파일을 여기에 놓으세요</p>
        ) : (
          <>
            <p className="text-gray-600 mb-2">
              CSV 또는 Excel 파일을 드래그하거나 클릭하여 선택
            </p>
            <p className="text-sm text-gray-500">
              최대 10MB, CSV/XLS/XLSX 형식 지원
            </p>
          </>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {/* Sample Data Options */}
      <div className="mt-8">
        <p className="text-sm text-gray-600 mb-3">또는 샘플 데이터로 시작:</p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => loadSampleData('two-groups')}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
          >
            <span className="block font-medium">두 그룹 비교</span>
            <span className="text-xs text-gray-500">t-test 예제</span>
          </button>
          <button
            onClick={() => loadSampleData('multiple-groups')}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
          >
            <span className="block font-medium">다중 그룹 비교</span>
            <span className="text-xs text-gray-500">ANOVA 예제</span>
          </button>
          <button
            onClick={() => loadSampleData('correlation')}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
          >
            <span className="block font-medium">상관 분석</span>
            <span className="text-xs text-gray-500">회귀분석 예제</span>
          </button>
        </div>
      </div>
    </div>
  )
}