// Data Handler Module
// 데이터 입출력 관련 기능

export class DataHandler {
    constructor() {
        this.currentData = null;
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        
        if (dropZone) {
            dropZone.addEventListener('click', () => fileInput.click());
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFile(files[0]);
                }
            });
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFile(e.target.files[0]);
                }
            });
        }
    }
    
    handleFile(file) {
        // 파일 크기 체크
        if (file.size > 10 * 1024 * 1024) {
            alert('파일 크기는 10MB를 초과할 수 없습니다.');
            return;
        }
        
        // 파일 미리보기 표시
        document.getElementById('dropZone').classList.add('hidden');
        document.getElementById('filePreview').classList.remove('hidden');
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileInfo').textContent = `크기: ${(file.size / 1024 / 1024).toFixed(2)}MB | 처리 중...`;
        
        // 파일 읽기
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                if (file.name.endsWith('.csv')) {
                    this.currentData = this.parseCSV(e.target.result);
                } else {
                    this.currentData = await this.parseExcel(e.target.result);
                }
                
                const rows = Object.values(this.currentData)[0]?.length || 0;
                const cols = Object.keys(this.currentData).length;
                
                document.getElementById('fileInfo').textContent = 
                    `크기: ${(file.size / 1024 / 1024).toFixed(2)}MB | 행: ${rows} | 열: ${cols}`;
                document.getElementById('proceedBtn1').disabled = false;
                
                // 이벤트 발생
                window.dispatchEvent(new CustomEvent('dataLoaded', { detail: this.currentData }));
                
            } catch (error) {
                alert('파일 읽기 중 오류가 발생했습니다: ' + error.message);
                this.removeFile();
            }
        };
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }
    
    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const data = {};
        
        headers.forEach(header => {
            data[header] = [];
        });
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            headers.forEach((header, index) => {
                const value = values[index]?.trim();
                data[header].push(isNaN(value) ? value : parseFloat(value));
            });
        }
        
        return data;
    }
    
    async parseExcel(buffer) {
        if (typeof XLSX === 'undefined') {
            throw new Error('Excel 라이브러리가 로드되지 않았습니다');
        }
        
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        if (jsonData.length === 0) {
            throw new Error('빈 파일입니다');
        }
        
        const headers = jsonData[0];
        const data = {};
        
        headers.forEach(header => {
            data[header] = [];
        });
        
        for (let i = 1; i < jsonData.length; i++) {
            headers.forEach((header, index) => {
                const value = jsonData[i][index];
                data[header].push(value);
            });
        }
        
        return data;
    }
    
    generateSampleData() {
        this.currentData = {
            '그룹A': [23, 25, 27, 22, 24, 26, 28, 25, 24, 23],
            '그룹B': [31, 33, 35, 32, 34, 36, 38, 35, 34, 33],
            '그룹C': [42, 44, 46, 43, 45, 47, 49, 46, 45, 44]
        };
        
        // UI 업데이트
        document.getElementById('dropZone').classList.add('hidden');
        document.getElementById('filePreview').classList.remove('hidden');
        document.getElementById('fileName').textContent = '샘플 데이터';
        document.getElementById('fileInfo').textContent = '3개 그룹 | 각 10개 관측치';
        document.getElementById('proceedBtn1').disabled = false;
        
        // 이벤트 발생
        window.dispatchEvent(new CustomEvent('dataLoaded', { detail: this.currentData }));
        
        return this.currentData;
    }
    
    removeFile() {
        document.getElementById('dropZone').classList.remove('hidden');
        document.getElementById('filePreview').classList.add('hidden');
        document.getElementById('fileInput').value = '';
        this.currentData = null;
        document.getElementById('proceedBtn1').disabled = true;
    }
    
    exportData(data, filename = 'data.json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 전역 함수로 노출 (HTML onclick에서 사용)
window.dataHandler = new DataHandler();
window.generateSampleData = () => window.dataHandler.generateSampleData();
window.removeFile = () => window.dataHandler.removeFile();