/**
 * 수산과학원 전용 통계 분석 모듈
 * National Institute of Fisheries Science - Specialized Statistical Analysis
 */

export class FisheriesAnalysis {
    constructor() {
        this.modules = {
            cpue: new CPUEAnalysis(),
            growth: new GrowthAnalysis(),
            stock: new StockAssessment(),
            aquaculture: new AquacultureAnalysis(),
            waterQuality: new WaterQualityAnalysis()
        };
        this.cache = {};
    }
    
    /**
     * 수산과학 분석 유형 자동 감지
     * @param {Object} data - 업로드된 데이터
     * @returns {string} - 분석 유형
     */
    detectAnalysisType(data) {
        const headers = Object.keys(data);
        const headerStr = headers.join(' ').toLowerCase();
        
        // CPUE 분석 감지
        if (this.containsKeywords(headerStr, ['catch', 'effort', '어획량', '어획노력', 'cpue'])) {
            return 'cpue';
        }
        
        // 성장분석 감지
        if (this.containsKeywords(headerStr, ['length', 'weight', 'age', '전장', '체중', '연령'])) {
            return 'growth';
        }
        
        // 수질분석 감지
        if (this.containsKeywords(headerStr, ['do', 'ph', 'temp', 'salinity', '용존산소', '수온', '염분'])) {
            return 'water_quality';
        }
        
        // 양식분석 감지
        if (this.containsKeywords(headerStr, ['survival', 'feed', 'fcr', '생존율', '사료', '성장률'])) {
            return 'aquaculture';
        }
        
        // 자원평가 감지
        if (this.containsKeywords(headerStr, ['biomass', 'recruitment', 'mortality', '자원량', '가입량'])) {
            return 'stock_assessment';
        }
        
        return 'general'; // 일반 통계 분석
    }
    
    /**
     * 키워드 매칭 헬퍼
     */
    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
    
    /**
     * 분석 실행
     */
    async performAnalysis(type, data, options = {}) {
        try {
            let results;
            
            switch (type) {
                case 'cpue':
                    results = await this.analyzeCPUE(data, options);
                    break;
                case 'growth':
                    results = await this.analyzeGrowth(data, options);
                    break;
                case 'water_quality':
                    results = await this.analyzeWaterQuality(data, options);
                    break;
                case 'aquaculture':
                    results = await this.analyzeAquaculture(data, options);
                    break;
                case 'stock_assessment':
                    results = await this.analyzeStock(data, options);
                    break;
                default:
                    throw new Error(`지원되지 않는 분석 유형: ${type}`);
            }
            
            // 캐시 저장
            this.cache[type] = {
                data: data,
                results: results,
                timestamp: new Date(),
                options: options
            };
            
            return results;
            
        } catch (error) {
            console.error('수산과학 분석 오류:', error);
            throw error;
        }
    }
    
    /**
     * CPUE 분석
     */
    async analyzeCPUE(data, options) {
        const cpueModule = this.modules.cpue;
        
        // 데이터 추출
        const catchData = this.extractColumn(data, ['catch', 'catch_kg', '어획량']);
        const effortData = this.extractColumn(data, ['effort', 'effort_hour', '어획노력']);
        
        if (!catchData || !effortData) {
            throw new Error('CPUE 분석에 필요한 데이터가 부족합니다 (어획량, 어획노력)');
        }
        
        // 기본 CPUE 계산
        const cpueResults = cpueModule.calculateCPUE(catchData, effortData, options.unit || 'kg/hour');
        
        // 추가 분석
        if (options.includeTrend) {
            const timePoints = this.extractColumn(data, ['time', 'date', '시간']) || 
                             Array.from({length: catchData.length}, (_, i) => i + 1);
            cpueResults.trendAnalysis = cpueModule.analyzeCPUETrend(cpueResults.cpue, timePoints);
        }
        
        if (options.detectAnomalies) {
            cpueResults.anomalies = cpueModule.detectAnomalies(cpueResults.cpue);
        }
        
        // 해역별 분석 (해역 정보가 있는 경우)
        const areaData = this.extractColumn(data, ['area', 'location', '해역']);
        if (areaData) {
            cpueResults.areaAnalysis = this.analyzeByArea(catchData, effortData, areaData);
        }
        
        return {
            type: 'cpue',
            title: 'CPUE (어획노력당 어획량) 분석',
            results: cpueResults,
            recommendations: this.generateCPUERecommendations(cpueResults),
            visualization: this.prepareCPUEVisualization(cpueResults)
        };
    }
    
    /**
     * 성장분석
     */
    async analyzeGrowth(data, options) {
        const lengthData = this.extractColumn(data, ['length', 'total_length', '전장']);
        const weightData = this.extractColumn(data, ['weight', 'body_weight', '체중']);
        const ageData = this.extractColumn(data, ['age', 'month', '연령']);
        
        const results = {};
        
        // 길이-무게 관계 (W = aL^b)
        if (lengthData && weightData) {
            results.lengthWeight = await this.analyzeLengthWeightRelation(lengthData, weightData);
        }
        
        // von Bertalanffy 성장 모델 (연령 데이터가 있는 경우)
        if (ageData && lengthData) {
            results.vonBertalanffy = await this.analyzeVonBertalanffy(ageData, lengthData);
        }
        
        // 조건지수
        if (lengthData && weightData) {
            results.conditionFactor = this.calculateConditionFactor(lengthData, weightData);
        }
        
        return {
            type: 'growth',
            title: '어류 성장 분석',
            results: results,
            recommendations: this.generateGrowthRecommendations(results)
        };
    }
    
    /**
     * 수질 분석
     */
    async analyzeWaterQuality(data, options) {
        const parameters = {
            temperature: this.extractColumn(data, ['temp', 'temperature', '수온']),
            dissolved_oxygen: this.extractColumn(data, ['do', 'dissolved_oxygen', '용존산소']),
            ph: this.extractColumn(data, ['ph', 'pH']),
            salinity: this.extractColumn(data, ['salinity', 'salt', '염분']),
            turbidity: this.extractColumn(data, ['turbidity', '탁도'])
        };
        
        // 유효한 파라미터만 필터링
        const validParams = Object.fromEntries(
            Object.entries(parameters).filter(([key, value]) => value !== null)
        );
        
        const results = {
            parameters: validParams,
            correlations: {},
            anomalies: {},
            trends: {},
            wqi: null // Water Quality Index
        };
        
        // 파라미터 간 상관분석
        const paramNames = Object.keys(validParams);
        for (let i = 0; i < paramNames.length; i++) {
            for (let j = i + 1; j < paramNames.length; j++) {
                const param1 = paramNames[i];
                const param2 = paramNames[j];
                
                if (typeof CorrelationAnalysis !== 'undefined') {
                    const corrAnalysis = new CorrelationAnalysis();
                    results.correlations[`${param1}_${param2}`] = 
                        await corrAnalysis.pearsonCorrelation(validParams[param1], validParams[param2]);
                }
            }
        }
        
        // 이상치 탐지
        for (const [param, values] of Object.entries(validParams)) {
            results.anomalies[param] = this.detectWaterQualityAnomalies(values, param);
        }
        
        return {
            type: 'water_quality',
            title: '수질 데이터 분석',
            results: results,
            recommendations: this.generateWaterQualityRecommendations(results)
        };
    }
    
    /**
     * 양식업 분석
     */
    async analyzeAquaculture(data, options) {
        const results = {};
        
        // 생존율 분석
        const initialCount = this.extractColumn(data, ['initial', 'start_count', '초기마리수']);
        const finalCount = this.extractColumn(data, ['final', 'end_count', '최종마리수']);
        const days = this.extractColumn(data, ['days', 'period', '사육일수']);
        
        if (initialCount && finalCount) {
            results.survivalRate = this.calculateSurvivalRate(initialCount, finalCount, days);
        }
        
        // 사료전환효율 (FCR)
        const feedUsed = this.extractColumn(data, ['feed', 'feed_amount', '사료량']);
        const weightGain = this.extractColumn(data, ['gain', 'weight_gain', '체중증가']);
        
        if (feedUsed && weightGain) {
            results.fcr = this.calculateFCR(feedUsed, weightGain);
        }
        
        // 성장률 (SGR, DGR)
        if (weightGain && days) {
            results.growthRate = this.calculateGrowthRates(weightGain, days);
        }
        
        return {
            type: 'aquaculture',
            title: '양식업 생산성 분석',
            results: results,
            recommendations: this.generateAquacultureRecommendations(results)
        };
    }
    
    // 유틸리티 함수들
    
    /**
     * 컬럼 데이터 추출
     */
    extractColumn(data, possibleNames) {
        for (const name of possibleNames) {
            if (data[name]) {
                return Array.isArray(data[name]) ? data[name] : [data[name]];
            }
        }
        
        // 대소문자 구분 없이 재시도
        const lowerNames = possibleNames.map(n => n.toLowerCase());
        for (const [key, value] of Object.entries(data)) {
            if (lowerNames.includes(key.toLowerCase())) {
                return Array.isArray(value) ? value : [value];
            }
        }
        
        return null;
    }
    
    /**
     * 길이-무게 관계 분석
     */
    async analyzeLengthWeightRelation(length, weight) {
        // W = aL^b 모델 적합
        // log(W) = log(a) + b*log(L)
        
        const logLength = length.map(l => Math.log(l));
        const logWeight = weight.map(w => Math.log(w));
        
        // 선형 회귀
        const n = logLength.length;
        const sumLogL = logLength.reduce((a, b) => a + b, 0);
        const sumLogW = logWeight.reduce((a, b) => a + b, 0);
        const sumLogLW = logLength.reduce((sum, logL, i) => sum + logL * logWeight[i], 0);
        const sumLogL2 = logLength.reduce((sum, logL) => sum + logL * logL, 0);
        
        const b = (n * sumLogLW - sumLogL * sumLogW) / (n * sumLogL2 - sumLogL * sumLogL);
        const logA = (sumLogW - b * sumLogL) / n;
        const a = Math.exp(logA);
        
        // R²
        const meanLogW = sumLogW / n;
        const ssTotal = logWeight.reduce((sum, logW) => sum + Math.pow(logW - meanLogW, 2), 0);
        const ssResidual = logWeight.reduce((sum, logW, i) => {
            const predicted = logA + b * logLength[i];
            return sum + Math.pow(logW - predicted, 2);
        }, 0);
        const rSquared = 1 - (ssResidual / ssTotal);
        
        return {
            a: a,
            b: b,
            r_squared: rSquared,
            equation: `W = ${a.toFixed(4)} × L^${b.toFixed(3)}`,
            interpretation: this.interpretLengthWeightRelation(b)
        };
    }
    
    /**
     * von Bertalanffy 성장 모델
     */
    async analyzeVonBertalanffy(age, length) {
        // Lt = Linf * (1 - exp(-K(t - t0)))
        // 비선형 최적화 필요 (간단한 추정으로 대체)
        
        const maxLength = Math.max(...length);
        const Linf = maxLength * 1.1; // 추정값
        
        // 간단한 K 추정 (실제로는 비선형 회귀 필요)
        const meanAge = age.reduce((a, b) => a + b, 0) / age.length;
        const meanLength = length.reduce((a, b) => a + b, 0) / length.length;
        
        const K = 0.2; // 임시값 (실제로는 최적화 필요)
        const t0 = 0; // 임시값
        
        return {
            Linf: Linf,
            K: K,
            t0: t0,
            equation: `Lt = ${Linf.toFixed(1)} × (1 - exp(-${K.toFixed(3)}(t - ${t0.toFixed(1)})))`,
            note: '정확한 매개변수 추정을 위해서는 비선형 회귀분석이 필요합니다.'
        };
    }
    
    /**
     * 조건지수 계산
     */
    calculateConditionFactor(length, weight) {
        const conditionFactors = weight.map((w, i) => {
            const l = length[i];
            return (w / Math.pow(l, 3)) * 100; // Fulton's K
        });
        
        const meanK = conditionFactors.reduce((a, b) => a + b, 0) / conditionFactors.length;
        const stdK = Math.sqrt(
            conditionFactors.reduce((sum, k) => sum + Math.pow(k - meanK, 2), 0) / (conditionFactors.length - 1)
        );
        
        return {
            values: conditionFactors,
            mean: meanK,
            std: stdK,
            interpretation: this.interpretConditionFactor(meanK)
        };
    }
    
    /**
     * 생존율 계산
     */
    calculateSurvivalRate(initial, final, days) {
        const survivalRates = initial.map((init, i) => {
            const surv = (final[i] / init) * 100;
            const daily = days && days[i] ? Math.pow(final[i] / init, 1 / days[i]) * 100 : null;
            return { total: surv, daily: daily };
        });
        
        const meanTotal = survivalRates.reduce((sum, s) => sum + s.total, 0) / survivalRates.length;
        
        return {
            rates: survivalRates,
            mean_total: meanTotal,
            interpretation: this.interpretSurvivalRate(meanTotal)
        };
    }
    
    /**
     * 사료전환효율 계산
     */
    calculateFCR(feedUsed, weightGain) {
        const fcrs = feedUsed.map((feed, i) => feed / weightGain[i]);
        const meanFCR = fcrs.reduce((a, b) => a + b, 0) / fcrs.length;
        
        return {
            values: fcrs,
            mean: meanFCR,
            interpretation: this.interpretFCR(meanFCR)
        };
    }
    
    // 해석 함수들
    
    interpretLengthWeightRelation(b) {
        if (b < 2.5) return '음성 이상성장 (머리/골격 우선성장)';
        if (b > 3.5) return '양성 이상성장 (살찜 우선성장)';
        return '등성장 (정상적 성장패턴)';
    }
    
    interpretConditionFactor(k) {
        if (k < 1.0) return '매우 야윈 상태';
        if (k < 1.2) return '다소 야윈 상태';
        if (k > 1.8) return '비만 상태';
        return '양호한 영양상태';
    }
    
    interpretSurvivalRate(rate) {
        if (rate > 90) return '우수한 생존율';
        if (rate > 80) return '양호한 생존율';
        if (rate > 70) return '보통 생존율';
        return '개선 필요한 생존율';
    }
    
    interpretFCR(fcr) {
        if (fcr < 1.2) return '우수한 사료효율';
        if (fcr < 1.5) return '양호한 사료효율';
        if (fcr < 2.0) return '보통 사료효율';
        return '사료효율 개선 필요';
    }
    
    /**
     * 권장사항 생성
     */
    generateCPUERecommendations(results) {
        const recommendations = [];
        
        if (results.statistics.cv > 50) {
            recommendations.push('• CPUE 변동성이 높습니다. 어획 방법의 일관성을 검토하세요.');
        }
        
        if (results.trendAnalysis && results.trendAnalysis.trend.direction === '감소') {
            recommendations.push('• CPUE가 감소 추세입니다. 자원 상태를 점검하고 어획강도 조절을 고려하세요.');
        }
        
        if (results.anomalies && results.anomalies.percentage > 10) {
            recommendations.push('• 이상치가 많이 발견되었습니다. 데이터 수집 방법을 재검토하세요.');
        }
        
        return recommendations;
    }
    
    generateGrowthRecommendations(results) {
        const recommendations = [];
        
        if (results.conditionFactor && results.conditionFactor.mean < 1.0) {
            recommendations.push('• 조건지수가 낮습니다. 영양 공급을 개선하세요.');
        }
        
        if (results.lengthWeight && results.lengthWeight.b < 2.5) {
            recommendations.push('• 음성 이상성장이 관찰됩니다. 사육환경과 영양 상태를 점검하세요.');
        }
        
        return recommendations;
    }
    
    generateWaterQualityRecommendations(results) {
        const recommendations = [];
        
        // DO 이상치 확인
        if (results.anomalies.dissolved_oxygen) {
            recommendations.push('• 용존산소 수치에 이상치가 발견되었습니다. 폭기 시설을 점검하세요.');
        }
        
        return recommendations;
    }
    
    generateAquacultureRecommendations(results) {
        const recommendations = [];
        
        if (results.survivalRate && results.survivalRate.mean_total < 80) {
            recommendations.push('• 생존율이 낮습니다. 사육밀도와 수질관리를 개선하세요.');
        }
        
        if (results.fcr && results.fcr.mean > 1.5) {
            recommendations.push('• 사료효율이 낮습니다. 사료 품질과 급여 방법을 재검토하세요.');
        }
        
        return recommendations;
    }
}

// 전역 노출
window.FisheriesAnalysis = FisheriesAnalysis;