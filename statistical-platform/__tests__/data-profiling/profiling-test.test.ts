/**
 * 데이터 프로파일링 기능 테스트
 * 변수 타입, 이상치, 기초통계 확인
 */

import { describe, test, expect } from '@jest/globals'
import { DataValidationService } from '@/lib/services/data-validation-service'

describe('데이터 프로파일링 기능 테스트', () => {
  test('performDetailedValidation이 이상치와 타입 정보를 반환하는지', () => {
    // 테스트 데이터: 이상치 포함
    const testData = [
      { id: 1, value: 10, category: 'A' },
      { id: 2, value: 12, category: 'B' },
      { id: 3, value: 11, category: 'A' },
      { id: 4, value: 13, category: 'C' },
      { id: 5, value: 100, category: 'B' }, // 이상치
      { id: 6, value: 14, category: 'A' },
      { id: 7, value: 'error', category: 'C' }, // 타입 혼합
      { id: 8, value: 15, category: 'B' },
      { id: 9, value: '', category: 'A' }, // 빈 값
      { id: 10, value: -50, category: 'C' } // 이상치
    ]

    const result = DataValidationService.performDetailedValidation(testData)

    console.log('\n=== 데이터 프로파일링 테스트 결과 ===')
    console.log('기본 정보:')
    console.log('- 총 행수:', result.totalRows)
    console.log('- 총 열수:', result.columnCount)
    console.log('- 결측값:', result.missingValues)

    // columnStats 확인
    expect(result.columnStats).toBeDefined()
    expect(Array.isArray(result.columnStats)).toBe(true)

    console.log('\n변수별 상세 정보:')
    result.columnStats?.forEach(stat => {
      console.log(`\n[${stat.name}]`)
      console.log('- 타입:', stat.type)
      console.log('- 고유값:', stat.uniqueValues)
      console.log('- 결측값:', stat.missingCount)

      if (stat.type === 'numeric') {
        console.log('- 평균:', stat.mean?.toFixed(2))
        console.log('- 중앙값:', stat.median?.toFixed(2))
        console.log('- 표준편차:', stat.std?.toFixed(2))
        console.log('- 최소값:', stat.min)
        console.log('- 최대값:', stat.max)
        console.log('- Q1:', stat.q1)
        console.log('- Q3:', stat.q3)
        console.log('- 이상치:', stat.outliers)
        console.log('- 이상치 개수:', stat.outliers?.length || 0)
      } else if (stat.type === 'mixed') {
        console.log('- 수치형 개수:', stat.numericCount)
        console.log('- 텍스트 개수:', stat.textCount)
      }
    })

    // value 컬럼이 mixed 타입인지 확인
    const valueColumn = result.columnStats?.find(s => s.name === 'value')
    expect(valueColumn).toBeDefined()
    expect(valueColumn?.type).toBe('mixed')
    expect(valueColumn?.numericCount).toBeGreaterThan(0)
    expect(valueColumn?.textCount).toBeGreaterThan(0)

    // id 컬럼이 numeric 타입인지 확인
    const idColumn = result.columnStats?.find(s => s.name === 'id')
    expect(idColumn).toBeDefined()
    expect(idColumn?.type).toBe('numeric')

    // category 컬럼이 categorical 타입인지 확인
    const categoryColumn = result.columnStats?.find(s => s.name === 'category')
    expect(categoryColumn).toBeDefined()
    expect(categoryColumn?.type).toBe('categorical')

    console.log('\n✅ 데이터 프로파일링 기능 정상 작동!')
  })

  test('이상치 탐지 정확도 테스트', () => {
    // IQR 방법으로 명확한 이상치를 포함한 데이터
    const testData = [
      { score: 50 },
      { score: 52 },
      { score: 54 },
      { score: 56 },
      { score: 58 },
      { score: 60 },
      { score: 62 },
      { score: 64 },
      { score: 200 }, // 명확한 이상치
      { score: -50 }  // 명확한 이상치
    ]

    const result = DataValidationService.performDetailedValidation(testData)
    const scoreColumn = result.columnStats?.find(s => s.name === 'score')

    console.log('\n=== 이상치 탐지 테스트 ===')
    console.log('정상 범위: 50-64')
    console.log('이상치: 200, -50')
    console.log('탐지된 이상치:', scoreColumn?.outliers)

    expect(scoreColumn?.outliers).toBeDefined()
    expect(scoreColumn?.outliers).toContain(200)
    expect(scoreColumn?.outliers).toContain(-50)

    console.log('✅ 이상치 탐지 성공!')
  })

  test('performValidation vs performDetailedValidation 비교', () => {
    const testData = [
      { a: 1, b: 'x' },
      { a: 2, b: 'y' },
      { a: 100, b: 'z' } // 이상치
    ]

    const basicResult = DataValidationService.performValidation(testData)
    const detailedResult = DataValidationService.performDetailedValidation(testData)

    console.log('\n=== Basic vs Detailed Validation ===')
    console.log('Basic - columnStats:', basicResult.columnStats ? 'YES' : 'NO')
    console.log('Detailed - columnStats:', detailedResult.columnStats ? 'YES' : 'NO')

    // Basic validation은 columnStats가 없음
    expect(basicResult.columnStats).toBeUndefined()

    // Detailed validation은 columnStats가 있음
    expect(detailedResult.columnStats).toBeDefined()
    expect(detailedResult.columnStats?.length).toBeGreaterThan(0)

    console.log('✅ Basic과 Detailed 검증의 차이 확인!')
  })
})