'use client'

import { useState, useCallback } from 'react'
import { Upload, AlertCircle, Loader2, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'
import { DataValidationService, DATA_LIMITS } from '@/lib/services/data-validation-service'
import { LargeFileProcessor, ProcessingProgress } from '@/lib/services/large-file-processor'
import { DataRow } from '@/types/smart-flow'

interface DataUploadStepProps {
  onUploadComplete: (file: File, data: DataRow[]) => void
}

// 안전한 인코딩 감지 및 변환 함수
async function detectAndConvertEncoding(file: File): Promise<string> {
  const MAX_NON_UTF8_SIZE = 10 * 1024 * 1024 // 10MB

  try {
    // 파일 크기 체크 (보안)
    if (file.size > MAX_NON_UTF8_SIZE) {
      // 큰 파일은 UTF-8만 허용
      const text = await file.text()

      // BOM 체크 및 제거
      if (text.charCodeAt(0) === 0xFEFF) {
        return text.slice(1)
      }

      // 한글 깨짐 감지
      if (text.includes('�') || /[\uFFFD]/.test(text)) {
        throw new Error('대용량 파일은 UTF-8 인코딩을 사용해야 합니다.')
      }

      return text
    }

    // 작은 파일의 경우 인코딩 감지
    let text = await file.text()

    // BOM 체크 및 제거
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1)
    }

    // 한글 깨짐 감지 (EUC-KR 가능성)
    if (text.includes('�') || /[\uFFFD]/.test(text)) {
      // EUC-KR로 재시도 (fatal: true로 엄격한 디코딩)
      const buffer = await file.arrayBuffer()
      const decoder = new TextDecoder('euc-kr', { fatal: true })

      try {
        text = decoder.decode(buffer)
      } catch {
        // EUC-KR 실패 시 오류 발생
        throw new Error('파일 인코딩을 감지할 수 없습니다. UTF-8 또는 EUC-KR 인코딩을 사용해주세요.')
      }
    }

    return text
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('인코딩 변환 중 오류가 발생했습니다.')
  }
}

// Excel 파일 처리 함수
async function processExcelFile(file: File): Promise<DataRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, {
          type: 'binary',
          cellDates: true, // 날짜 자동 처리
          cellNF: false,
          cellText: false,
          raw: false // 서식 적용된 값 사용
        })

        // 첫 번째 시트 가져오기
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // JSON으로 변환 (헤더 포함)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // 첫 행을 헤더로 사용
          defval: null, // 빈 셀을 null로
          blankrows: false, // 빈 행 제거
          raw: false // 서식 적용된 값 사용
        }) as any[][]

        if (jsonData.length < 2) {
          reject(new Error('데이터가 없거나 헤더만 있습니다'))
          return
        }

        // 헤더와 데이터 분리
        const headers = jsonData[0] as string[]
        const rows = jsonData.slice(1)

        // 객체 배열로 변환
        const dataRows: DataRow[] = rows.map(row => {
          const obj: DataRow = {}
          headers.forEach((header, index) => {
            if (header) {
              // 값 정제
              let value = row[index]

              // Excel 날짜 처리 (안전하게)
              if (value instanceof Date) {
                if (isNaN(value.getTime())) {
                  value = null // 유효하지 않은 날짜
                } else {
                  value = value.toISOString().split('T')[0] // YYYY-MM-DD 형식
                }
              }
              // 숫자 문자열 처리
              else if (typeof value === 'string') {
                // 쉼표 제거 (천단위 구분)
                value = value.replace(/,/g, '')
                // 퍼센트 처리
                if (value.endsWith('%')) {
                  value = parseFloat(value) / 100
                }
              }

              obj[String(header).trim()] = value ?? null
            }
          })
          return obj
        })

        // 빈 행 필터링
        const filteredRows = dataRows.filter(row =>
          Object.values(row).some(v => v !== null && v !== undefined && v !== '')
        )

        resolve(filteredRows)
      } catch (error) {
        reject(new Error(`Excel 파일 처리 실패: ${error}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'))
    }

    reader.readAsBinaryString(file)
  })
}

// CSV 파일 처리 함수 (인코딩 지원)
async function processCSVFile(file: File, onProgress?: (progress: ProcessingProgress) => void): Promise<DataRow[]> {
  // 인코딩 감지 및 변환
  const text = await detectAndConvertEncoding(file)

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimitersToGuess: [',', '\t', '|', ';'], // 다양한 구분자 자동 감지
      transformHeader: (header) => header.trim(), // 헤더 공백 제거
      transform: (value) => {
        // 값 정제
        if (typeof value === 'string') {
          value = value.trim()
          // 빈 문자열을 null로
          if (value === '' || value === 'NA' || value === 'N/A' || value === 'null') {
            return null
          }
          // 숫자 문자열 처리
          if (/^-?\d+(\.\d+)?$/.test(value.replace(/,/g, ''))) {
            return parseFloat(value.replace(/,/g, ''))
          }
        }
        return value
      },
      complete: (result) => {
        if (result.errors.length > 0) {
          // 치명적 오류만 처리
          const criticalErrors = result.errors.filter(e => e.type === 'Quotes' || e.type === 'FieldMismatch')
          if (criticalErrors.length > 0) {
            reject(new Error(`CSV 파싱 오류: ${criticalErrors[0].message}`))
            return
          }
        }

        const dataRows = result.data as DataRow[]

        // 빈 행 필터링
        const filteredRows = dataRows.filter(row =>
          Object.values(row).some(v => v !== null && v !== undefined && v !== '')
        )

        resolve(filteredRows)
      },
      error: (error) => {
        reject(new Error(`CSV 파일 처리 실패: ${error.message}`))
      }
    })
  })
}

export function DataUploadStepImproved({ onUploadComplete }: DataUploadStepProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [memoryWarning, setMemoryWarning] = useState(false)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; type: string } | null>(null)

  const handleFileProcess = useCallback(async (file: File) => {
    setIsUploading(true)
    setError(null)
    setProgress(null)
    setMemoryWarning(false)

    // 파일 정보 저장
    setFileInfo({
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.name.split('.').pop()?.toUpperCase() || 'Unknown'
    })

    try {
      // 파일 크기 검증
      if (file.size > DATA_LIMITS.MAX_FILE_SIZE) {
        throw new Error(`파일이 너무 큽니다. 최대 ${DATA_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB까지 가능합니다.`)
      }

      let dataRows: DataRow[] = []

      // Excel 파일 처리
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        toast.info('Excel 파일 처리 중...', {
          description: '변환 작업을 진행하고 있습니다'
        })

        dataRows = await processExcelFile(file)
      }
      // CSV 파일 처리
      else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // 보안 검증
        const securityCheck = await DataValidationService.validateFileContent(file)
        if (!securityCheck.isValid) {
          throw new Error(securityCheck.error || '파일 보안 검증 실패')
        }

        // 대용량 파일 처리
        if (LargeFileProcessor.isLargeFile(file)) {
          const memoryInfo = LargeFileProcessor.getMemoryInfo()
          if (memoryInfo && memoryInfo.percentage > 70) {
            setMemoryWarning(true)
          }

          dataRows = await LargeFileProcessor.processInChunks(file, {
            chunkSize: 10000,
            maxRows: DATA_LIMITS.MAX_ROWS,
            onProgress: setProgress
          })
        } else {
          dataRows = await processCSVFile(file)
        }
      } else {
        throw new Error('지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일을 업로드해주세요.')
      }

      // 데이터 검증
      if (!dataRows || dataRows.length === 0) {
        throw new Error('파일에 데이터가 없습니다.')
      }

      if (dataRows.length > DATA_LIMITS.MAX_ROWS) {
        throw new Error(`데이터가 너무 많습니다. 최대 ${DATA_LIMITS.MAX_ROWS.toLocaleString()}행까지 가능합니다.`)
      }

      // 컬럼 수 체크
      const columnCount = Object.keys(dataRows[0]).length
      if (columnCount > DATA_LIMITS.MAX_COLS) {
        throw new Error(`변수가 너무 많습니다. 최대 ${DATA_LIMITS.MAX_COLS}개까지 가능합니다.`)
      }

      onUploadComplete(file, dataRows)
      toast.success('파일 업로드 성공', {
        description: `${dataRows.length.toLocaleString()}행, ${columnCount}개 변수를 불러왔습니다`
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '파일 처리 중 오류가 발생했습니다.'
      setError(errorMessage)
      toast.error('파일 처리 실패', { description: errorMessage })
    } finally {
      setIsUploading(false)
      setProgress(null)
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
    maxSize: DATA_LIMITS.MAX_FILE_SIZE
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
        <div className="flex justify-center gap-4 mb-4">
          <FileText className="w-12 h-12 text-muted-foreground" />
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {isDragActive ? '파일을 놓으세요' : '파일을 드래그하거나 클릭하여 업로드'}
        </h3>
        <div className="space-y-1 text-sm text-muted-foreground mb-4">
          <p>지원 형식: CSV, Excel (XLS, XLSX)</p>
          <p>최대: 50MB | 100,000행 × 1,000열</p>
          <p>인코딩: UTF-8, EUC-KR 자동 감지</p>
        </div>
        <Button variant="outline" disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              처리 중...
            </>
          ) : (
            '파일 선택'
          )}
        </Button>
      </div>

      {/* 파일 정보 */}
      {fileInfo && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">📁 파일 정보</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">파일명:</span>
              <p className="font-medium truncate">{fileInfo.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">크기:</span>
              <p className="font-medium">{fileInfo.size}</p>
            </div>
            <div>
              <span className="text-muted-foreground">형식:</span>
              <p className="font-medium">{fileInfo.type}</p>
            </div>
          </div>
        </div>
      )}

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
        </div>
      )}

      {/* 메모리 경고 */}
      {memoryWarning && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">메모리 사용량 높음</p>
              <p className="text-xs text-muted-foreground">
                대용량 파일 처리 중입니다. 다른 탭을 닫으면 더 빠르게 처리됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 지원 기능 안내 */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
            🔄 자동 처리 기능
          </h4>
          <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
            <li>• 인코딩 자동 감지 (UTF-8, EUC-KR)</li>
            <li>• Excel 날짜 형식 자동 변환</li>
            <li>• 천단위 구분자 제거</li>
            <li>• 결측값 통일 (빈칸, NA, null)</li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">
            ✅ 데이터 검증
          </h4>
          <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
            <li>• 숫자/문자 타입 자동 감지</li>
            <li>• 혼합 데이터 타입 경고</li>
            <li>• 이상치 자동 탐지</li>
            <li>• 보안 위협 차단</li>
          </ul>
        </div>
      </div>
    </div>
  )
}