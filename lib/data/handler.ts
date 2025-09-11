/**
 * Data Handler Module for Next.js
 * 데이터 파싱 및 처리 기능
 */

export interface DataSet {
  [key: string]: (number | string | null)[]
}

export interface DataValidation {
  numericColumns: string[]
  groupColumns: string[]
  textColumns: string[]
  issues: string[]
  isValid: boolean
  missingValues: {
    [key: string]: number
  }
}

export class DataHandler {
  /**
   * Parse CSV text to data object
   */
  static parseCSV(text: string): DataSet {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      throw new Error('CSV 파일이 비어있습니다')
    }
    
    // Handle different CSV delimiters
    const delimiter = text.includes('\t') ? '\t' : ','
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''))
    
    const data: DataSet = {}
    headers.forEach(header => {
      data[header] = []
    })
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter)
      headers.forEach((header, index) => {
        const value = values[index]?.trim()
        if (!value || value === '' || value === 'NA' || value === 'null') {
          data[header].push(null)
        } else if (!isNaN(Number(value))) {
          data[header].push(parseFloat(value))
        } else {
          data[header].push(value)
        }
      })
    }
    
    return data
  }
  
  /**
   * Parse a single CSV line handling quoted values
   */
  private static parseCSVLine(line: string, delimiter: string): string[] {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    values.push(current)
    return values
  }
  
  /**
   * Validate data and detect column types
   */
  static validateData(data: DataSet): DataValidation {
    const columns = Object.keys(data)
    const validation: DataValidation = {
      numericColumns: [],
      groupColumns: [],
      textColumns: [],
      issues: [],
      isValid: true,
      missingValues: {}
    }
    
    if (columns.length === 0) {
      validation.issues.push('데이터가 없습니다')
      validation.isValid = false
      return validation
    }
    
    const rowCount = data[columns[0]].length
    
    // Check column consistency
    for (const col of columns) {
      if (data[col].length !== rowCount) {
        validation.issues.push(`열 '${col}'의 행 수가 일치하지 않습니다`)
        validation.isValid = false
      }
    }
    
    // Analyze each column
    for (const col of columns) {
      const values = data[col]
      const validValues = values.filter(v => v !== null && v !== undefined && v !== '')
      const missingCount = values.length - validValues.length
      
      if (missingCount > 0) {
        validation.missingValues[col] = missingCount
      }
      
      if (validValues.length === 0) {
        validation.issues.push(`${col}: 모든 값이 비어있음`)
        continue
      }
      
      // Check if numeric
      const numericValues = validValues.filter(v => typeof v === 'number' || !isNaN(Number(v)))
      const numericRatio = numericValues.length / validValues.length
      
      if (numericRatio >= 0.8) {
        // Numeric column
        validation.numericColumns.push(col)
      } else {
        // Check if categorical
        const uniqueValues = [...new Set(validValues)]
        const uniqueRatio = uniqueValues.length / validValues.length
        
        if (uniqueValues.length <= 10 || uniqueRatio < 0.5) {
          // Categorical/Group column
          validation.groupColumns.push(col)
        } else {
          // Text column
          validation.textColumns.push(col)
        }
      }
    }
    
    // Check minimum requirements
    if (validation.numericColumns.length === 0) {
      validation.issues.push('숫자형 변수가 없습니다')
      validation.isValid = false
    }
    
    return validation
  }
  
  /**
   * Detect groups in data
   */
  static detectGroups(data: DataSet, groupColumn?: string): { [key: string]: number[] } {
    const groups: { [key: string]: number[] } = {}
    
    if (groupColumn && data[groupColumn]) {
      // Use specified group column
      const groupValues = data[groupColumn]
      const uniqueGroups = [...new Set(groupValues.filter(v => v !== null))]
      
      uniqueGroups.forEach(group => {
        groups[String(group)] = []
      })
      
      // Find numeric columns
      const numericColumns = Object.keys(data).filter(col => {
        if (col === groupColumn) return false
        const values = data[col].filter(v => v !== null)
        return values.every(v => typeof v === 'number' || !isNaN(Number(v)))
      })
      
      if (numericColumns.length > 0) {
        const valueColumn = numericColumns[0]
        groupValues.forEach((group, index) => {
          if (group !== null && data[valueColumn][index] !== null) {
            groups[String(group)].push(Number(data[valueColumn][index]))
          }
        })
      }
    } else {
      // Auto-detect groups from column names
      Object.keys(data).forEach(col => {
        const values = data[col].filter(v => v !== null && (typeof v === 'number' || !isNaN(Number(v))))
        if (values.length > 0) {
          groups[col] = values.map(v => Number(v))
        }
      })
    }
    
    return groups
  }
  
  /**
   * Calculate descriptive statistics
   */
  static calculateDescriptiveStats(values: number[]): {
    mean: number
    median: number
    std: number
    min: number
    max: number
    q1: number
    q3: number
    iqr: number
    cv: number
    count: number
  } {
    const sorted = [...values].sort((a, b) => a - b)
    const n = sorted.length
    
    const mean = values.reduce((a, b) => a + b, 0) / n
    const median = n % 2 === 0 
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
      : sorted[Math.floor(n / 2)]
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
    const std = Math.sqrt(variance)
    
    const q1 = sorted[Math.floor(n * 0.25)]
    const q3 = sorted[Math.floor(n * 0.75)]
    const iqr = q3 - q1
    
    return {
      mean,
      median,
      std,
      min: sorted[0],
      max: sorted[n - 1],
      q1,
      q3,
      iqr,
      cv: std / mean * 100,
      count: n
    }
  }
  
  /**
   * Handle missing values
   */
  static handleMissingValues(
    data: DataSet, 
    method: 'drop' | 'mean' | 'median' | 'forward' | 'backward' = 'drop'
  ): DataSet {
    const result: DataSet = {}
    
    if (method === 'drop') {
      // Remove rows with any missing values
      const columns = Object.keys(data)
      const rowCount = data[columns[0]].length
      const validRows: number[] = []
      
      for (let i = 0; i < rowCount; i++) {
        const hasNull = columns.some(col => data[col][i] === null || data[col][i] === undefined)
        if (!hasNull) {
          validRows.push(i)
        }
      }
      
      columns.forEach(col => {
        result[col] = validRows.map(i => data[col][i])
      })
    } else if (method === 'mean' || method === 'median') {
      // Fill with mean or median
      Object.keys(data).forEach(col => {
        const values = data[col]
        const numericValues = values.filter(v => v !== null && typeof v === 'number') as number[]
        
        if (numericValues.length > 0) {
          const fillValue = method === 'mean' 
            ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
            : this.calculateDescriptiveStats(numericValues).median
          
          result[col] = values.map(v => v === null ? fillValue : v)
        } else {
          result[col] = [...values]
        }
      })
    } else {
      // Forward or backward fill
      Object.keys(data).forEach(col => {
        const values = [...data[col]]
        
        if (method === 'forward') {
          let lastValid: any = null
          for (let i = 0; i < values.length; i++) {
            if (values[i] === null && lastValid !== null) {
              values[i] = lastValid
            } else if (values[i] !== null) {
              lastValid = values[i]
            }
          }
        } else {
          // backward
          let nextValid: any = null
          for (let i = values.length - 1; i >= 0; i--) {
            if (values[i] === null && nextValid !== null) {
              values[i] = nextValid
            } else if (values[i] !== null) {
              nextValid = values[i]
            }
          }
        }
        
        result[col] = values
      })
    }
    
    return result
  }
  
  /**
   * Generate sample data for testing
   */
  static generateSampleData(type: 'two-groups' | 'three-groups' | 'correlation' | 'missing' = 'two-groups'): DataSet {
    switch (type) {
      case 'two-groups':
        return {
          'Group': Array(20).fill('A').concat(Array(20).fill('B')),
          'Value': [
            // Group A - mean ~25
            23, 25, 27, 22, 24, 26, 28, 25, 24, 23,
            26, 24, 25, 27, 23, 25, 24, 26, 25, 24,
            // Group B - mean ~32
            31, 33, 35, 32, 34, 36, 33, 32, 34, 33,
            35, 32, 31, 34, 33, 32, 35, 34, 33, 32
          ]
        }
      
      case 'three-groups':
        return {
          'Group': Array(15).fill('A').concat(Array(15).fill('B')).concat(Array(15).fill('C')),
          'Value': [
            // Group A - mean ~20
            18, 20, 22, 19, 21, 20, 19, 21, 20, 22, 19, 20, 21, 19, 20,
            // Group B - mean ~30
            28, 30, 32, 29, 31, 30, 29, 31, 30, 32, 29, 30, 31, 29, 30,
            // Group C - mean ~40
            38, 40, 42, 39, 41, 40, 39, 41, 40, 42, 39, 40, 41, 39, 40
          ]
        }
      
      case 'correlation':
        const n = 50
        const x = Array.from({ length: n }, (_, i) => i + Math.random() * 5)
        const y = x.map(xi => 2 * xi + 10 + (Math.random() - 0.5) * 10)
        return { 'X': x, 'Y': y }
      
      case 'missing':
        const data = this.generateSampleData('two-groups')
        // Add some missing values
        data['Value'][5] = null
        data['Value'][12] = null
        data['Value'][18] = null
        data['Value'][25] = null
        data['Value'][32] = null
        return data
      
      default:
        return {}
    }
  }
  
  /**
   * Export data to CSV
   */
  static exportToCSV(data: DataSet, filename = 'data.csv'): void {
    const columns = Object.keys(data)
    if (columns.length === 0) return
    
    const rows = []
    rows.push(columns.join(','))
    
    const rowCount = data[columns[0]].length
    for (let i = 0; i < rowCount; i++) {
      const row = columns.map(col => {
        const value = data[col][i]
        return value === null ? '' : String(value)
      })
      rows.push(row.join(','))
    }
    
    const csvContent = rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }
}

export default DataHandler