/**
 * 하이브리드 추천 시스템
 * 키워드(즉시) + LLM(정확) 조합으로 최적의 UX 제공
 */

import { KeywordBasedRecommender } from './keyword-based-recommender'
import { OllamaRecommender } from './ollama-recommender'
import { StatisticalMethod } from '@/types/smart-flow'

export interface HybridRecommendation {
  immediate: {
    methods: StatisticalMethod[]
    source: 'keyword'
    confidence: number
    timestamp: number
  }
  enhanced?: {
    methods: StatisticalMethod[]
    source: 'llm'
    confidence: number
    timestamp: number
    insights?: string
  }
  final: {
    methods: StatisticalMethod[]
    source: 'hybrid'
    confidence: number
    reasoning: string
  }
}

export class HybridRecommender {
  private keywordRecommender = KeywordBasedRecommender
  private ollamaRecommender = new OllamaRecommender()
  private cache = new Map<string, HybridRecommendation>()
  
  /**
   * 메인 추천 함수 - 점진적 개선 방식
   */
  async recommend(
    purposeText: string,
    dataInfo: any,
    callbacks?: {
      onImmediate?: (result: any) => void
      onEnhanced?: (result: any) => void
      onFinal?: (result: any) => void
    }
  ): Promise<HybridRecommendation> {
    // 캐시 확인
    const cacheKey = `${purposeText}_${JSON.stringify(dataInfo)}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const result: HybridRecommendation = {
      immediate: {
        methods: [],
        source: 'keyword',
        confidence: 0,
        timestamp: Date.now()
      },
      final: {
        methods: [],
        source: 'hybrid',
        confidence: 0,
        reasoning: ''
      }
    }

    // 🚀 1단계: 즉시 키워드 기반 추천 (100ms 이내)
    const keywordResult = this.getKeywordRecommendation(purposeText, dataInfo)
    result.immediate = {
      methods: keywordResult,
      source: 'keyword',
      confidence: this.calculateKeywordConfidence(purposeText, keywordResult),
      timestamp: Date.now()
    }
    
    // 즉시 콜백
    callbacks?.onImmediate?.(result.immediate)

    // 🤖 2단계: LLM 분석 (비동기, 2-5초)
    const llmPromise = this.getLLMRecommendation(purposeText, dataInfo)
      .then(llmResult => {
        result.enhanced = {
          methods: llmResult.methods,
          source: 'llm',
          confidence: llmResult.confidence,
          timestamp: Date.now(),
          insights: llmResult.insights
        }
        callbacks?.onEnhanced?.(result.enhanced)
        return llmResult
      })
      .catch(error => {
        console.error('LLM failed, using keyword only:', error)
        return null
      })

    // 🎯 3단계: 결과 통합
    const llmResult = await llmPromise
    
    if (llmResult) {
      // LLM 성공: 지능적 통합
      result.final = this.mergeResults(
        result.immediate,
        result.enhanced!,
        dataInfo
      )
    } else {
      // LLM 실패: 키워드 결과 사용
      result.final = {
        methods: result.immediate.methods,
        source: 'hybrid',
        confidence: result.immediate.confidence * 0.8, // 신뢰도 하향
        reasoning: '기본 분석 기반 추천 (고급 분석 사용 불가)'
      }
    }

    // 캐시 저장
    this.cache.set(cacheKey, result)
    callbacks?.onFinal?.(result.final)

    return result
  }

  /**
   * 키워드 기반 추천 (즉시)
   */
  private getKeywordRecommendation(
    purposeText: string,
    dataInfo: any
  ): StatisticalMethod[] {
    return this.keywordRecommender.recommendMethods(purposeText, dataInfo)
  }

  /**
   * LLM 기반 추천 (정확)
   */
  private async getLLMRecommendation(
    purposeText: string,
    dataInfo: any
  ): Promise<any> {
    // Ollama 사용 가능 여부 확인
    const isAvailable = await this.ollamaRecommender.checkHealth()
    
    if (!isAvailable) {
      throw new Error('Ollama not available')
    }

    return await this.ollamaRecommender.recommend(purposeText, {
      shape: [dataInfo.rowCount || 0, dataInfo.columnCount || 0],
      types: dataInfo.columnTypes || []
    })
  }

  /**
   * 결과 통합 알고리즘
   */
  private mergeResults(
    keywordResult: any,
    llmResult: any,
    dataInfo: any
  ): any {
    const merged: StatisticalMethod[] = []
    const reasoning: string[] = []

    // LLM 신뢰도가 높으면 LLM 우선
    if (llmResult.confidence > 0.8) {
      merged.push(...llmResult.methods)
      reasoning.push('AI 분석 기반 추천')
    } 
    // 중간 신뢰도면 통합
    else if (llmResult.confidence > 0.5) {
      // LLM 상위 2개 + 키워드 상위 1개
      merged.push(...llmResult.methods.slice(0, 2))
      merged.push(...keywordResult.methods.slice(0, 1))
      reasoning.push('AI와 키워드 분석 통합')
    }
    // 낮은 신뢰도면 키워드 우선
    else {
      merged.push(...keywordResult.methods)
      merged.push(...llmResult.methods.slice(0, 1))
      reasoning.push('키워드 분석 우선 (AI 신뢰도 낮음)')
    }

    // 중복 제거
    const unique = this.removeDuplicates(merged)

    // 데이터 특성 기반 보정
    const adjusted = this.adjustForDataCharacteristics(unique, dataInfo)

    return {
      methods: adjusted.slice(0, 4), // 최대 4개
      source: 'hybrid',
      confidence: (keywordResult.confidence + llmResult.confidence) / 2,
      reasoning: reasoning.join('. ')
    }
  }

  /**
   * 키워드 신뢰도 계산
   */
  private calculateKeywordConfidence(
    text: string,
    methods: StatisticalMethod[]
  ): number {
    let confidence = 0.5 // 기본값

    // 텍스트 길이
    if (text.length > 20) confidence += 0.1
    if (text.length > 50) confidence += 0.1

    // 명확한 키워드
    const clearKeywords = ['비교', '차이', '관계', '영향', '예측']
    const foundClear = clearKeywords.filter(k => text.includes(k)).length
    confidence += foundClear * 0.1

    // 추천 개수
    if (methods.length > 0) confidence += 0.1
    if (methods.length > 2) confidence += 0.1

    return Math.min(confidence, 0.9) // 최대 0.9
  }

  /**
   * 중복 제거
   */
  private removeDuplicates(methods: StatisticalMethod[]): StatisticalMethod[] {
    const seen = new Set<string>()
    return methods.filter(m => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
  }

  /**
   * 데이터 특성 기반 조정
   */
  private adjustForDataCharacteristics(
    methods: StatisticalMethod[],
    dataInfo: any
  ): StatisticalMethod[] {
    const adjusted = [...methods]

    // 작은 샘플 → 비모수 검정 우선
    if (dataInfo.rowCount < 30) {
      const nonparametric = {
        id: 'nonparametric-notice',
        name: '⚠️ 비모수 검정 권장',
        description: `샘플이 작습니다 (n=${dataInfo.rowCount})`,
        category: 'warning' as const
      }
      adjusted.unshift(nonparametric)
    }

    // 결측값 많음 → 경고
    if (dataInfo.missingRatio > 0.2) {
      const warning = {
        id: 'missing-data-notice',
        name: '⚠️ 결측값 처리 필요',
        description: `결측값 ${(dataInfo.missingRatio * 100).toFixed(0)}%`,
        category: 'warning' as const
      }
      adjusted.unshift(warning)
    }

    return adjusted
  }

  /**
   * 실시간 스트리밍 추천 (고급 기능)
   */
  async *recommendStream(
    purposeText: string,
    dataInfo: any
  ): AsyncGenerator<Partial<HybridRecommendation>> {
    // 1. 즉시 키워드 결과
    const keywordResult = this.getKeywordRecommendation(purposeText, dataInfo)
    yield {
      immediate: {
        methods: keywordResult,
        source: 'keyword',
        confidence: 0.6,
        timestamp: Date.now()
      }
    }

    // 2. LLM 스트리밍
    try {
      const stream = this.ollamaRecommender.recommendStream(purposeText, dataInfo)
      let accumulated = ''
      
      for await (const chunk of stream) {
        accumulated += chunk
        // 부분 결과 전송
        yield {
          enhanced: {
            methods: [],
            source: 'llm',
            confidence: 0,
            timestamp: Date.now(),
            insights: accumulated
          }
        }
      }
    } catch (error) {
      console.error('LLM streaming failed:', error)
    }

    // 3. 최종 통합 결과
    // ... 통합 로직
  }
}

// 싱글톤 인스턴스
export const hybridRecommender = new HybridRecommender()