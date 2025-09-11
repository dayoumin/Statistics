/**
 * Decision Engine for Intelligent Statistical Analysis
 * Rules-based automation with user confirmation points
 */

import type PyodideManager from '@/lib/pyodide/manager'

interface DataPattern {
  groupCount: number
  dataType: 'continuous' | 'categorical' | 'mixed'
  distribution: 'normal' | 'non-normal' | 'unknown'
  sampleSize: number
  hasOutliers: boolean
  missingData: number
}

interface MethodRecommendation {
  method: string
  confidence: number
  reasoning: string
  alternatives?: string[]
}

interface AssumptionResult {
  normality: boolean
  homogeneity: boolean
  independence: boolean
  needsConfirmation: boolean
  message?: string
  options?: string[]
}

export default class DecisionEngine {
  private pyodide: PyodideManager
  
  constructor(pyodide: PyodideManager) {
    this.pyodide = pyodide
  }
  
  /**
   * Analyze data pattern
   */
  private analyzeDataPattern(data: any): DataPattern {
    // Extract groups if data has group column
    const groups = this.detectGroups(data)
    const values = this.extractValues(data)
    
    return {
      groupCount: groups.length,
      dataType: this.detectDataType(values),
      distribution: 'unknown', // Will be determined by normality test
      sampleSize: values.length,
      hasOutliers: this.detectOutliers(values),
      missingData: this.countMissing(values)
    }
  }
  
  /**
   * Detect groups in data
   */
  private detectGroups(data: any): string[] {
    // Check if data is column-based (from DataUpload component)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Look for Group column
      const groupColumn = Object.keys(data).find(key => 
        /group|category|treatment|condition/i.test(key)
      )
      
      if (groupColumn && Array.isArray(data[groupColumn])) {
        return [...new Set(data[groupColumn])]
      }
      
      // No group column found, treat as single group
      return ['All']
    }
    
    // Legacy row-based format
    if (!data.data || !Array.isArray(data.data)) return []
    
    const groupColumn = data.headers?.find((h: string) => 
      /group|category|treatment|condition/i.test(h)
    )
    
    if (!groupColumn) return ['All']
    
    const groups = new Set<string>()
    data.data.forEach((row: any) => {
      if (row[groupColumn]) {
        groups.add(String(row[groupColumn]))
      }
    })
    
    return Array.from(groups)
  }
  
  /**
   * Extract numeric values from data
   */
  private extractValues(data: any): number[] {
    // Check if data is column-based (from DataUpload component)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Find numeric column (not Group column)
      const numericColumn = Object.keys(data).find(key => {
        if (/group|category|treatment|condition/i.test(key)) return false
        const values = data[key]
        return Array.isArray(values) && values.some(v => typeof v === 'number')
      })
      
      if (numericColumn && Array.isArray(data[numericColumn])) {
        return data[numericColumn].filter((v: any) => typeof v === 'number')
      }
      
      // Try to collect all numeric values
      const allValues: number[] = []
      Object.values(data).forEach((column: any) => {
        if (Array.isArray(column)) {
          column.forEach(v => {
            if (typeof v === 'number') {
              allValues.push(v)
            }
          })
        }
      })
      return allValues
    }
    
    // Legacy row-based format
    if (!data.data || !Array.isArray(data.data)) return []
    
    const values: number[] = []
    const valueColumn = data.headers?.find((h: string) => 
      /value|measurement|result|score/i.test(h)
    ) || data.headers?.[1]
    
    if (!valueColumn) return []
    
    data.data.forEach((row: any) => {
      const val = parseFloat(row[valueColumn])
      if (!isNaN(val)) {
        values.push(val)
      }
    })
    
    return values
  }
  
  /**
   * Detect data type
   */
  private detectDataType(values: number[]): 'continuous' | 'categorical' | 'mixed' {
    if (values.length === 0) return 'mixed'
    
    // Check if all values are integers
    const allIntegers = values.every(v => Number.isInteger(v))
    
    // Check unique values
    const unique = new Set(values)
    
    if (unique.size <= 10 && allIntegers) {
      return 'categorical'
    } else if (unique.size > values.length * 0.5) {
      return 'continuous'
    } else {
      return 'mixed'
    }
  }
  
  /**
   * Detect outliers using IQR method
   */
  private detectOutliers(values: number[]): boolean {
    if (values.length < 4) return false
    
    const sorted = [...values].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(values.length * 0.25)]
    const q3 = sorted[Math.floor(values.length * 0.75)]
    const iqr = q3 - q1
    
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    
    return values.some(v => v < lowerBound || v > upperBound)
  }
  
  /**
   * Count missing data
   */
  private countMissing(values: any[]): number {
    return values.filter(v => v === null || v === undefined || v === '').length
  }
  
  /**
   * Validate data
   */
  public async validateData(data: any): Promise<any> {
    const pattern = this.analyzeDataPattern(data)
    
    const issues = []
    const warnings = []
    
    // Check for issues
    if (pattern.sampleSize < 3) {
      issues.push('샘플 크기가 너무 작습니다 (최소 3개 필요)')
    }
    
    if (pattern.missingData > pattern.sampleSize * 0.2) {
      issues.push(`결측치가 너무 많습니다 (${pattern.missingData}개)`)
    }
    
    // Check for warnings
    if (pattern.hasOutliers) {
      warnings.push('이상치가 감지되었습니다')
    }
    
    if (pattern.sampleSize < 30) {
      warnings.push('샘플 크기가 작습니다. 비모수 검정을 고려하세요')
    }
    
    return {
      valid: issues.length === 0,
      pattern,
      issues,
      warnings,
      needsConfirmation: warnings.length > 0,
      message: issues.length > 0 ? issues.join(', ') : 
               warnings.length > 0 ? warnings.join(', ') : '데이터 검증 완료',
      options: warnings.length > 0 ? ['계속 진행', '데이터 수정'] : undefined
    }
  }
  
  /**
   * Test statistical assumptions
   */
  public async testAssumptions(data: any): Promise<AssumptionResult> {
    const groups = this.detectGroups(data)
    const groupedData = this.groupData(data)
    
    // Check if we have valid data
    const hasValidData = Object.values(groupedData).some((values: any) => 
      Array.isArray(values) && values.length > 0
    )
    
    if (!hasValidData) {
      return {
        normality: false,
        homogeneity: false,
        independence: false,
        needsConfirmation: true,
        message: '데이터가 유효하지 않습니다. 데이터를 확인해주세요.',
        options: ['데이터 다시 로드', '수동으로 입력']
      }
    }
    
    // Test normality for each group
    const normalityResults = await Promise.all(
      Object.values(groupedData).map(async (values: any) => {
        if (!Array.isArray(values) || values.length < 3) {
          return false // Too few samples for normality test
        }
        try {
          const result = await this.pyodide.runAnalysis('normality', { values })
          return result.is_normal
        } catch (error) {
          console.error('Normality test error:', error)
          return false
        }
      })
    )
    
    const allNormal = normalityResults.every(r => r)
    
    // Test homogeneity if multiple groups
    let homogeneous = true
    if (groups.length > 1) {
      const validGroups = Object.values(groupedData).filter((values: any) => 
        Array.isArray(values) && values.length > 0
      )
      
      if (validGroups.length > 1) {
        try {
          const homogeneityResult = await this.pyodide.runAnalysis('homogeneity', {
            groups: validGroups
          })
          homogeneous = homogeneityResult.equal_variance
        } catch (error) {
          console.error('Homogeneity test error:', error)
          homogeneous = false
        }
      }
    }
    
    // Determine if confirmation needed
    const needsConfirmation = !allNormal || !homogeneous
    
    let message = ''
    const options = []
    
    if (!allNormal && !homogeneous) {
      message = '데이터가 정규분포를 따르지 않고 등분산성도 만족하지 않습니다.'
      options.push('비모수 검정 사용', '변환 후 재검정', '그대로 진행')
    } else if (!allNormal) {
      message = '데이터가 정규분포를 따르지 않습니다.'
      options.push('비모수 검정 사용', '로그 변환 시도', '그대로 진행')
    } else if (!homogeneous) {
      message = '그룹 간 분산이 동일하지 않습니다.'
      options.push('Welch 검정 사용', '그대로 진행')
    }
    
    return {
      normality: allNormal,
      homogeneity: homogeneous,
      independence: true, // Assumed for now
      needsConfirmation,
      message,
      options: options.length > 0 ? options : undefined
    }
  }
  
  /**
   * Group data by group column
   */
  private groupData(data: any): Record<string, number[]> {
    const grouped: Record<string, number[]> = {}
    
    // Check if data is column-based (from DataUpload component)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Look for Group column
      const groupColumn = Object.keys(data).find(key => 
        /group|category|treatment|condition/i.test(key)
      )
      
      // Find value column
      const valueColumn = Object.keys(data).find(key => {
        if (/group|category|treatment|condition/i.test(key)) return false
        const values = data[key]
        return Array.isArray(values) && values.some(v => typeof v === 'number')
      })
      
      if (groupColumn && valueColumn && Array.isArray(data[groupColumn]) && Array.isArray(data[valueColumn])) {
        // Group the data
        data[groupColumn].forEach((group: any, index: number) => {
          const value = data[valueColumn][index]
          if (typeof value === 'number') {
            const groupName = String(group)
            if (!grouped[groupName]) {
              grouped[groupName] = []
            }
            grouped[groupName].push(value)
          }
        })
        return grouped
      }
      
      // No groups found, treat all values as single group
      grouped['All'] = this.extractValues(data)
      return grouped
    }
    
    // Legacy row-based format
    const groupColumn = data.headers?.find((h: string) => 
      /group|category|treatment|condition/i.test(h)
    )
    
    const valueColumn = data.headers?.find((h: string) => 
      /value|measurement|result|score/i.test(h)
    ) || data.headers?.[1]
    
    if (!groupColumn || !valueColumn) {
      grouped['All'] = this.extractValues(data)
      return grouped
    }
    
    data.data.forEach((row: any) => {
      const group = String(row[groupColumn])
      const value = parseFloat(row[valueColumn])
      
      if (!isNaN(value)) {
        if (!grouped[group]) {
          grouped[group] = []
        }
        grouped[group].push(value)
      }
    })
    
    return grouped
  }
  
  /**
   * Recommend statistical method
   */
  public async recommendMethod(data: any, assumptions?: AssumptionResult | null): Promise<MethodRecommendation> {
    const pattern = this.analyzeDataPattern(data)
    
    let method = ''
    let confidence = 0
    let reasoning = ''
    const alternatives: string[] = []
    
    // Two groups comparison
    if (pattern.groupCount === 2) {
      if (assumptions?.normality && assumptions?.homogeneity) {
        method = 'independent-t-test'
        confidence = 95
        reasoning = '두 그룹, 정규분포, 등분산성 만족'
        alternatives.push('welch-t-test', 'mann-whitney')
      } else if (assumptions?.normality && !assumptions?.homogeneity) {
        method = 'welch-t-test'
        confidence = 90
        reasoning = '두 그룹, 정규분포, 이분산성'
        alternatives.push('mann-whitney')
      } else {
        method = 'mann-whitney'
        confidence = 85
        reasoning = '두 그룹, 비정규분포'
        alternatives.push('permutation-test')
      }
    }
    // Multiple groups comparison
    else if (pattern.groupCount > 2) {
      if (assumptions?.normality && assumptions?.homogeneity) {
        method = 'one-way-anova'
        confidence = 95
        reasoning = '다중 그룹, 정규분포, 등분산성 만족'
        alternatives.push('welch-anova', 'kruskal-wallis')
      } else if (assumptions?.normality && !assumptions?.homogeneity) {
        method = 'welch-anova'
        confidence = 90
        reasoning = '다중 그룹, 정규분포, 이분산성'
        alternatives.push('kruskal-wallis')
      } else {
        method = 'kruskal-wallis'
        confidence = 85
        reasoning = '다중 그룹, 비정규분포'
        alternatives.push('permutation-anova')
      }
    }
    // Correlation/Regression
    else if (pattern.groupCount === 1 && data.headers?.length >= 2) {
      if (assumptions?.normality) {
        method = 'pearson-correlation'
        confidence = 90
        reasoning = '연속형 변수, 정규분포'
        alternatives.push('spearman-correlation', 'linear-regression')
      } else {
        method = 'spearman-correlation'
        confidence = 85
        reasoning = '연속형 변수, 비정규분포'
        alternatives.push('kendall-correlation')
      }
    }
    // Single sample
    else {
      method = 'descriptive-statistics'
      confidence = 100
      reasoning = '단일 샘플 기술통계'
      alternatives.push('one-sample-t-test')
    }
    
    return {
      method,
      confidence,
      reasoning,
      alternatives
    }
  }
  
  /**
   * Run statistical analysis
   */
  public async runAnalysis(method: string, data: any): Promise<any> {
    const groupedData = this.groupData(data)
    const groups = Object.values(groupedData).filter((g: any) => 
      Array.isArray(g) && g.length > 0
    )
    
    // Check if we have valid data
    if (groups.length === 0) {
      return {
        error: '분석할 데이터가 없습니다',
        message: '유효한 숫자 데이터를 찾을 수 없습니다'
      }
    }
    
    let result: any = null
    
    switch (method) {
      case 'independent-t-test':
      case 'welch-t-test':
        if (groups.length >= 2) {
          result = await this.pyodide.runAnalysis('t-test', {
            group1: groups[0],
            group2: groups[1],
            paired: false,
            equal_var: method === 'independent-t-test'
          })
        } else {
          result = { error: 't-test requires at least 2 groups' }
        }
        break
        
      case 'mann-whitney':
        if (groups.length >= 2) {
          result = await this.runMannWhitney(groups[0], groups[1])
        } else {
          result = { error: 'Mann-Whitney test requires at least 2 groups' }
        }
        break
        
      case 'one-way-anova':
      case 'welch-anova':
        if (groups.length >= 2) {
          result = await this.pyodide.runAnalysis('anova', { 
            groups,
            equal_var: method === 'one-way-anova'
          })
          result.needsPostHoc = result.significant
        } else {
          result = { error: 'ANOVA requires at least 2 groups' }
        }
        break
        
      case 'kruskal-wallis':
        if (groups.length >= 2) {
          result = await this.runKruskalWallis(groups)
          result.needsPostHoc = result.significant
        } else {
          result = { error: 'Kruskal-Wallis test requires at least 2 groups' }
        }
        break
        
      case 'pearson-correlation':
      case 'spearman-correlation':
        result = await this.runCorrelation(data, method)
        break
        
      default:
        if (groups.length > 0 && groups[0].length > 0) {
          result = await this.runDescriptiveStats(groups[0])
        } else {
          result = { error: 'No valid data for analysis' }
        }
    }
    
    return result
  }
  
  /**
   * Run post-hoc analysis
   */
  public async runPostHoc(analysisResult: any, data: any): Promise<any> {
    if (!analysisResult.needsPostHoc) {
      return { skipped: true }
    }
    
    const groupedData = this.groupData(data)
    const groups = Object.entries(groupedData)
    
    // Pairwise comparisons
    const comparisons = []
    for (let i = 0; i < groups.length - 1; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const result = await this.pyodide.runAnalysis('t-test', {
          group1: groups[i][1],
          group2: groups[j][1],
          paired: false
        })
        
        comparisons.push({
          group1: groups[i][0],
          group2: groups[j][0],
          pValue: result.p_value,
          // Bonferroni correction
          adjustedPValue: result.p_value * (groups.length * (groups.length - 1) / 2),
          significant: result.p_value * (groups.length * (groups.length - 1) / 2) < 0.05
        })
      }
    }
    
    return {
      method: 'bonferroni',
      comparisons,
      summary: `${comparisons.filter(c => c.significant).length}개의 유의한 차이 발견`
    }
  }
  
  /**
   * Generate final results
   */
  public generateResults(steps: any[]): any {
    const validation = steps.find(s => s.id === 'validation')?.result
    const assumptions = steps.find(s => s.id === 'assumptions')?.result
    const recommendation = steps.find(s => s.id === 'recommendation')?.result
    const analysis = steps.find(s => s.id === 'analysis')?.result
    const posthoc = steps.find(s => s.id === 'posthoc')?.result
    
    return {
      summary: this.generateSummary(analysis, posthoc),
      details: {
        dataPattern: validation?.pattern,
        assumptions,
        method: recommendation?.method,
        confidence: recommendation?.confidence,
        analysisResults: analysis,
        postHocResults: posthoc
      },
      recommendations: this.generateRecommendations(analysis, assumptions)
    }
  }
  
  private generateSummary(analysis: any, posthoc: any): string {
    if (!analysis) return '분석 실패'
    
    let summary = ''
    if (analysis.p_value !== undefined) {
      summary = `p-value: ${analysis.p_value.toFixed(4)}, `
      summary += analysis.significant ? '통계적으로 유의함' : '통계적으로 유의하지 않음'
    }
    
    if (posthoc && !posthoc.skipped) {
      summary += `. ${posthoc.summary}`
    }
    
    return summary
  }
  
  private generateRecommendations(analysis: any, assumptions: any): string[] {
    const recommendations = []
    
    if (!assumptions?.normality) {
      recommendations.push('데이터 변환을 고려하여 정규성을 개선할 수 있습니다')
    }
    
    if (!assumptions?.homogeneity) {
      recommendations.push('그룹 간 분산 차이를 고려한 분석 방법을 사용했습니다')
    }
    
    if (analysis?.significant) {
      recommendations.push('효과 크기를 계산하여 실질적 의미를 평가하세요')
    }
    
    return recommendations
  }
  
  // Helper methods for non-parametric tests
  private async runMannWhitney(group1: number[], group2: number[]): Promise<any> {
    if (!group1 || !group2 || group1.length === 0 || group2.length === 0) {
      return { error: 'Mann-Whitney test requires valid data for both groups' }
    }
    
    const code = `
import scipy.stats as stats
import json
import numpy as np

group1 = np.array(${JSON.stringify(group1)})
group2 = np.array(${JSON.stringify(group2)})

if len(group1) == 0 or len(group2) == 0:
    json.dumps({'error': 'Empty groups provided'})
else:
    result = stats.mannwhitneyu(group1, group2)
    json.dumps({
      'statistic': float(result.statistic),
      'p_value': float(result.pvalue),
      'significant': result.pvalue < 0.05
    })
`
    return JSON.parse(await this.pyodide.runPython(code))
  }
  
  private async runKruskalWallis(groups: number[][]): Promise<any> {
    const validGroups = groups.filter(g => Array.isArray(g) && g.length > 0)
    
    if (validGroups.length < 2) {
      return { error: 'Kruskal-Wallis test requires at least 2 non-empty groups' }
    }
    
    const code = `
import scipy.stats as stats
import json
import numpy as np

groups = [np.array(g) for g in ${JSON.stringify(validGroups)} if len(g) > 0]

if len(groups) < 2:
    json.dumps({'error': 'Not enough valid groups'})
else:
    result = stats.kruskal(*groups)
    json.dumps({
      'statistic': float(result.statistic),
      'p_value': float(result.pvalue),
      'significant': result.pvalue < 0.05
    })
`
    return JSON.parse(await this.pyodide.runPython(code))
  }
  
  private async runCorrelation(data: any, method: string): Promise<any> {
    let x: number[] = []
    let y: number[] = []
    
    // Check if data is column-based
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Find two numeric columns
      const numericColumns = Object.keys(data).filter(key => {
        if (/group|category|treatment|condition/i.test(key)) return false
        const values = data[key]
        return Array.isArray(values) && values.some(v => typeof v === 'number')
      })
      
      if (numericColumns.length < 2) {
        // If only one numeric column, check for X and Y named columns
        const xCol = Object.keys(data).find(k => /^x$/i.test(k))
        const yCol = Object.keys(data).find(k => /^y$/i.test(k))
        
        if (xCol && yCol) {
          x = data[xCol].filter((v: any) => typeof v === 'number')
          y = data[yCol].filter((v: any) => typeof v === 'number')
        } else {
          return { error: '상관분석을 위해 최소 2개의 숫자 변수가 필요합니다' }
        }
      } else {
        x = data[numericColumns[0]].filter((v: any) => typeof v === 'number')
        y = data[numericColumns[1]].filter((v: any) => typeof v === 'number')
      }
    } else if (data.headers && data.data) {
      // Legacy row-based format
      const headers = data.headers.filter((h: string) => h !== 'Group' && h !== 'Category')
      if (headers.length < 2) {
        return { error: '상관분석을 위해 최소 2개의 변수가 필요합니다' }
      }
      
      x = data.data.map((row: any) => parseFloat(row[headers[0]])).filter((v: number) => !isNaN(v))
      y = data.data.map((row: any) => parseFloat(row[headers[1]])).filter((v: number) => !isNaN(v))
    } else {
      return { error: '유효한 데이터 형식이 아닙니다' }
    }
    
    if (x.length === 0 || y.length === 0 || x.length !== y.length) {
      return { error: '상관분석을 위한 유효한 데이터 쌍이 없습니다' }
    }
    
    const code = `
import scipy.stats as stats
import json
import numpy as np

x = np.array(${JSON.stringify(x)})
y = np.array(${JSON.stringify(y)})

if len(x) == 0 or len(y) == 0 or len(x) != len(y):
    json.dumps({'error': 'Invalid data for correlation'})
else:
    if '${method}' == 'spearman-correlation':
        result = stats.spearmanr(x, y)
    else:
        result = stats.pearsonr(x, y)
        
    json.dumps({
      'correlation': float(result[0]),
      'p_value': float(result[1]),
      'significant': result[1] < 0.05,
      'n': len(x)
    })
`
    return JSON.parse(await this.pyodide.runPython(code))
  }
  
  private async runDescriptiveStats(values: number[]): Promise<any> {
    if (!values || values.length === 0) {
      return { error: 'No data provided for descriptive statistics' }
    }
    
    const code = `
import numpy as np
import json

values = np.array(${JSON.stringify(values)})

if len(values) == 0:
    json.dumps({'error': 'Empty array provided'})
else:
    json.dumps({
      'mean': float(np.mean(values)),
      'median': float(np.median(values)),
      'std': float(np.std(values, ddof=1)) if len(values) > 1 else 0,
      'min': float(np.min(values)),
      'max': float(np.max(values)),
      'count': len(values)
    })
`
    return JSON.parse(await this.pyodide.runPython(code))
  }
}