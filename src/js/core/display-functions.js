// Display Functions
// UI 표시 및 결과 렌더링 함수들

// 검증 결과 표시
function displayValidationResults(validation) {
    const validationDiv = document.getElementById('dataValidation');
    
    if (!validation) {
        validationDiv.innerHTML = '<p class="text-sm text-gray-500">검증 대기 중...</p>';
        return;
    }
    
    let html = '<div class="space-y-2">';
    
    // 변수 타입 표시
    if (validation.numericColumns.length > 0) {
        html += `
            <div class="text-xs">
                <span class="font-semibold">수치형 변수:</span> 
                ${validation.numericColumns.join(', ')}
            </div>`;
    }
    
    if (validation.groupColumns.length > 0) {
        html += `
            <div class="text-xs">
                <span class="font-semibold">그룹 변수:</span> 
                ${validation.groupColumns.join(', ')}
            </div>`;
    }
    
    if (validation.textColumns.length > 0) {
        html += `
            <div class="text-xs">
                <span class="font-semibold">텍스트 변수:</span> 
                ${validation.textColumns.join(', ')}
            </div>`;
    }
    
    // 문제 표시
    if (validation.issues.length > 0) {
        html += `
            <div class="text-xs text-red-600">
                <span class="font-semibold">⚠️ 발견된 문제:</span>
                <ul class="list-disc list-inside mt-1">
                    ${validation.issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
            </div>`;
    } else {
        html += `
            <div class="text-xs text-green-600">
                ✅ 데이터 검증 완료 - 문제 없음
            </div>`;
    }
    
    html += '</div>';
    validationDiv.innerHTML = html;
}

// 가정 검정 결과 표시
function displayAssumptionResults(assumptions) {
    // 정규성 결과
    const normalityDiv = document.getElementById('normalityResults');
    if (assumptions.normality && assumptions.normality.length > 0) {
        let normalHtml = '<div class="space-y-2">';
        
        for (const result of assumptions.normality) {
            const colorClass = result.isNormal ? 'text-green-600' : 'text-orange-600';
            normalHtml += `
                <div class="p-2 bg-gray-50 rounded">
                    <p class="font-semibold text-sm">${result.variable}</p>
                    <p class="text-xs ${colorClass}">${result.interpretation}</p>
                    <p class="text-xs text-gray-500">
                        ${result.test} | p = ${result.pValue?.toFixed(4) || 'N/A'} | n = ${result.sampleSize}
                    </p>
                    ${result.recommendation ? `<p class="text-xs text-blue-600 mt-1">💡 ${result.recommendation}</p>` : ''}
                </div>`;
        }
        
        normalHtml += '</div>';
        normalityDiv.innerHTML = normalHtml;
    } else {
        normalityDiv.innerHTML = '<p class="text-sm text-gray-500">정규성 검정 결과가 없습니다.</p>';
    }
    
    // 등분산성 결과
    const homogeneityDiv = document.getElementById('homogeneityResults');
    if (assumptions.homogeneity && assumptions.homogeneity.length > 0) {
        let homHtml = '<div class="space-y-2">';
        
        for (const result of assumptions.homogeneity) {
            const colorClass = result.isHomogeneous ? 'text-green-600' : 'text-orange-600';
            homHtml += `
                <div class="p-2 bg-gray-50 rounded">
                    <p class="font-semibold text-sm">${result.variables}</p>
                    <p class="text-xs ${colorClass}">${result.interpretation}</p>
                    <p class="text-xs text-gray-500">
                        ${result.test} | p = ${result.pValue?.toFixed(4) || 'N/A'} | 그룹 수 = ${result.groups}
                    </p>
                    ${result.recommendation ? `<p class="text-xs text-blue-600 mt-1">💡 ${result.recommendation}</p>` : ''}
                </div>`;
        }
        
        homHtml += '</div>';
        homogeneityDiv.innerHTML = homHtml;
    } else {
        homogeneityDiv.innerHTML = '<p class="text-sm text-gray-500">등분산성 검정이 필요하지 않습니다.</p>';
    }
    
    // 설명 섹션 표시
    const explanationDiv = document.getElementById('step3Explanation');
    if (explanationDiv) {
        explanationDiv.classList.remove('hidden');
        
        const interpretationDiv = document.getElementById('assumptionInterpretation');
        if (interpretationDiv) {
            const allNormal = assumptions.normality?.every(r => r.isNormal);
            const allHomogeneous = assumptions.homogeneity?.every(r => r.isHomogeneous);
            
            let interpretation = '<ul class="list-disc list-inside space-y-1">';
            
            if (allNormal) {
                interpretation += '<li>✅ 모든 변수가 정규분포를 따릅니다</li>';
            } else {
                interpretation += '<li>⚠️ 일부 변수가 정규분포를 따르지 않습니다</li>';
            }
            
            if (assumptions.homogeneity?.length > 0) {
                if (allHomogeneous) {
                    interpretation += '<li>✅ 등분산성 가정이 충족됩니다</li>';
                } else {
                    interpretation += '<li>⚠️ 등분산성 가정이 위배됩니다</li>';
                }
            }
            
            interpretation += '</ul>';
            interpretationDiv.innerHTML = interpretation;
        }
    }
}

// 방법 추천 결과 표시
function displayMethodRecommendation(recommendation) {
    const recommendDiv = document.getElementById('methodRecommendation');
    
    if (!recommendation) {
        recommendDiv.innerHTML = '<p class="text-lg font-semibold mb-2">추천 방법을 분석할 수 없습니다.</p>';
        return;
    }
    
    let html = `
        <div class="space-y-4">
            <div>
                <p class="text-2xl font-bold text-blue-600">${recommendation.method}</p>
                <p class="text-sm text-gray-600 mt-2">${recommendation.reason}</p>
            </div>`;
    
    if (recommendation.postHoc) {
        html += `
            <div class="bg-blue-100 p-3 rounded">
                <p class="text-sm font-semibold">사후분석 방법</p>
                <p class="text-sm">${recommendation.postHoc}</p>
            </div>`;
    }
    
    if (recommendation.alternatives && recommendation.alternatives.length > 0) {
        html += `
            <div class="bg-gray-100 p-3 rounded">
                <p class="text-sm font-semibold">대체 방법</p>
                <ul class="list-disc list-inside text-sm mt-1">
                    ${recommendation.alternatives.map(alt => `<li>${alt}</li>`).join('')}
                </ul>
            </div>`;
    }
    
    if (recommendation.suggestions) {
        html += `
            <div class="bg-yellow-100 p-3 rounded">
                <p class="text-sm">💡 ${recommendation.suggestions}</p>
            </div>`;
    }
    
    html += '</div>';
    recommendDiv.innerHTML = html;
    
    // 설명 섹션 표시
    const explanationDiv = document.getElementById('step4Explanation');
    if (explanationDiv) {
        explanationDiv.classList.remove('hidden');
        
        const detailsDiv = document.getElementById('methodDetails');
        if (detailsDiv) {
            let details = `
                <p class="text-sm font-semibold mb-2">선택된 방법: ${recommendation.method}</p>
                <p class="text-xs text-gray-600">${recommendation.reason}</p>`;
            
            if (recommendation.postHoc) {
                details += `<p class="text-xs text-blue-600 mt-2">사후분석: ${recommendation.postHoc}</p>`;
            }
            
            detailsDiv.innerHTML = details;
        }
    }
}

// 데이터 테이블 표시
function displayDataTable() {
    if (!currentData) return;
    
    const columns = Object.keys(currentData);
    const rowCount = currentData[columns[0]].length;
    
    // 헤더 생성
    const headerHTML = `
        <tr>
            ${columns.map(col => `<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">${col}</th>`).join('')}
        </tr>`;
    
    document.getElementById('tableHeader').innerHTML = headerHTML;
    
    // 바디 생성 (최대 10행만 표시)
    let bodyHTML = '';
    for (let i = 0; i < Math.min(10, rowCount); i++) {
        bodyHTML += '<tr>';
        for (const col of columns) {
            bodyHTML += `<td class="px-4 py-2 text-sm text-gray-900">${currentData[col][i] || ''}</td>`;
        }
        bodyHTML += '</tr>';
    }
    
    if (rowCount > 10) {
        bodyHTML += `
            <tr>
                <td colspan="${columns.length}" class="px-4 py-2 text-center text-sm text-gray-500">
                    ... ${rowCount - 10}개 행 더 있음 ...
                </td>
            </tr>`;
    }
    
    document.getElementById('tableBody').innerHTML = bodyHTML;
    
    // 행/열 카운트 업데이트
    const rowCountEl = document.getElementById('rowCount');
    const colCountEl = document.getElementById('colCount');
    if (rowCountEl) {
        rowCountEl.textContent = rowCount;
    }
    if (colCountEl) {
        colCountEl.textContent = columns.length;
    }
}

// 재검사 함수
function retestAssumptions() {
    // 기존 결과 삭제
    analysisResults.assumptions = null;
    analysisResults.method = null;
    analysisResults.statistics = null;
    analysisResults.final = null;
    
    // 재검사 실행
    testAssumptions();
}

// 새 분석 시작
function newAnalysis() {
    // 모든 결과 초기화
    currentData = null;
    analysisResults = {
        validation: null,
        assumptions: null,
        method: null,
        statistics: null,
        postHoc: null,
        final: null
    };
    
    // 1단계로 이동
    moveToStep(1);
    
    // UI 초기화
    document.getElementById('dataValidation').innerHTML = '';
    document.getElementById('normalityResults').innerHTML = '';
    document.getElementById('homogeneityResults').innerHTML = '';
    document.getElementById('methodRecommendation').innerHTML = '<p class="text-lg font-semibold mb-2">추천 방법 분석 중...</p>';
    document.getElementById('analysisResults').innerHTML = '';
}

// 결과 내보내기
function exportResults() {
    if (!analysisResults.final) {
        alert('내보낼 결과가 없습니다.');
        return;
    }
    
    // JSON으로 결과 저장
    const exportData = {
        date: new Date().toISOString(),
        data: currentData,
        results: analysisResults,
        metadata: {
            rowCount: currentData ? currentData[Object.keys(currentData)[0]].length : 0,
            colCount: currentData ? Object.keys(currentData).length : 0
        }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistical_analysis_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// 보고서 인쇄
function printReport() {
    window.print();
}

// Export display functions
window.displayValidationResults = displayValidationResults;
window.displayAssumptionResults = displayAssumptionResults;
window.displayMethodRecommendation = displayMethodRecommendation;
window.displayDataTable = displayDataTable;
window.retestAssumptions = retestAssumptions;
window.newAnalysis = newAnalysis;
window.exportResults = exportResults;
window.printReport = printReport;