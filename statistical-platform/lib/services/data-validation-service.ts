import { ValidationResults, DataRow } from '@/types/smart-flow'

export const DATA_LIMITS = {
  MAX_ROWS: 100000,
  MAX_COLS: 1000,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  WARN_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const

export class DataValidationService {
  /**
   * CSV 파일 내용의 보안 검증
   */
  static async validateFileContent(file: File): Promise<{ isValid: boolean; error?: string }> {
    try {
      // 파일 헤더 읽기 (처음 1KB)
      const headerSlice = file.slice(0, 1024)
      const headerText = await headerSlice.text()

      // 안전한 문자 패턴 검증 (영문, 숫자, 한글, 기본 특수문자)
      const safePattern = /^[a-zA-Z0-9가-힣\s,.\-_"'()[\]{}:;!?@#$%^&*+=\n\r]+$/

      if (!safePattern.test(headerText)) {
        return {
          isValid: false,
          error: '파일에 허용되지 않은 문자가 포함되어 있습니다.'
        }
      }

      // 악성 스크립트 패턴 검사
      const maliciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // onclick, onerror 등
        /<iframe/i,
        /eval\(/i,
        /document\./i,
        /window\./i
      ]

      for (const pattern of maliciousPatterns) {
        if (pattern.test(headerText)) {
          return {
            isValid: false,
            error: '보안상 위험한 내용이 감지되었습니다.'
          }
        }
      }

      return { isValid: true }
    } catch (error) {
      return {
        isValid: false,
        error: '파일 검증 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * 데이터 검증 수행
   */
  static performValidation(data: DataRow[]): ValidationResults {
    const validation: ValidationResults = {
      isValid: true,
      totalRows: 0,
      columnCount: 0,
      missingValues: 0,
      dataType: 'mixed',
      variables: [],
      errors: [],
      warnings: []
    }

    if (!data || data.length === 0) {
      validation.isValid = false
      validation.errors.push('데이터가 없습니다.')
      return validation
    }

    // 행 수 검증
    validation.totalRows = data.length
    if (validation.totalRows > DATA_LIMITS.MAX_ROWS) {
      validation.isValid = false
      validation.errors.push(
        `데이터가 너무 많습니다. 최대 ${DATA_LIMITS.MAX_ROWS.toLocaleString()}행까지 처리 가능합니다. ` +
        `(현재: ${validation.totalRows.toLocaleString()}행)`
      )
      return validation
    }

    // 경고: 큰 데이터셋
    if (validation.totalRows > 10000) {
      validation.warnings.push(
        `데이터가 많습니다 (${validation.totalRows.toLocaleString()}행). 처리 시간이 길어질 수 있습니다.`
      )
    }

    // 열 검증
    const columns = Object.keys(data[0])
    validation.columnCount = columns.length
    validation.variables = columns

    if (validation.columnCount > DATA_LIMITS.MAX_COLS) {
      validation.isValid = false
      validation.errors.push(
        `변수가 너무 많습니다. 최대 ${DATA_LIMITS.MAX_COLS}개까지 처리 가능합니다.`
      )
      return validation
    }

    // 데이터 타입 분석 및 결측값 계산
    const numericColumns: string[] = []
    const categoricalColumns: string[] = []

    columns.forEach(col => {
      const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '')
      const missingCount = data.length - values.length
      validation.missingValues += missingCount

      // 결측값 비율 경고
      const missingRatio = missingCount / data.length
      if (missingRatio > 0.5) {
        validation.warnings.push(`'${col}' 변수의 결측값이 50% 이상입니다.`)
      }

      // 숫자형 변수 판별
      if (values.length > 0 && values.every(v => !isNaN(Number(v)))) {
        numericColumns.push(col)
      } else {
        categoricalColumns.push(col)
      }
    })

    // 데이터 타입 결정
    if (numericColumns.length > 0 && categoricalColumns.length === 0) {
      validation.dataType = '수치형'
    } else if (categoricalColumns.length > 0 && numericColumns.length === 0) {
      validation.dataType = '범주형'
    } else {
      validation.dataType = '혼합형'
    }

    // 통계 분석 가능 여부 검증
    if (numericColumns.length === 0) {
      validation.warnings.push('수치형 변수가 없습니다. 일부 통계 분석이 제한될 수 있습니다.')
    }

    // 최소 데이터 요구사항
    if (validation.totalRows < 3) {
      validation.errors.push('최소 3개 이상의 데이터가 필요합니다.')
      validation.isValid = false
    }

    return validation
  }

  /**
   * 분석용 데이터 정보 추출
   */
  static getDataInfo(data: DataRow[]) {
    if (!data || data.length === 0) return null

    const columns = Object.keys(data[0])
    const numericColumns = columns.filter(col => {
      const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '')
      return values.length > 0 && values.every(v => !isNaN(Number(v)))
    })

    const categoricalColumns = columns.filter(col => {
      const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '')
      return values.length > 0 && !values.every(v => !isNaN(Number(v)))
    })

    return {
      columnCount: columns.length,
      rowCount: data.length,
      hasNumeric: numericColumns.length > 0,
      hasCategorical: categoricalColumns.length > 0,
      numericColumns,
      categoricalColumns
    }
  }
}