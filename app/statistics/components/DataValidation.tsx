'use client'

import { useState, useEffect } from 'react'
import { DataHandler, DataValidation as ValidationResult } from '@/lib/data/handler'
import type PyodideManager from '@/lib/pyodide/manager'

interface DataValidationProps {
  data: any
  pyodide: PyodideManager
  onValidated: (data: any) => void
}

export default function DataValidation({ data, pyodide, onValidated }: DataValidationProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [descriptiveStats, setDescriptiveStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    validateData()
  }, [data])
  
  const validateData = async () => {
    setLoading(true)
    try {
      // Use DataHandler for validation
      const validationResult = DataHandler.validateData(data)
      setValidation(validationResult)
      
      // Calculate descriptive statistics for numeric columns
      const stats: any = {}
      for (const col of validationResult.numericColumns) {
        const values = data[col].filter((v: any) => v !== null && !isNaN(Number(v))).map(Number)
        if (values.length > 0) {
          stats[col] = DataHandler.calculateDescriptiveStats(values)
        }
      }
      setDescriptiveStats(stats)
      
      // Detect groups
      const groups = DataHandler.detectGroups(data, validationResult.groupColumns[0])
      
      if (validationResult.isValid) {
        onValidated({
          ...data,
          metadata: {
            numericColumns: validationResult.numericColumns,
            groupColumns: validationResult.groupColumns,
            textColumns: validationResult.textColumns,
            groups,
            stats
          }
        })
      }
    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleMissingValues = async (method: 'drop' | 'mean' | 'median') => {
    setLoading(true)
    try {
      const cleanedData = DataHandler.handleMissingValues(data, method)
      // Re-validate with cleaned data
      const validationResult = DataHandler.validateData(cleanedData)
      setValidation(validationResult)
      
      if (validationResult.isValid) {
        onValidated({
          ...cleanedData,
          metadata: {
            numericColumns: validationResult.numericColumns,
            groupColumns: validationResult.groupColumns,
            textColumns: validationResult.textColumns,
            missingValuesHandled: method
          }
        })
      }
    } catch (error) {
      console.error('Error handling missing values:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">데이터 검증 중...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="glass-effect rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">데이터 검증 결과</h2>
      
      {/* Data Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600">행 수</p>
          <p className="text-2xl font-bold">
            {data[Object.keys(data)[0]]?.length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600">열 수</p>
          <p className="text-2xl font-bold">{Object.keys(data).length}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600">숫자형 변수</p>
          <p className="text-2xl font-bold">{validation?.numericColumns?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600">범주형 변수</p>
          <p className="text-2xl font-bold">{validation?.groupColumns?.length || 0}</p>
        </div>
      </div>
      
      {/* Missing Values */}
      {validation && Object.keys(validation.missingValues).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">결측치 발견</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            {Object.entries(validation.missingValues).map(([col, count]) => (
              <div key={col} className="text-sm">
                <span className="font-medium">{col}:</span> {count}개
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleMissingValues('drop')}
              className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              행 제거
            </button>
            <button
              onClick={() => handleMissingValues('mean')}
              className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              평균값 대체
            </button>
            <button
              onClick={() => handleMissingValues('median')}
              className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              중앙값 대체
            </button>
          </div>
        </div>
      )}
      
      {/* Descriptive Statistics */}
      {descriptiveStats && Object.keys(descriptiveStats).length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">기술통계</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">변수</th>
                  <th className="px-4 py-2 text-right">평균</th>
                  <th className="px-4 py-2 text-right">중앙값</th>
                  <th className="px-4 py-2 text-right">표준편차</th>
                  <th className="px-4 py-2 text-right">최소</th>
                  <th className="px-4 py-2 text-right">최대</th>
                  <th className="px-4 py-2 text-right">N</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(descriptiveStats).map(([col, stats]: [string, any]) => (
                  <tr key={col} className="border-t">
                    <td className="px-4 py-2 font-medium">{col}</td>
                    <td className="px-4 py-2 text-right">{stats.mean.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{stats.median.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{stats.std.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{stats.min.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{stats.max.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{stats.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Validation Issues */}
      {validation?.issues && validation.issues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">검증 이슈</h3>
          <ul className="list-disc list-inside text-sm text-red-700">
            {validation.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Validation Status */}
      {validation?.isValid ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">✓ 데이터 검증 완료. 분석을 진행할 수 있습니다.</p>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">✗ 데이터 검증 실패. 위의 이슈를 확인해주세요.</p>
        </div>
      )}
    </div>
  )
}