// 네비게이션 및 단계 관리

// 디버그 로거 생성
const navDebug = window.debug || { log: () => {}, error: console.error };

// 단계 이동
function moveToStep(step) {
    navDebug.log(`[NAVIGATION] 단계 ${currentStep} → ${step}`);
    
    // 모든 단계 숨기기
    for (let i = 1; i <= 6; i++) {
        const content = document.getElementById(`step${i}Content`);
        if (content) {
            content.classList.add('hidden');
        }
        
        const indicator = document.getElementById(`step${i}`);
        if (indicator) {
            if (i < step) {
                indicator.classList.add('complete');
                indicator.classList.remove('inactive');
            } else if (i === step) {
                indicator.classList.remove('inactive', 'complete');
            } else {
                indicator.classList.add('inactive');
                indicator.classList.remove('complete');
            }
        }
    }
    
    // 현재 단계 표시
    const currentContent = document.getElementById(`step${step}Content`);
    if (currentContent) {
        currentContent.classList.remove('hidden');
    }
    
    // 진행바 업데이트
    updateProgressBar(step);
    
    // 단계별 초기화
    switch(step) {
        case 2: 
            if (window.currentData) {
                navDebug.log('[NAVIGATION] Step 2 초기화, 데이터 있음');
                // 데이터 테이블 표시
                if (window.displayDataTable) {
                    window.displayDataTable();
                }
                // 데이터 검증
                if (!window.analysisResults.validation && window.validateData) {
                    window.validateData();
                }
            } else {
                navDebug.log('[NAVIGATION] Step 2 초기화, 데이터 없음');
            }
            break;
        case 3: 
            if (window.analysisResults && window.analysisResults.validation && !window.analysisResults.assumptions) {
                if (window.testAssumptions) {
                    window.testAssumptions();
                }
            }
            break;
        case 4:
            if (window.analysisResults && window.analysisResults.assumptions && !window.analysisResults.method) {
                if (window.recommendMethod) {
                    window.recommendMethod();
                }
            }
            break;
        case 5:
            if (window.analysisResults && window.analysisResults.method && !window.analysisResults.statistics) {
                if (window.runAnalysis) {
                    window.runAnalysis();
                }
            }
            break;
        case 6:
            if (window.analysisResults && window.analysisResults.statistics) {
                if (window.displayFinalResults) {
                    window.displayFinalResults();
                }
            }
            break;
    }
    
    window.currentStep = step;
}

// 진행바 업데이트
function updateProgressBar(step) {
    const progress = (step / 6) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = progress + '%';
        navDebug.log(`[PROGRESS] ${progress.toFixed(0)}%`);
    }
}

// 다음 단계로 이동
function proceedToNextStep() {
    if (currentStep < 6) {
        moveToStep(currentStep + 1);
    }
}

// 이전 단계로 이동
function previousStep() {
    if (currentStep > 1) {
        moveToStep(currentStep - 1);
    }
}

// 단계별 진행 함수들
function proceedToStep2() {
    navDebug.log('[NAVIGATION] 2단계로 진행');
    moveToStep(2);
}

function proceedToStep3() {
    navDebug.log('[NAVIGATION] 3단계로 진행');
    moveToStep(3);
}

function proceedToStep4() {
    navDebug.log('[NAVIGATION] 4단계로 진행');
    moveToStep(4);
}

function proceedToStep5() {
    navDebug.log('[NAVIGATION] 5단계로 진행');
    moveToStep(5);
}

function proceedToStep6() {
    navDebug.log('[NAVIGATION] 6단계로 진행');
    moveToStep(6);
}

// 툴팁 관리
function showTooltip(event, text) {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.textContent = text;
        tooltip.style.left = event.clientX + 10 + 'px';
        tooltip.style.top = event.clientY + 10 + 'px';
        tooltip.classList.remove('hidden');
    }
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.classList.add('hidden');
    }
}

// Export - 전역 함수로 직접 노출
window.moveToStep = moveToStep;
window.updateProgressBar = updateProgressBar;
window.proceedToNextStep = proceedToNextStep;
window.previousStep = previousStep;
window.proceedToStep2 = proceedToStep2;
window.proceedToStep3 = proceedToStep3;
window.proceedToStep4 = proceedToStep4;
window.proceedToStep5 = proceedToStep5;
window.proceedToStep6 = proceedToStep6;
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;