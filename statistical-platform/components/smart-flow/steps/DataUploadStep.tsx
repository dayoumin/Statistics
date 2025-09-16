'use client'

import { useState, useCallback } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { cn } from '@/lib/utils'

interface DataUploadStepProps {
  onUploadComplete: (file: File, data: any[]) => void
}

export function DataUploadStep({ onUploadComplete }: DataUploadStepProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileProcess = useCallback((file: File) => {
    setIsUploading(true)
    setError(null)

    // 파일 크기 제한 (50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_FILE_SIZE) {
      setError(`파일이 너무 큽니다. 최대 50MB까지 업로드 가능합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      setIsUploading(false)
      return
    }

    // 파일 크기 경고 (10MB 이상)
    const WARN_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > WARN_FILE_SIZE) {
      console.warn(`파일 크기가 ${(file.size / 1024 / 1024).toFixed(1)}MB입니다. 처리 시간이 길어질 수 있습니다.`)
    }

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (result) => {
          if (result.errors.length > 0) {
            setError('CSV 파일 파싱 중 오류가 발생했습니다.')
            setIsUploading(false)
            return
          }
          
          // 데이터 크기 사전 검증
          const dataRows = result.data as any[]
          if (dataRows.length > 100000) {
            setError(`데이터가 너무 많습니다. 최대 100,000행까지 처리 가능합니다. (현재: ${dataRows.length.toLocaleString()}행)`)
            setIsUploading(false)
            return
          }
          
          onUploadComplete(file, dataRows)
          setIsUploading(false)
        },
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        error: (error) => {
          setError(`파일 읽기 오류: ${error.message}`)
          setIsUploading(false)
        }
      })
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setError('Excel 파일 지원은 준비 중입니다. CSV 파일을 사용해주세요.')
      setIsUploading(false)
    } else {
      setError('지원하지 않는 파일 형식입니다. CSV 파일을 업로드해주세요.')
      setIsUploading(false)
    }
  }, [onUploadComplete])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileProcess(acceptedFiles[0])
    }
  }, [handleFileProcess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024 // 100MB
  })

  return (
    <div className="space-y-6">
      <div 
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          {isDragActive ? '파일을 놓으세요' : '파일을 드래그하거나 클릭하여 업로드'}
        </h3>
        <div className="space-y-1 text-sm text-muted-foreground mb-4">
          <p>최대 파일 크기: 50MB | 최대 데이터: 100,000행</p>
          <p>지원 형식: CSV (Excel은 CSV로 변환 필요)</p>
        </div>
        <Button variant="outline" disabled={isUploading}>
          {isUploading ? '업로드 중...' : '파일 선택'}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">💡 도움말</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 첫 번째 행은 변수명(헤더)이어야 합니다</li>
          <li>• 최대 파일 크기: 100MB</li>
          <li>• 숫자 데이터는 소수점을 포함할 수 있습니다</li>
          <li>• 결측값은 빈 셀로 표시해주세요</li>
        </ul>
      </div>
    </div>
  )
}