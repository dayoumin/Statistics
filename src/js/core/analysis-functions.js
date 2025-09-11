// 핵심 분석 함수들
// statistical-analysis-platform.html에서 추출한 주요 분석 함수들

// 디버그 로거 생성
const analysisDebug = window.debug || { log: () => {}, error: analysisDebug.error, warn: console.warn };

// 데이터 검증
async function validateData(force = false) {
    analysisDebug.log('validateData 호출됨', { force, currentData: !!currentData, dataKeys: currentData ? Object.keys(currentData) : null, pyodide: !!pyodide });
    
    if (!currentData) {
        document.getElementById('dataValidation').innerHTML = 
            '<div class="warning-box">데이터가 없습니다. 파일을 먼저 업로드해주세요.</div>';
        return;
    }
    
    // 이미 검증된 경우 재사용
    if (analysisResults.validation && !force) {
        displayValidationResults(analysisResults.validation);
        return;
    }
    
    const columns = Object.keys(currentData);
    const rowCount = currentData[columns[0]].length;
    
    // 기본 정보 표시
    const rowCountEl = document.getElementById('rowCount');
    const colCountEl = document.getElementById('colCount');
    
    if (rowCountEl) rowCountEl.textContent = rowCount;
    if (colCountEl) colCountEl.textContent = columns.length;
    
    analysisDebug.log(`[VALIDATION] 데이터 크기: ${rowCount}행 × ${columns.length}열`);
    
    // 변수 타입 분석
    const issues = [];
    const numericColumns = [];
    const groupColumns = [];
    const textColumns = [];
    
    for (const col of columns) {
        const values = currentData[col];
        const validValues = values.filter(v => v !== null && v !== '' && v !== undefined);
        
        if (validValues.length === 0) {
            issues.push(`${col}: 모든 값이 비어있음`);
            continue;
        }
        
        // 숫자 변환 시도
        const numericValues = validValues.filter(v => !isNaN(Number(v)));
        const numericRatio = numericValues.length / validValues.length;
        
        if (numericRatio >= 0.8) {
            numericColumns.push(col);
        } else {
            const uniqueValues = [...new Set(validValues)];
            if (uniqueValues.length <= Math.max(10, values.length * 0.5)) {
                groupColumns.push(col);
            } else {
                textColumns.push(col);
            }
        }
    }
    
    // 검증 결과 저장
    analysisResults.validation = {
        numericColumns: numericColumns,
        groupColumns: groupColumns,
        textColumns: textColumns,
        issues: issues,
        isValid: issues.length === 0
    };
    
    // 결과 표시
    displayValidationResults(analysisResults.validation);
    
    // 다음 단계 버튼 활성화
    if (analysisResults.validation.isValid) {
        const proceedBtn = document.querySelector('#step2Content button');
        if (proceedBtn) {
            proceedBtn.disabled = false;
        }
    }
}

// 가정 검정
async function testAssumptions() {
    // 이미 결과가 있으면 표시만
    if (analysisResults.assumptions) {
        displayAssumptionResults(analysisResults.assumptions);
        return;
    }
    
    if (!currentData || !analysisResults.validation) {
        alert('먼저 데이터를 검증해주세요.');
        return;
    }
    
    // Pyodide 준비 확인
    analysisDebug.log('[TEST] pyodide 변수 확인:', typeof pyodide, ', window.pyodide:', typeof window.pyodide);
    if (!pyodide) {
        analysisDebug.log('[TEST] pyodide 변수가 없음, 대기 중...');
        document.getElementById('normalityResults').innerHTML = `
            <div class="warning-box">
                <p class="font-semibold">⏳ 통계 엔진 로딩 중...</p>
                <p class="text-sm">잠시만 기다려주세요. Pyodide를 초기화하는 중입니다.</p>
            </div>`;
        document.getElementById('homogeneityResults').innerHTML = `
            <div class="warning-box">
                <p class="text-sm">통계 엔진 로딩 대기 중...</p>
            </div>`;
        
        try {
            await pyodideReady;
            analysisDebug.log('pyodideReady Promise 완료');
            if (!pyodide && window.pyodide) {
                pyodide = window.pyodide;
            }
        } catch (error) {
            analysisDebug.error('Pyodide 초기화 대기 중 오류:', error);
            document.getElementById('normalityResults').innerHTML = `
                <div class="error-box">
                    <p class="font-semibold">⚠️ 통계 엔진 초기화 실패</p>
                    <p class="text-sm">${error.message}</p>
                    <button onclick="location.reload()" class="btn-secondary text-sm mt-2">새로고침</button>
                </div>`;
            return;
        }
    }
    
    // 분석 시작
    document.getElementById('normalityResults').innerHTML = '<p class="text-gray-600">정규성 검정 중...</p>';
    document.getElementById('homogeneityResults').innerHTML = '<p class="text-gray-600">등분산성 검정 중...</p>';
    
    const numericColumns = analysisResults.validation.numericColumns || [];
    let groupColumns = analysisResults.validation.groupColumns || [];
    
    const normalityResults = [];
    const homogeneityResults = [];
    
    try {
        // 정규성 검정 - 각 수치형 변수에 대해
        for (const col of numericColumns) {
            const values = currentData[col].filter(v => !isNaN(Number(v)) && v !== '');
            const nums = values.map(v => parseFloat(v));
            
            if (nums.length < 3) {
                normalityResults.push({
                    variable: col,
                    test: 'N/A',
                    statistic: null,
                    pValue: null,
                    isNormal: false,
                    interpretation: '표본 수 부족 (n < 3)',
                    sampleSize: nums.length
                });
                continue;
            }
            
            // Python으로 정규성 검정 실행
            analysisDebug.log(`${col} 변수 정규성 검정 시작 (n=${nums.length})`);
            pyodide.globals.set('test_values', nums);
            const result = await pyodide.runPythonAsync(`
                import json
                result = test_normality(test_values)
                json.dumps(result)
            `);
            
            const normResult = JSON.parse(result);
            
            normalityResults.push({
                variable: col,
                test: normResult.test,
                statistic: normResult.statistic,
                pValue: normResult.pValue,
                isNormal: normResult.isNormal,
                skewness: normResult.skewness,
                kurtosis: normResult.kurtosis,
                sampleSize: normResult.n,
                interpretation: normResult.isNormal ? 
                    `정규분포를 따름 (${normResult.test}, p = ${normResult.pValue?.toFixed(3)} > 0.05)` : 
                    `정규분포를 따르지 않음 (${normResult.test}, p = ${normResult.pValue?.toFixed(3)} < 0.05)`,
                recommendation: !normResult.isNormal ? 
                    '비모수 검정 또는 데이터 변환을 고려하세요' : 
                    '모수 검정 사용 가능'
            });
        }
        
        // 등분산성 검정 - 그룹이 있는 경우
        if (groupColumns.length > 0) {
            for (const numCol of numericColumns) {
                for (const groupCol of groupColumns) {
                    // 그룹별 데이터 준비
                    const groupsData = {};
                    for (let i = 0; i < currentData[groupCol].length; i++) {
                        const group = currentData[groupCol][i];
                        const value = currentData[numCol][i];
                        
                        if (group && !isNaN(parseFloat(value))) {
                            if (!groupsData[group]) groupsData[group] = [];
                            groupsData[group].push(parseFloat(value));
                        }
                    }
                    
                    // 그룹이 2개 이상인 경우만 검정
                    const validGroups = Object.entries(groupsData)
                        .filter(([_, vals]) => vals.length >= 2);
                    
                    if (validGroups.length < 2) {
                        continue;
                    }
                    
                    // Python으로 등분산성 검정 실행
                    analysisDebug.log(`${numCol} vs ${groupCol} 등분산성 검정 시작 (그룹 수: ${validGroups.length})`);
                    const groupsDict = Object.fromEntries(validGroups);
                    pyodide.globals.set('test_groups', groupsDict);
                    const homResult = await pyodide.runPythonAsync(`
                        import json
                        result = test_homogeneity(test_groups)
                        json.dumps(result)
                    `);
                    
                    const homData = JSON.parse(homResult);
                    
                    homogeneityResults.push({
                        variables: `${numCol} by ${groupCol}`,
                        test: homData.test,
                        statistic: homData.statistic,
                        pValue: homData.pValue,
                        isHomogeneous: homData.isHomogeneous,
                        groups: validGroups.length,
                        variances: homData.variances,
                        interpretation: homData.isHomogeneous ?
                            `등분산 가정 충족 (p = ${homData.pValue?.toFixed(3)} > 0.05)` :
                            `등분산 가정 위배 (p = ${homData.pValue?.toFixed(3)} < 0.05)`,
                        recommendation: homData.isHomogeneous ?
                            'ANOVA 사용 가능' : 'Welch ANOVA 또는 Kruskal-Wallis 검정 추천'
                    });
                }
            }
        }
        
        // 결과 저장
        analysisResults.assumptions = {
            normality: normalityResults,
            homogeneity: homogeneityResults
        };
        
        // 결과 표시
        displayAssumptionResults(analysisResults.assumptions);
        
    } catch (error) {
        analysisDebug.error('가정 검정 오류:', error);
        document.getElementById('normalityResults').innerHTML = `
            <div class="error-box">
                <p class="font-semibold">오류 발생</p>
                <p class="text-sm">${error.message}</p>
            </div>`;
    }
}

// 방법 추천
function recommendMethod() {
    // 이미 결과가 있으면 표시만
    if (analysisResults.method) {
        displayMethodRecommendation(analysisResults.method);
        return;
    }
    
    if (!analysisResults.assumptions) {
        alert('먼저 가정 검정을 수행해주세요.');
        return;
    }
    
    const normality = analysisResults.assumptions.normality;
    const homogeneity = analysisResults.assumptions.homogeneity;
    
    // 그룹 변수 확인
    const groupColumns = analysisResults.validation.groupColumns || [];
    const numericColumns = analysisResults.validation.numericColumns || [];
    
    let recommendation = {
        method: '',
        reason: '',
        alternatives: [],
        parameters: {}
    };
    
    // 그룹이 있는 경우
    if (groupColumns.length > 0 && numericColumns.length > 0) {
        // 그룹 수 확인
        const uniqueGroups = [...new Set(currentData[groupColumns[0]].filter(v => v))];
        const groupCount = uniqueGroups.length;
        
        if (groupCount === 2) {
            // 2그룹 비교
            const isNormal = normality.some(r => r.isNormal);
            const isHomogeneous = homogeneity.length > 0 ? homogeneity[0].isHomogeneous : true;
            
            if (isNormal && isHomogeneous) {
                recommendation.method = 'Independent t-test';
                recommendation.reason = '두 그룹 비교, 정규성과 등분산성 충족';
            } else if (isNormal && !isHomogeneous) {
                recommendation.method = "Welch's t-test";
                recommendation.reason = '두 그룹 비교, 정규성은 충족하나 등분산성 위배';
            } else {
                recommendation.method = 'Mann-Whitney U test';
                recommendation.reason = '두 그룹 비교, 정규성 가정 위배';
                recommendation.alternatives = ['데이터 변환 후 t-test', 'Permutation test'];
            }
        } else if (groupCount > 2) {
            // 3그룹 이상 비교
            const allNormal = normality.every(r => r.isNormal);
            const isHomogeneous = homogeneity.length > 0 ? homogeneity[0].isHomogeneous : true;
            
            if (allNormal && isHomogeneous) {
                recommendation.method = 'One-way ANOVA';
                recommendation.reason = '세 그룹 이상 비교, 정규성과 등분산성 충족';
                recommendation.postHoc = 'Tukey HSD';
            } else if (allNormal && !isHomogeneous) {
                recommendation.method = 'Welch ANOVA';
                recommendation.reason = '세 그룹 이상 비교, 정규성은 충족하나 등분산성 위배';
                recommendation.postHoc = 'Games-Howell';
            } else {
                recommendation.method = 'Kruskal-Wallis test';
                recommendation.reason = '세 그룹 이상 비교, 정규성 가정 위배';
                recommendation.postHoc = "Dunn's test";
                recommendation.alternatives = ['데이터 변환 후 ANOVA'];
            }
        }
    } else if (numericColumns.length >= 2) {
        // 상관/회귀 분석
        const allNormal = normality.every(r => r.isNormal);
        
        if (allNormal) {
            recommendation.method = 'Pearson correlation / Linear regression';
            recommendation.reason = '연속형 변수들 간의 관계 분석, 정규성 충족';
        } else {
            recommendation.method = 'Spearman correlation';
            recommendation.reason = '연속형 변수들 간의 관계 분석, 정규성 가정 위배';
            recommendation.alternatives = ['Kendall tau', '데이터 변환 후 Pearson'];
        }
    } else {
        recommendation.method = '기술통계';
        recommendation.reason = '비교할 그룹이나 변수가 부족함';
        recommendation.suggestions = '그룹 변수를 추가하거나 더 많은 수치 변수를 포함시켜주세요';
    }
    
    // 결과 저장
    analysisResults.method = recommendation;
    
    // 표시
    displayMethodRecommendation(recommendation);
}

// 분석 실행
async function runAnalysis() {
    // 이미 결과가 있으면 바로 6단계로
    if (analysisResults.final) {
        moveToStep(6, true);
        displayResults();
        return;
    }
    
    if (!analysisResults.method) {
        alert('먼저 통계 방법을 선택해주세요.');
        return;
    }
    
    // 분석 진행 상황 표시
    const progressEl = document.getElementById('analysisProgress');
    progressEl.textContent = '분석 준비 중...';
    
    try {
        const method = analysisResults.method.method;
        const groupCol = analysisResults.validation.groupColumns[0];
        const valueCol = analysisResults.validation.numericColumns[0];
        
        // 그룹별 데이터 준비
        if (groupCol && valueCol) {
            const groups = {};
            for (let i = 0; i < currentData[groupCol].length; i++) {
                const group = currentData[groupCol][i];
                const value = parseFloat(currentData[valueCol][i]);
                
                if (group && !isNaN(value)) {
                    if (!groups[group]) groups[group] = [];
                    groups[group].push(value);
                }
            }
            
            progressEl.textContent = '통계 검정 수행 중...';
            
            // 통계 검정 실행 (method에 따라 다른 검정)
            let testResult = {};
            
            pyodide.globals.set('groups_data', groups);
            pyodide.globals.set('method_name', method);
            
            const result = await pyodide.runPythonAsync(`
                import json
                import numpy as np
                from scipy import stats
                
                # 그룹 데이터 준비
                groups_list = []
                group_names = []
                for name, values in groups_data.items():
                    if hasattr(groups_data, 'to_py'):
                        groups_data = groups_data.to_py()
                    groups_list.append(np.array(groups_data[name]))
                    group_names.append(name)
                
                result = {}
                
                # 검정 수행
                if 'ANOVA' in method_name or 'Kruskal' in method_name:
                    if 'ANOVA' in method_name:
                        stat, p_value = stats.f_oneway(*groups_list)
                        result['test'] = 'One-way ANOVA'
                    else:
                        stat, p_value = stats.kruskal(*groups_list)
                        result['test'] = 'Kruskal-Wallis'
                    
                    result['statistic'] = float(stat)
                    result['pValue'] = float(p_value)
                    result['significant'] = p_value < 0.05
                    
                elif 't-test' in method_name or 'Mann-Whitney' in method_name:
                    if len(groups_list) >= 2:
                        if 't-test' in method_name:
                            if 'Welch' in method_name:
                                stat, p_value = stats.ttest_ind(groups_list[0], groups_list[1], equal_var=False)
                                result['test'] = "Welch's t-test"
                            else:
                                stat, p_value = stats.ttest_ind(groups_list[0], groups_list[1])
                                result['test'] = 'Independent t-test'
                        else:
                            stat, p_value = stats.mannwhitneyu(groups_list[0], groups_list[1])
                            result['test'] = 'Mann-Whitney U'
                        
                        result['statistic'] = float(stat)
                        result['pValue'] = float(p_value)
                        result['significant'] = p_value < 0.05
                        
                        # 효과 크기 계산
                        mean1, mean2 = np.mean(groups_list[0]), np.mean(groups_list[1])
                        std1, std2 = np.std(groups_list[0], ddof=1), np.std(groups_list[1], ddof=1)
                        n1, n2 = len(groups_list[0]), len(groups_list[1])
                        
                        pooled_std = np.sqrt(((n1-1)*std1**2 + (n2-1)*std2**2) / (n1+n2-2))
                        cohens_d = (mean1 - mean2) / pooled_std if pooled_std > 0 else 0
                        
                        result['effectSize'] = float(cohens_d)
                        result['means'] = [float(mean1), float(mean2)]
                        result['stds'] = [float(std1), float(std2)]
                        result['ns'] = [n1, n2]
                
                # 기술통계
                result['descriptive'] = {}
                for i, (name, group) in enumerate(zip(group_names, groups_list)):
                    result['descriptive'][name] = {
                        'mean': float(np.mean(group)),
                        'std': float(np.std(group, ddof=1)),
                        'median': float(np.median(group)),
                        'min': float(np.min(group)),
                        'max': float(np.max(group)),
                        'n': len(group),
                        'ci95': [float(np.mean(group) - 1.96*np.std(group, ddof=1)/np.sqrt(len(group))),
                                float(np.mean(group) + 1.96*np.std(group, ddof=1)/np.sqrt(len(group)))]
                    }
                
                json.dumps(result)
            `);
            
            testResult = JSON.parse(result);
            
            progressEl.textContent = '결과 정리 중...';
            
            // 사후분석 (필요시)
            let postHocResult = null;
            if (testResult.significant && analysisResults.method.postHoc) {
                // 간단한 사후분석 구현
                postHocResult = {
                    method: analysisResults.method.postHoc,
                    comparisons: []
                };
                
                // 모든 쌍별 비교
                const groupNames = Object.keys(groups);
                for (let i = 0; i < groupNames.length - 1; i++) {
                    for (let j = i + 1; j < groupNames.length; j++) {
                        const g1 = groups[groupNames[i]];
                        const g2 = groups[groupNames[j]];
                        
                        pyodide.globals.set('g1', g1);
                        pyodide.globals.set('g2', g2);
                        
                        const pairResult = await pyodide.runPythonAsync(`
                            import json
                            from scipy import stats
                            import numpy as np
                            
                            # 쌍별 비교
                            stat, p_value = stats.ttest_ind(g1, g2)
                            
                            # Bonferroni 보정
                            n_comparisons = ${(groupNames.length * (groupNames.length - 1)) / 2}
                            adjusted_p = min(p_value * n_comparisons, 1.0)
                            
                            result = {
                                'stat': float(stat),
                                'pValue': float(p_value),
                                'adjustedP': float(adjusted_p),
                                'significant': adjusted_p < 0.05,
                                'meanDiff': float(np.mean(g1) - np.mean(g2))
                            }
                            json.dumps(result)
                        `);
                        
                        const pairData = JSON.parse(pairResult);
                        
                        postHocResult.comparisons.push({
                            group1: groupNames[i],
                            group2: groupNames[j],
                            ...pairData
                        });
                    }
                }
            }
            
            // 최종 결과 저장
            analysisResults.statistics = testResult;
            analysisResults.postHoc = postHocResult;
            analysisResults.final = {
                method: analysisResults.method.method,
                test: testResult.test,
                statistic: testResult.statistic,
                pValue: testResult.pValue,
                significant: testResult.significant,
                effectSize: testResult.effectSize,
                descriptive: testResult.descriptive,
                postHoc: postHocResult
            };
            
            // 6단계로 이동
            moveToStep(6);
            displayFinalResults();
            
        } else {
            alert('분석할 데이터가 충분하지 않습니다.');
        }
        
    } catch (error) {
        analysisDebug.error('분석 실행 오류:', error);
        progressEl.textContent = `오류 발생: ${error.message}`;
    }
}

// 최종 결과 표시
function displayFinalResults() {
    if (!analysisResults.final) return;
    
    const results = analysisResults.final;
    const resultsDiv = document.getElementById('analysisResults');
    
    // 주요 결과 요약
    let summaryHTML = `
        <div class="bg-white p-6 rounded-lg mb-4">
            <h4 class="text-lg font-bold mb-3">📊 통계 검정 결과</h4>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-600">검정 방법</p>
                    <p class="font-semibold">${results.test}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">검정통계량</p>
                    <p class="font-semibold">${results.statistic?.toFixed(3) || 'N/A'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">p-value</p>
                    <p class="font-semibold ${results.pValue < 0.05 ? 'text-red-600' : 'text-green-600'}">
                        ${results.pValue?.toFixed(4) || 'N/A'}
                    </p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">통계적 유의성</p>
                    <p class="font-semibold">
                        ${results.significant ? '✅ 유의함' : '❌ 유의하지 않음'}
                    </p>
                </div>
            </div>
        </div>
    `;
    
    // 기술통계
    if (results.descriptive) {
        summaryHTML += `
            <div class="bg-white p-6 rounded-lg mb-4">
                <h4 class="text-lg font-bold mb-3">📈 기술통계</h4>
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="px-4 py-2 text-left">그룹</th>
                                <th class="px-4 py-2 text-right">평균</th>
                                <th class="px-4 py-2 text-right">표준편차</th>
                                <th class="px-4 py-2 text-right">중앙값</th>
                                <th class="px-4 py-2 text-right">N</th>
                                <th class="px-4 py-2 text-right">95% CI</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        for (const [group, stats] of Object.entries(results.descriptive)) {
            summaryHTML += `
                <tr class="border-b">
                    <td class="px-4 py-2">${group}</td>
                    <td class="px-4 py-2 text-right">${stats.mean.toFixed(2)}</td>
                    <td class="px-4 py-2 text-right">${stats.std.toFixed(2)}</td>
                    <td class="px-4 py-2 text-right">${stats.median.toFixed(2)}</td>
                    <td class="px-4 py-2 text-right">${stats.n}</td>
                    <td class="px-4 py-2 text-right">[${stats.ci95[0].toFixed(2)}, ${stats.ci95[1].toFixed(2)}]</td>
                </tr>
            `;
        }
        
        summaryHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // 사후분석 결과
    if (results.postHoc && results.postHoc.comparisons) {
        summaryHTML += `
            <div class="bg-white p-6 rounded-lg">
                <h4 class="text-lg font-bold mb-3">🔍 사후분석 (${results.postHoc.method})</h4>
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="px-4 py-2 text-left">비교</th>
                                <th class="px-4 py-2 text-right">평균차</th>
                                <th class="px-4 py-2 text-right">p-value</th>
                                <th class="px-4 py-2 text-right">보정 p-value</th>
                                <th class="px-4 py-2 text-center">유의성</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        for (const comp of results.postHoc.comparisons) {
            summaryHTML += `
                <tr class="border-b">
                    <td class="px-4 py-2">${comp.group1} vs ${comp.group2}</td>
                    <td class="px-4 py-2 text-right">${comp.meanDiff.toFixed(2)}</td>
                    <td class="px-4 py-2 text-right">${comp.pValue.toFixed(4)}</td>
                    <td class="px-4 py-2 text-right">${comp.adjustedP.toFixed(4)}</td>
                    <td class="px-4 py-2 text-center">
                        ${comp.significant ? '✅' : ''}
                    </td>
                </tr>
            `;
        }
        
        summaryHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    resultsDiv.innerHTML = summaryHTML;
    
    // 주요 발견사항 업데이트
    const keyFindings = document.getElementById('keyFindings');
    if (keyFindings) {
        let findings = '<ul class="list-disc list-inside space-y-1">';
        
        if (results.significant) {
            findings += `<li>통계적으로 유의한 차이가 발견되었습니다 (p = ${results.pValue?.toFixed(4)})</li>`;
            if (results.effectSize) {
                findings += `<li>효과 크기: Cohen's d = ${results.effectSize.toFixed(2)}</li>`;
            }
        } else {
            findings += `<li>통계적으로 유의한 차이가 발견되지 않았습니다 (p = ${results.pValue?.toFixed(4)})</li>`;
        }
        
        findings += '</ul>';
        keyFindings.innerHTML = findings;
    }
    
    // 분석 완료 표시
    document.getElementById('step6Explanation').classList.remove('hidden');
}

// Export functions
window.validateData = validateData;
window.testAssumptions = testAssumptions;
window.recommendMethod = recommendMethod;
window.runAnalysis = runAnalysis;
window.displayFinalResults = displayFinalResults;