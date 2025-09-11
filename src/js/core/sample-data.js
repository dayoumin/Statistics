// 샘플 데이터 관련 함수들

// 샘플 데이터 보기
function showSampleData() {
    // 샘플 데이터 모달 생성
    const modalHTML = `
        <div id="sampleDataModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div class="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">📊 샘플 데이터 예시</h2>
                    <button onclick="closeSampleDataModal()" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-6">
                    <!-- 샘플 1: 2그룹 비교 -->
                    <div class="border rounded-lg p-4">
                        <h3 class="font-semibold mb-2">1. 양식 방법 비교 (2그룹)</h3>
                        <p class="text-sm text-gray-600 mb-2">두 가지 양식 방법의 성장률 비교</p>
                        <pre class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">양식방법,성장률,수온
A,12.3,18.5
A,13.5,19.0
A,11.8,18.2
B,15.6,20.1
B,16.2,20.5
B,14.9,19.8</pre>
                        <button onclick="loadSampleData(1)" class="btn-primary text-sm mt-2">
                            이 데이터 사용
                        </button>
                    </div>
                    
                    <!-- 샘플 2: 3그룹 비교 -->
                    <div class="border rounded-lg p-4">
                        <h3 class="font-semibold mb-2">2. 지역별 CPUE 비교 (3그룹)</h3>
                        <p class="text-sm text-gray-600 mb-2">동해, 서해, 남해의 어획효율 비교</p>
                        <pre class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">지역,CPUE,수심
동해,8.5,120
동해,9.2,135
서해,12.3,45
서해,13.5,50
남해,10.2,85
남해,10.8,90</pre>
                        <button onclick="loadSampleData(2)" class="btn-primary text-sm mt-2">
                            이 데이터 사용
                        </button>
                    </div>
                    
                    <!-- 샘플 3: 상관관계 -->
                    <div class="border rounded-lg p-4">
                        <h3 class="font-semibold mb-2">3. 체장-체중 상관관계</h3>
                        <p class="text-sm text-gray-600 mb-2">어류의 체장과 체중 관계 분석</p>
                        <pre class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">체장,체중,연령
10.5,22.3,1
12.3,35.6,2
15.8,58.9,3
18.2,82.4,4
20.5,110.5,5</pre>
                        <button onclick="loadSampleData(3)" class="btn-primary text-sm mt-2">
                            이 데이터 사용
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 모달 추가
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
}

// 샘플 데이터 모달 닫기
function closeSampleDataModal() {
    const modal = document.getElementById('sampleDataModal');
    if (modal) {
        modal.remove();
    }
}

// 샘플 데이터 로드
function loadSampleData(sampleNumber) {
    let csvContent = '';
    
    switch(sampleNumber) {
        case 1:
            csvContent = `양식방법,성장률,수온
A,12.3,18.5
A,13.5,19.0
A,11.8,18.2
A,14.2,19.5
A,13.0,18.8
B,15.6,20.1
B,16.2,20.5
B,14.9,19.8
B,17.0,21.0
B,15.8,20.3`;
            break;
            
        case 2:
            csvContent = `지역,CPUE,수심
동해,8.5,120
동해,9.2,135
동해,7.8,110
동해,8.0,115
서해,12.3,45
서해,13.5,50
서해,11.8,42
서해,12.5,48
남해,10.2,85
남해,10.8,90
남해,9.5,80
남해,10.0,87`;
            break;
            
        case 3:
            csvContent = `체장,체중,연령
10.5,22.3,1
12.3,35.6,2
15.8,58.9,3
18.2,82.4,4
20.5,110.5,5
22.8,145.2,6
13.5,42.1,2
16.2,65.3,3
19.0,92.8,4
21.5,125.6,5`;
            break;
    }
    
    // CSV 파싱
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = {};
    headers.forEach(h => data[h] = []);
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        headers.forEach((h, idx) => {
            data[h].push(values[idx]);
        });
    }
    
    // 전역 변수 설정
    window.currentData = data;
    
    // 분석 결과 초기화
    window.analysisResults = {
        validation: null,
        assumptions: null,
        method: null,
        statistics: null,
        postHoc: null
    };
    
    // 모달 닫기
    closeSampleDataModal();
    
    // 2단계로 이동 및 데이터 처리
    if (window.moveToStep) {
        window.moveToStep(2);
        
        // moveToStep에서 자동으로 displayDataTable과 validateData를 호출하지만
        // 타이밍 문제가 있을 수 있으므로 명시적으로 다시 호출
        setTimeout(() => {
            if (window.displayDataTable) {
                window.displayDataTable();
            }
            if (window.validateData) {
                window.validateData();
            }
        }, 100);
    }
    
    // 사용자에게 알림
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
    notification.textContent = '✅ 샘플 데이터가 로드되었습니다';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export functions
window.showSampleData = showSampleData;
window.closeSampleDataModal = closeSampleDataModal;
window.loadSampleData = loadSampleData;