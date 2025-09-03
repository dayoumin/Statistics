/**
 * CPUE (Catch Per Unit Effort) 분석 모듈
 * 국립수산과학원 어획량 데이터 분석용
 */

export class CPUEAnalysis {
    constructor() {
        this.data = null;
        this.results = {};
    }
    
    /**
     * CPUE 계산
     * @param {Array} catchData - 어획량 데이터 (kg 또는 마리수)
     * @param {Array} effortData - 어획노력 데이터 (시간, 그물수, 척수 등)
     * @param {String} unit - 단위 ('kg/hour', 'n/haul', 'kg/vessel' 등)
     * @returns {Object} CPUE 결과
     */
    calculateCPUE(catchData, effortData, unit = 'kg/hour') {
        if (catchData.length !== effortData.length) {
            throw new Error('어획량과 어획노력 데이터의 길이가 일치하지 않습니다');
        }
        
        const cpue = catchData.map((catch_, i) => {
            const effort = effortData[i];
            if (effort === 0) return null;
            return catch_ / effort;
        }).filter(v => v !== null);
        
        // 기술통계
        const mean = this.mean(cpue);
        const std = this.std(cpue);
        const cv = (std / mean) * 100; // 변동계수
        
        return {
            cpue: cpue,
            unit: unit,
            statistics: {
                mean: mean,
                std: std,
                cv: cv,
                min: Math.min(...cpue),
                max: Math.max(...cpue),
                n: cpue.length
            },
            interpretation: this.interpretCPUE(cv)
        };
    }
    
    /**
     * 표준화 CPUE 계산
     * 다양한 요인을 고려한 표준화
     */
    standardizeCPUE(cpueData, factors = {}) {
        // GLM 또는 GAM을 사용한 표준화
        // Python으로 구현 예정
        const pythonCode = `
        import pandas as pd
        import numpy as np
        from statsmodels.formula.api import glm
        from statsmodels.genmod.families import Gamma
        
        def standardize_cpue(cpue, year, area, season):
            # 데이터프레임 생성
            df = pd.DataFrame({
                'cpue': cpue,
                'year': year,
                'area': area,
                'season': season
            })
            
            # GLM 모델 적합
            model = glm('cpue ~ year + area + season', 
                       data=df, 
                       family=Gamma(link='log'))
            result = model.fit()
            
            # 표준화된 CPUE
            standardized = result.fittedvalues
            
            return {
                'standardized_cpue': standardized.tolist(),
                'coefficients': result.params.to_dict(),
                'aic': result.aic,
                'r_squared': result.pseudo_rsquared()
            }
        `;
        
        return {
            pythonCode: pythonCode,
            message: 'Pyodide에서 실행 필요'
        };
    }
    
    /**
     * CPUE 시계열 분석
     */
    analyzeCPUETrend(cpueTimeSeries, timePoints) {
        // 추세 분석
        const trend = this.calculateTrend(cpueTimeSeries, timePoints);
        
        // 계절성 검정
        const seasonality = this.detectSeasonality(cpueTimeSeries);
        
        // 변화점 탐지
        const changePoints = this.detectChangePoints(cpueTimeSeries);
        
        return {
            trend: trend,
            seasonality: seasonality,
            changePoints: changePoints,
            forecast: this.forecastCPUE(cpueTimeSeries)
        };
    }
    
    /**
     * 어종별 CPUE 비교
     */
    compareSpeciesCPUE(speciesData) {
        const comparison = {};
        
        for (const [species, data] of Object.entries(speciesData)) {
            comparison[species] = {
                cpue: this.calculateCPUE(data.catch, data.effort),
                trend: this.calculateTrend(data.cpue, data.time),
                dominance: (data.catch.reduce((a,b) => a+b, 0) / 
                           Object.values(speciesData).reduce((sum, s) => 
                           sum + s.catch.reduce((a,b) => a+b, 0), 0)) * 100
            };
        }
        
        return comparison;
    }
    
    /**
     * 해역별 CPUE 분석
     */
    analyzeAreaCPUE(areaData) {
        const areaAnalysis = {};
        
        for (const [area, data] of Object.entries(areaData)) {
            areaAnalysis[area] = {
                meanCPUE: this.mean(data.cpue),
                productivity: this.calculateProductivity(data),
                hotspots: this.identifyHotspots(data.cpue, data.locations)
            };
        }
        
        // 해역 간 비교
        const comparison = this.compareAreas(areaAnalysis);
        
        return {
            byArea: areaAnalysis,
            comparison: comparison,
            recommendations: this.generateRecommendations(areaAnalysis)
        };
    }
    
    /**
     * CPUE 예측 모델
     */
    forecastCPUE(historicalCPUE, periods = 12) {
        // 간단한 이동평균 예측
        const ma3 = this.movingAverage(historicalCPUE, 3);
        const ma12 = this.movingAverage(historicalCPUE, 12);
        
        // 추세 추출
        const trend = this.extractTrend(historicalCPUE);
        
        // 예측값 생성
        const forecast = [];
        const lastValue = historicalCPUE[historicalCPUE.length - 1];
        const trendSlope = trend.slope;
        
        for (let i = 1; i <= periods; i++) {
            forecast.push(lastValue + (trendSlope * i));
        }
        
        return {
            forecast: forecast,
            confidence_interval: this.calculateCI(forecast),
            method: 'linear_trend',
            accuracy_metrics: this.calculateAccuracy(historicalCPUE, forecast)
        };
    }
    
    /**
     * CPUE 이상치 탐지
     */
    detectAnomalies(cpueData, threshold = 2.5) {
        const mean = this.mean(cpueData);
        const std = this.std(cpueData);
        
        const anomalies = cpueData.map((value, index) => {
            const zScore = Math.abs((value - mean) / std);
            return {
                index: index,
                value: value,
                zScore: zScore,
                isAnomaly: zScore > threshold
            };
        }).filter(item => item.isAnomaly);
        
        return {
            anomalies: anomalies,
            percentage: (anomalies.length / cpueData.length) * 100,
            threshold: threshold,
            recommendation: this.anomalyRecommendation(anomalies)
        };
    }
    
    // 유틸리티 함수들
    mean(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
    
    std(arr) {
        const m = this.mean(arr);
        return Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / (arr.length - 1));
    }
    
    movingAverage(data, window) {
        const result = [];
        for (let i = window - 1; i < data.length; i++) {
            const windowData = data.slice(i - window + 1, i + 1);
            result.push(this.mean(windowData));
        }
        return result;
    }
    
    calculateTrend(data, time) {
        // 선형 회귀로 추세 계산
        const n = data.length;
        const sumX = time.reduce((a, b) => a + b, 0);
        const sumY = data.reduce((a, b) => a + b, 0);
        const sumXY = time.reduce((sum, x, i) => sum + x * data[i], 0);
        const sumX2 = time.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return {
            slope: slope,
            intercept: intercept,
            direction: slope > 0 ? '증가' : slope < 0 ? '감소' : '정체',
            strength: Math.abs(slope)
        };
    }
    
    interpretCPUE(cv) {
        if (cv < 30) return '안정적인 어획률';
        if (cv < 50) return '보통 변동성';
        if (cv < 80) return '높은 변동성';
        return '매우 불안정한 어획률';
    }
    
    detectSeasonality(data) {
        // 간단한 계절성 검정 (실제로는 더 복잡한 방법 필요)
        const quarters = [];
        const chunkSize = Math.floor(data.length / 4);
        
        for (let i = 0; i < 4; i++) {
            const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
            quarters.push(this.mean(chunk));
        }
        
        const variation = this.std(quarters) / this.mean(quarters);
        
        return {
            hasSeasonality: variation > 0.1,
            quarterlyMeans: quarters,
            variation: variation
        };
    }
    
    detectChangePoints(data) {
        // 간단한 변화점 탐지 (CUSUM 방법 간소화)
        const changePoints = [];
        const mean = this.mean(data);
        let cusum = 0;
        const threshold = this.std(data) * 2;
        
        for (let i = 0; i < data.length; i++) {
            cusum += data[i] - mean;
            if (Math.abs(cusum) > threshold) {
                changePoints.push({
                    index: i,
                    value: data[i],
                    cusum: cusum
                });
                cusum = 0; // Reset
            }
        }
        
        return changePoints;
    }
    
    extractTrend(data) {
        const time = Array.from({length: data.length}, (_, i) => i);
        return this.calculateTrend(data, time);
    }
    
    calculateCI(forecast, confidence = 0.95) {
        // 간단한 신뢰구간 계산
        const std = this.std(forecast);
        const z = 1.96; // 95% 신뢰구간
        
        return forecast.map(value => ({
            lower: value - z * std,
            upper: value + z * std
        }));
    }
    
    calculateAccuracy(actual, predicted) {
        // MAE, RMSE 등 계산
        const errors = actual.slice(-predicted.length).map((a, i) => 
            Math.abs(a - predicted[i])
        );
        
        return {
            mae: this.mean(errors),
            rmse: Math.sqrt(this.mean(errors.map(e => e * e))),
            mape: this.mean(errors.map((e, i) => 
                e / actual[actual.length - predicted.length + i] * 100
            ))
        };
    }
    
    calculateProductivity(data) {
        return data.totalCatch / data.totalArea;
    }
    
    identifyHotspots(cpue, locations) {
        // 상위 20% CPUE 지역 식별
        const threshold = this.percentile(cpue, 80);
        return locations.filter((loc, i) => cpue[i] >= threshold);
    }
    
    compareAreas(areaAnalysis) {
        const areas = Object.keys(areaAnalysis);
        const cpueValues = areas.map(area => areaAnalysis[area].meanCPUE);
        
        return {
            best: areas[cpueValues.indexOf(Math.max(...cpueValues))],
            worst: areas[cpueValues.indexOf(Math.min(...cpueValues))],
            variance: this.std(cpueValues) / this.mean(cpueValues)
        };
    }
    
    generateRecommendations(analysis) {
        const recommendations = [];
        
        for (const [area, data] of Object.entries(analysis)) {
            if (data.meanCPUE < this.mean(Object.values(analysis).map(a => a.meanCPUE))) {
                recommendations.push(`${area}: 어획 노력 재배치 고려`);
            }
        }
        
        return recommendations;
    }
    
    anomalyRecommendation(anomalies) {
        if (anomalies.length === 0) return '정상 범위';
        if (anomalies.length < 3) return '일시적 변동 모니터링';
        return '체계적인 원인 분석 필요';
    }
    
    percentile(data, p) {
        const sorted = [...data].sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index];
    }
}

// 전역 노출 (HTML에서 사용)
window.CPUEAnalysis = CPUEAnalysis;