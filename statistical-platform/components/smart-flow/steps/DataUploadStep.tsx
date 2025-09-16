'use client'

import { useState, useCallback } from 'react'
import { Upload, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { cn } from '@/lib/utils'
import { DataValidationService, DATA_LIMITS } from '@/lib/services/data-validation-service'
import { LargeFileProcessor, ProcessingProgress } from '@/lib/services/large-file-processor'
import { DataRow } from '@/types/smart-flow'

interface DataUploadStepProps {
  onUploadComplete: (file: File, data: DataRow[]) => void
}

export function DataUploadStep({ onUploadComplete }: DataUploadStepProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [memoryWarning, setMemoryWarning] = useState(false)

  const handleFileProcess = useCallback(async (file: File) => {
    setIsUploading(true)
    setError(null)
    setProgress(null)
    setMemoryWarning(false)

    // 파일 크기 검증
    if (file.size > DATA_LIMITS.MAX_FILE_SIZE) {
      const errorMsg = `파일이 너무 큽니다. 최대 ${DATA_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB까지 가능합니다.`
      setError(errorMsg)
      toast.error('파일 크기 초과', {
        description: `현재: ${(file.size / 1024 / 1024).toFixed(1)}MB`
      })
      setIsUploading(false)
      return
    }

    // CSV 파일 처리
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      try {
        // 보안 검증 수행
        const securityCheck = await DataValidationService.validateFileContent(file)
        if (!securityCheck.isValid) {
          const errorMsg = securityCheck.error || '파일 보안 검증에 실패했습니다.'
          setError(errorMsg)
          toast.error('파일 검증 실패', {
            description: errorMsg
          })
          setIsUploading(false)
          return
        }

        // 대용량 파일 여부 확인
        if (LargeFileProcessor.isLargeFile(file)) {
          // 메모리 체크
          const memoryInfo = LargeFileProcessor.getMemoryInfo()
          if (memoryInfo && memoryInfo.percentage > 70) {
            setMemoryWarning(true)
          }

          // 청크 방식으로 처리
          const dataRows = await LargeFileProcessor.processInChunks(file, {
            chunkSize: 10000,
            maxRows: DATA_LIMITS.MAX_ROWS,
            onProgress: (progress) => {
              setProgress(progress)
            },
            onChunk: (_, chunkIndex) => {
              // 메모리 모니터링
              if (chunkIndex % 5 === 0) {
                const mem = LargeFileProcessor.getMemoryInfo()
                if (mem && mem.percentage > 80) {
                  setMemoryWarning(true)
                }
              }
            }
          })

          if (dataRows.length === 0) {
            setError('파일에 데이터가 없습니다.')
            toast.error('데이터 없음', {
              description: '파일에 처리 가능한 데이터가 없습니다'
            })
            setIsUploading(false)
            return
          }

          onUploadComplete(file, dataRows)
          toast.success('파일 업로드 성공', {
            description: `${dataRows.length.toLocaleString()}행의 데이터를 불러왔습니다`
          })
          setIsUploading(false)
          setProgress(null)
        } else {
          // 일반 처리 (작은 파일)
          Papa.parse(file, {
            complete: (result) => {
              if (result.errors.length > 0) {
                const errorMessages = result.errors.map(e => e.message).join(', ')
                setError(`CSV 파싱 오류: ${errorMessages}`)
                setIsUploading(false)
                return
              }

              const dataRows = result.data as DataRow[]
              if (dataRows.length > DATA_LIMITS.MAX_ROWS) {
                const errorMsg = `데이터가 너무 많습니다. 최대 ${DATA_LIMITS.MAX_ROWS.toLocaleString()}행까지 가능합니다.`
                setError(errorMsg)
                toast.error('데이터 크기 초과', {
                  description: `현재: ${dataRows.length.toLocaleString()}행`
                })
                setIsUploading(false)
                return
              }

              if (dataRows.length === 0) {
                setError('파일에 데이터가 없습니다.')
                setIsUploading(false)
                return
              }

              onUploadComplete(file, dataRows)
              toast.success('파일 업로드 성공', {
                description: `${dataRows.length.toLocaleString()}행의 데이터를 불러왔습니다`
              })
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
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '파일 처리 중 오류가 발생했습니다.')
        setIsUploading(false)
        setProgress(null)
      }
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setError('Excel 파일은 CSV로 변환 후 업로드해주세요.')
      toast.warning('Excel 파일 지원 불가', {
        description: 'CSV로 변환 후 업로드해주세요'
      })
      setIsUploading(false)
    } else {
      setError('지원하지 않는 파일 형식입니다.')
      toast.error('지원하지 않는 파일 형식', {
        description: 'CSV 파일을 업로드해주세요'
      })
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

      {/* 진행률 표시 */}
      {progress && isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              처리 중... {progress.processedRows.toLocaleString()} / {progress.totalRows.toLocaleString()}행
            </span>
            <span className="font-medium">{Math.round(progress.percentage)}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
          {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              예상 남은 시간: {progress.estimatedTimeRemaining}초
            </p>
          )}
        </div>
      )}

      {/* 메모리 경고 */}
      {memoryWarning && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              메모리 사용량 높음
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              브라우저 메모리 사용량이 높습니다. 다른 탭을 닫거나 더 작은 데이터셋을 사용해주세요.
            </p>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 대용량 파일 처리 중 메시지 */}
      {isUploading && !progress && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              파일을 분석하고 있습니다...
            </p>
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">💡 도움말</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 첫 번째 행은 변수명(헤더)이어야 합니다</li>
          <li>• 최대 파일 크기: 50MB | 최대 데이터: 100,000행</li>
          <li>• 대용량 파일(5MB+)은 자동으로 청크 단위로 처리됩니다</li>
          <li>• 결측값은 빈 셀로 표시해주세요</li>
        </ul>
      </div>
    </div>
  )
}