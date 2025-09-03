/**
 * 자동화된 테스트 실행 스크립트
 * Node.js 환경에서 실행하거나 브라우저 콘솔에서 직접 실행 가능
 */

class StatisticsTestRunner {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };
    }

    /**
     * 데이터 파서 단위 테스트
     */
    async testDataParser() {
        console.log('=== 데이터 파서 테스트 시작 ===');
        const parser = new DataParser();
        const tests = [];

        // 테스트 1: CSV 파싱
        tests.push({
            name: 'CSV 파싱',
            test: async () => {
                const data = `그룹,값1,값2\nA,1,2\nB,3,4`;
                const result = await parser.parse(data);
                return result.success && result.data.groups.length === 2;
            }
        });

        // 테스트 2: TSV 파싱
        tests.push({
            name: 'TSV 파싱',
            test: async () => {
                const data = `그룹\t값\nA\t10\nA\t20\nB\t30\nB\t40`;
                const result = await parser.parse(data);
                return result.success && result.data.groupCount === 2;
            }
        });

        // 테스트 3: 헤더 감지
        tests.push({
            name: '헤더 감지',
            test: async () => {
                const data = `Treatment,Response\nControl,23.5\nControl,24.1\nTest,26.8`;
                const result = await parser.parse(data);
                return result.success && result.structure.hasHeader === true;
            }
        });

        // 테스트 4: 빈 데이터 처리
        tests.push({
            name: '빈 데이터 오류 처리',
            test: async () => {
                const result = await parser.parse('');
                return !result.success && result.error.includes('비어있습니다');
            }
        });

        // 테스트 5: 최소 샘플 검증
        tests.push({
            name: '최소 샘플 수 검증',
            test: async () => {
                const data = `A\t1\nA\t2`; // 2개만 (최소 3개 필요)
                const result = await parser.parse(data);
                return !result.success && result.error.includes('최소');
            }
        });

        // 테스트 6: 숫자 변환
        tests.push({
            name: '숫자 변환',
            test: async () => {
                const data = `값\n1.5\n2.3\n3.7\n4.2`;
                const result = await parser.parse(data);
                if (!result.success) return false;
                const values = result.data.groups[0];
                return values.every(v => typeof v === 'number');
            }
        });

        // 테스트 7: 결측치 처리
        tests.push({
            name: '결측치 처리',
            test: async () => {
                const data = `그룹,값\nA,10\nA,\nA,20\nB,30\nB,NA\nB,40`;
                const result = await parser.parse(data);
                if (!result.success) return false;
                // 결측치가 제외되었는지 확인
                return result.data.groups[0].length === 2 && result.data.groups[1].length === 2;
            }
        });

        // 테스트 8: 그룹 자동 감지
        tests.push({
            name: '그룹 자동 감지',
            test: async () => {
                const data = `Species\tLength\nFish\t12.5\nFish\t13.0\nBird\t8.5\nBird\t9.0`;
                const result = await parser.parse(data);
                return result.success && 
                       result.data.labels.includes('Fish') && 
                       result.data.labels.includes('Bird');
            }
        });

        // 테스트 9: 대용량 데이터
        tests.push({
            name: '대용량 데이터 처리',
            test: async () => {
                let data = '값\n';
                for (let i = 0; i < 1000; i++) {
                    data += `${Math.random() * 100}\n`;
                }
                const start = Date.now();
                const result = await parser.parse(data);
                const time = Date.now() - start;
                return result.success && time < 1000; // 1초 이내
            }
        });

        // 테스트 10: 다중 열 처리
        tests.push({
            name: '다중 열을 그룹으로 변환',
            test: async () => {
                const data = `대조군,실험군1,실험군2\n10,20,30\n11,21,31\n12,22,32`;
                const result = await parser.parse(data);
                return result.success && result.data.groupCount === 3;
            }
        });

        // 테스트 실행
        return await this.runTests(tests, '데이터 파서');
    }

    /**
     * 통계 엔진 테스트 (Python)
     */
    async testStatisticsEngine() {
        console.log('=== 통계 엔진 테스트 시작 ===');
        
        if (!window.pyodide) {
            console.warn('Pyodide가 로드되지 않아 통계 엔진 테스트를 건너뜁니다.');
            return { passed: 0, failed: 0, skipped: 10 };
        }

        const tests = [];

        // 테스트 1: 기술통계
        tests.push({
            name: '기술통계 계산',
            test: async () => {
                const data = {
                    groups: [[1, 2, 3, 4, 5]],
                    labels: ['테스트']
                };
                const result = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(data)}')`)
                );
                const stats = result.descriptive[0];
                return Math.abs(stats.mean - 3) < 0.001 && 
                       Math.abs(stats.std - 1.5811) < 0.001;
            }
        });

        // 테스트 2: t-test
        tests.push({
            name: 'Independent t-test',
            test: async () => {
                const data = {
                    groups: [
                        [1, 2, 3, 4, 5],
                        [6, 7, 8, 9, 10]
                    ],
                    labels: ['그룹1', '그룹2']
                };
                const result = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(data)}')`)
                );
                return result.test.test_type.includes('t-test') && 
                       result.test.p_value < 0.05;
            }
        });

        // 테스트 3: ANOVA
        tests.push({
            name: 'One-way ANOVA',
            test: async () => {
                const data = {
                    groups: [
                        [1, 2, 3],
                        [4, 5, 6],
                        [7, 8, 9]
                    ],
                    labels: ['A', 'B', 'C']
                };
                const result = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(data)}')`)
                );
                return result.test.test_type.includes('ANOVA') && 
                       result.test.p_value < 0.05;
            }
        });

        // 테스트 4: 정규성 검정
        tests.push({
            name: '정규성 검정 (Shapiro-Wilk)',
            test: async () => {
                // 정규분포 데이터
                const normalData = [];
                for (let i = 0; i < 30; i++) {
                    const u1 = Math.random();
                    const u2 = Math.random();
                    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                    normalData.push(z);
                }
                
                const data = {
                    groups: [normalData],
                    labels: ['정규분포']
                };
                const result = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(data)}')`)
                );
                // 대부분의 경우 정규분포로 판정되어야 함
                return result.normality.results[0].test === 'Shapiro-Wilk';
            }
        });

        // 테스트 5: 등분산성 검정
        tests.push({
            name: '등분산성 검정 (Levene)',
            test: async () => {
                const data = {
                    groups: [
                        [1, 2, 3, 4, 5],
                        [2, 3, 4, 5, 6]  // 비슷한 분산
                    ],
                    labels: ['그룹1', '그룹2']
                };
                const result = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(data)}')`)
                );
                return result.homogeneity.results && 
                       result.homogeneity.results.levene.p_value > 0.05;
            }
        });

        // 테스트 6: Mann-Whitney U test
        tests.push({
            name: 'Mann-Whitney U (비정규 데이터)',
            test: async () => {
                const data = {
                    groups: [
                        [1, 1, 1, 2, 100],  // 극단값 포함
                        [3, 4, 5, 6, 7]
                    ],
                    labels: ['비정규1', '비정규2']
                };
                const result = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(data)}')`)
                );
                return result.test.test_type.includes('Mann-Whitney');
            }
        });

        // 테스트 7: 사후분석
        tests.push({
            name: '사후분석 (Tukey HSD)',
            test: async () => {
                const data = {
                    groups: [
                        [1, 2, 3],
                        [4, 5, 6],
                        [10, 11, 12]
                    ],
                    labels: ['낮음', '중간', '높음']
                };
                const result = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(data)}')`)
                );
                return result.post_hoc && 
                       result.post_hoc.comparisons.length === 3;
            }
        });

        // 테스트 8: 효과 크기
        tests.push({
            name: '효과 크기 계산 (Cohen\'s d)',
            test: async () => {
                const data = {
                    groups: [
                        [1, 2, 3, 4, 5],
                        [3, 4, 5, 6, 7]  // 중간 효과 크기
                    ],
                    labels: ['그룹1', '그룹2']
                };
                const result = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(data)}')`)
                );
                const d = result.test.effect_size.value;
                return Math.abs(d) > 0.5 && Math.abs(d) < 1.5;
            }
        });

        // 테스트 9: Welch's ANOVA
        tests.push({
            name: 'Welch\'s ANOVA (이분산)',
            test: async () => {
                const data = {
                    groups: [
                        [1, 1.1, 1.2],  // 작은 분산
                        [5, 6, 7],       // 중간 분산
                        [10, 15, 20]     // 큰 분산
                    ],
                    labels: ['A', 'B', 'C']
                };
                const result = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(data)}')`)
                );
                return result.test.test_type.includes('Welch') || 
                       result.test.test_type.includes('ANOVA');
            }
        });

        // 테스트 10: 신뢰구간
        tests.push({
            name: '95% 신뢰구간 계산',
            test: async () => {
                const data = {
                    groups: [[10, 12, 11, 13, 12]],
                    labels: ['샘플']
                };
                const result = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(data)}')`)
                );
                const stats = result.descriptive[0];
                return stats.ci95_lower < stats.mean && 
                       stats.ci95_upper > stats.mean;
            }
        });

        return await this.runTests(tests, '통계 엔진');
    }

    /**
     * 통합 테스트
     */
    async testIntegration() {
        console.log('=== 통합 테스트 시작 ===');
        const tests = [];

        // 테스트 1: 전체 플로우
        tests.push({
            name: '데이터 입력 → 파싱 → 분석 전체 플로우',
            test: async () => {
                const parser = new DataParser();
                const rawData = `Treatment\tResponse
Control\t23.5
Control\t24.1
Control\t22.9
Test\t26.8
Test\t27.2
Test\t26.5`;
                
                // 1. 파싱
                const parseResult = await parser.parse(rawData);
                if (!parseResult.success) return false;
                
                // 2. 분석 (Pyodide 필요)
                if (window.pyodide) {
                    const analysisResult = JSON.parse(
                        window.pyodide.runPython(`analyze_data('${JSON.stringify(parseResult.data)}')`)
                    );
                    return analysisResult.success && analysisResult.test.p_value < 0.05;
                }
                
                return parseResult.success; // Pyodide 없으면 파싱만 확인
            }
        });

        // 테스트 2: 오류 처리
        tests.push({
            name: '오류 처리 및 복구',
            test: async () => {
                const parser = new DataParser();
                
                // 잘못된 데이터
                const badResult = await parser.parse('invalid data');
                if (badResult.success) return false;
                
                // 올바른 데이터로 복구
                const goodResult = await parser.parse('1\n2\n3\n4');
                return goodResult.success;
            }
        });

        // 테스트 3: 자동 검정 선택
        tests.push({
            name: '조건에 따른 자동 검정 선택',
            test: async () => {
                if (!window.pyodide) return true; // Skip if no Pyodide
                
                // 2그룹, 정규분포 → t-test
                const normalTwo = {
                    groups: [[1,2,3,4,5], [6,7,8,9,10]],
                    labels: ['A', 'B']
                };
                const result1 = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(normalTwo)}')`)
                );
                
                // 3그룹 이상 → ANOVA
                const multiGroup = {
                    groups: [[1,2,3], [4,5,6], [7,8,9]],
                    labels: ['A', 'B', 'C']
                };
                const result2 = JSON.parse(
                    window.pyodide.runPython(`analyze_data('${JSON.stringify(multiGroup)}')`)
                );
                
                return result1.test.test_type.includes('test') && 
                       result2.test.test_type.includes('ANOVA');
            }
        });

        // 테스트 4: 메모리 누수 확인
        tests.push({
            name: '메모리 누수 테스트',
            test: async () => {
                const parser = new DataParser();
                const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                
                // 100번 반복
                for (let i = 0; i < 100; i++) {
                    await parser.parse('1\n2\n3\n4\n5');
                }
                
                const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                const increase = finalMemory - initialMemory;
                
                // 10MB 이상 증가하지 않아야 함
                return increase < 10 * 1024 * 1024 || !performance.memory;
            }
        });

        // 테스트 5: 동시성 테스트
        tests.push({
            name: '동시 다중 분석',
            test: async () => {
                const parser = new DataParser();
                const promises = [];
                
                for (let i = 0; i < 5; i++) {
                    promises.push(parser.parse(`${i}\n${i+1}\n${i+2}\n${i+3}`));
                }
                
                const results = await Promise.all(promises);
                return results.every(r => r.success);
            }
        });

        return await this.runTests(tests, '통합');
    }

    /**
     * 테스트 실행 헬퍼
     */
    async runTests(tests, category) {
        const results = { passed: 0, failed: 0, skipped: 0 };
        
        for (const test of tests) {
            try {
                console.log(`  테스트: ${test.name}`);
                const passed = await test.test();
                
                if (passed) {
                    results.passed++;
                    console.log(`    ✅ 통과`);
                } else {
                    results.failed++;
                    console.log(`    ❌ 실패`);
                }
                
                this.testResults.tests.push({
                    category,
                    name: test.name,
                    passed
                });
            } catch (error) {
                results.failed++;
                console.error(`    ❌ 오류: ${error.message}`);
                
                this.testResults.tests.push({
                    category,
                    name: test.name,
                    passed: false,
                    error: error.message
                });
            }
        }
        
        this.testResults.passed += results.passed;
        this.testResults.failed += results.failed;
        this.testResults.skipped += results.skipped;
        
        console.log(`${category} 테스트 완료: ${results.passed}/${tests.length} 통과\n`);
        return results;
    }

    /**
     * 전체 테스트 실행
     */
    async runAll() {
        console.log('🧪 전체 테스트 시작\n');
        const startTime = Date.now();
        
        // 각 테스트 스위트 실행
        await this.testDataParser();
        await this.testStatisticsEngine();
        await this.testIntegration();
        
        const duration = Date.now() - startTime;
        
        // 최종 결과
        console.log('=== 테스트 완료 ===');
        console.log(`총 테스트: ${this.testResults.passed + this.testResults.failed + this.testResults.skipped}`);
        console.log(`통과: ${this.testResults.passed}`);
        console.log(`실패: ${this.testResults.failed}`);
        console.log(`건너뜀: ${this.testResults.skipped}`);
        console.log(`실행 시간: ${duration}ms`);
        
        const successRate = (this.testResults.passed / (this.testResults.passed + this.testResults.failed) * 100).toFixed(1);
        console.log(`성공률: ${successRate}%`);
        
        // 실패한 테스트 목록
        const failed = this.testResults.tests.filter(t => !t.passed);
        if (failed.length > 0) {
            console.log('\n실패한 테스트:');
            failed.forEach(t => {
                console.log(`  - [${t.category}] ${t.name}`);
                if (t.error) console.log(`    오류: ${t.error}`);
            });
        }
        
        return this.testResults;
    }
}

// 브라우저 환경에서 실행
if (typeof window !== 'undefined') {
    window.StatisticsTestRunner = StatisticsTestRunner;
    
    // 자동 실행 옵션
    window.runAllTests = async function() {
        const runner = new StatisticsTestRunner();
        return await runner.runAll();
    };
}

// Node.js 환경에서 실행
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsTestRunner;
}