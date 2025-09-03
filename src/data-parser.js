/**
 * 데이터 파싱 및 검증 모듈
 * CSV, TSV, Excel 복사/붙여넣기 데이터 처리
 */

class DataParser {
    constructor() {
        this.supportedFormats = ['csv', 'tsv', 'excel', 'text'];
        this.minSampleSize = 3; // 최소 샘플 수
        this.maxGroups = 20; // 최대 그룹 수
    }

    /**
     * 메인 파싱 함수 - 데이터 형식 자동 감지
     * @param {string|File} input - 입력 데이터 (텍스트 또는 파일)
     * @returns {Object} 파싱된 데이터와 메타정보
     */
    async parse(input) {
        try {
            let rawData;
            let format;

            // 입력 타입 확인
            if (input instanceof File) {
                rawData = await this.readFile(input);
                format = this.detectFormatFromFile(input);
            } else if (typeof input === 'string') {
                rawData = input.trim();
                format = this.detectFormat(rawData);
            } else {
                throw new Error('지원하지 않는 입력 형식입니다.');
            }

            console.log(`감지된 데이터 형식: ${format}`);

            // 형식별 파싱
            let parsedData;
            switch (format) {
                case 'csv':
                    parsedData = this.parseCSV(rawData);
                    break;
                case 'tsv':
                case 'excel':
                    parsedData = this.parseTSV(rawData);
                    break;
                default:
                    parsedData = this.parseText(rawData);
            }

            // 데이터 검증
            const validation = this.validateData(parsedData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('\n'));
            }

            // 데이터 구조화
            const structuredData = this.structureData(parsedData);

            // 기술통계 계산
            const stats = this.calculateBasicStats(structuredData);

            return {
                success: true,
                data: structuredData,
                stats: stats,
                metadata: {
                    format: format,
                    totalSamples: structuredData.totalSamples,
                    groupCount: structuredData.groups.length,
                    hasHeaders: parsedData.hasHeaders,
                    warnings: validation.warnings
                }
            };

        } catch (error) {
            console.error('데이터 파싱 오류:', error);
            return {
                success: false,
                error: error.message,
                suggestion: this.getSuggestion(error.message)
            };
        }
    }

    /**
     * 파일 읽기
     */
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('파일 읽기 실패'));
            
            if (file.type.includes('excel') || file.name.endsWith('.xlsx')) {
                // Excel 파일은 별도 처리 필요 (SheetJS 사용 시)
                reject(new Error('Excel 파일은 아직 지원하지 않습니다. CSV로 저장 후 사용해주세요.'));
            } else {
                reader.readAsText(file, 'UTF-8');
            }
        });
    }

    /**
     * 데이터 형식 자동 감지
     */
    detectFormat(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return 'unknown';

        const firstLine = lines[0];
        
        // Tab 구분자 (Excel 복사 또는 TSV)
        if (firstLine.includes('\t')) {
            const tabCount = (firstLine.match(/\t/g) || []).length;
            if (tabCount >= 1) return 'tsv';
        }
        
        // Comma 구분자 (CSV)
        if (firstLine.includes(',')) {
            const commaCount = (firstLine.match(/,/g) || []).length;
            if (commaCount >= 1) return 'csv';
        }
        
        // 공백 구분자
        if (firstLine.includes(' ')) {
            return 'text';
        }
        
        return 'text';
    }

    /**
     * 파일 확장자로 형식 감지
     */
    detectFormatFromFile(file) {
        const name = file.name.toLowerCase();
        if (name.endsWith('.csv')) return 'csv';
        if (name.endsWith('.tsv') || name.endsWith('.txt')) return 'tsv';
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel';
        return this.detectFormat(file.content || '');
    }

    /**
     * CSV 파싱
     */
    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const delimiter = ',';
        
        return this.parseDelimited(lines, delimiter);
    }

    /**
     * TSV/Excel 붙여넣기 파싱
     */
    parseTSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const delimiter = '\t';
        
        return this.parseDelimited(lines, delimiter);
    }

    /**
     * 공백 구분 텍스트 파싱
     */
    parseText(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const delimiter = /\s+/; // 하나 이상의 공백
        
        return this.parseDelimited(lines, delimiter);
    }

    /**
     * 구분자 기반 파싱 공통 함수
     */
    parseDelimited(lines, delimiter) {
        if (lines.length === 0) {
            throw new Error('데이터가 비어있습니다.');
        }

        const data = [];
        let headers = null;
        let hasHeaders = false;

        // 첫 줄이 헤더인지 확인
        const firstRow = lines[0].split(delimiter).map(cell => cell.trim());
        const isHeader = firstRow.some(cell => isNaN(parseFloat(cell)));

        if (isHeader) {
            hasHeaders = true;
            headers = firstRow;
            lines = lines.slice(1);
        }

        // 데이터 파싱
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const cells = typeof delimiter === 'string' 
                ? line.split(delimiter) 
                : line.split(delimiter);
            
            const row = cells.map(cell => {
                const trimmed = cell.trim();
                const num = parseFloat(trimmed);
                return isNaN(num) ? trimmed : num;
            });
            
            if (row.length > 0) {
                data.push(row);
            }
        }

        return {
            headers: headers,
            hasHeaders: hasHeaders,
            data: data,
            rows: data.length,
            cols: data[0]?.length || 0
        };
    }

    /**
     * 데이터 검증
     */
    validateData(parsedData) {
        const errors = [];
        const warnings = [];

        if (!parsedData || !parsedData.data) {
            errors.push('파싱된 데이터가 없습니다.');
            return { isValid: false, errors, warnings };
        }

        const { data, rows, cols } = parsedData;

        // 최소 데이터 확인
        if (rows < 1) {
            errors.push('최소 1개 이상의 데이터가 필요합니다.');
        }

        // 데이터 형식 확인
        let numericCols = 0;
        let groupCol = -1;
        
        // 각 열이 숫자인지 그룹인지 확인
        for (let col = 0; col < cols; col++) {
            let allNumeric = true;
            let allString = true;
            
            for (let row = 0; row < data.length; row++) {
                const value = data[row][col];
                if (typeof value === 'number') {
                    allString = false;
                } else if (typeof value === 'string') {
                    allNumeric = false;
                }
            }
            
            if (allNumeric) {
                numericCols++;
            } else if (allString && groupCol === -1) {
                groupCol = col;
            }
        }

        // 숫자 데이터 확인
        if (numericCols === 0) {
            errors.push('숫자 데이터가 없습니다. 분석할 수치 데이터를 입력해주세요.');
        }

        // 결측치 확인
        let missingCount = 0;
        for (const row of data) {
            for (const cell of row) {
                if (cell === null || cell === undefined || cell === '' || 
                    (typeof cell === 'string' && cell.toLowerCase() === 'na')) {
                    missingCount++;
                }
            }
        }

        if (missingCount > 0) {
            warnings.push(`${missingCount}개의 결측치가 발견되었습니다. 분석에서 제외됩니다.`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * 데이터 구조화 - 그룹별로 정리
     */
    structureData(parsedData) {
        const { data, headers, hasHeaders } = parsedData;
        
        // 데이터 구조 분석
        const structure = this.analyzeStructure(data);
        
        let groups = [];
        let labels = [];
        let totalSamples = 0;

        if (structure.type === 'grouped') {
            // 그룹 열이 있는 경우
            const groupCol = structure.groupColumn;
            const valueCol = structure.valueColumns[0]; // 첫 번째 수치 열 사용
            
            const groupedData = {};
            
            for (const row of data) {
                const group = row[groupCol];
                const value = row[valueCol];
                
                if (typeof value === 'number' && !isNaN(value)) {
                    if (!groupedData[group]) {
                        groupedData[group] = [];
                    }
                    groupedData[group].push(value);
                }
            }
            
            for (const [groupName, values] of Object.entries(groupedData)) {
                if (values.length >= this.minSampleSize) {
                    groups.push(values);
                    labels.push(String(groupName));
                    totalSamples += values.length;
                }
            }
            
        } else if (structure.type === 'columns') {
            // 각 열이 그룹인 경우
            for (let col = 0; col < data[0].length; col++) {
                const values = [];
                
                for (let row = 0; row < data.length; row++) {
                    const value = data[row][col];
                    if (typeof value === 'number' && !isNaN(value)) {
                        values.push(value);
                    }
                }
                
                if (values.length >= this.minSampleSize) {
                    groups.push(values);
                    labels.push(headers && headers[col] ? headers[col] : `그룹 ${col + 1}`);
                    totalSamples += values.length;
                }
            }
            
        } else {
            // 단일 그룹 (전체를 하나의 그룹으로)
            const values = [];
            
            for (const row of data) {
                for (const cell of row) {
                    if (typeof cell === 'number' && !isNaN(cell)) {
                        values.push(cell);
                    }
                }
            }
            
            if (values.length >= this.minSampleSize) {
                groups.push(values);
                labels.push('전체 데이터');
                totalSamples = values.length;
            }
        }

        // 그룹 수 확인
        if (groups.length === 0) {
            throw new Error('분석 가능한 그룹이 없습니다.');
        }

        if (groups.length > this.maxGroups) {
            throw new Error(`그룹 수가 너무 많습니다. (최대 ${this.maxGroups}개)`);
        }

        return {
            groups: groups,
            labels: labels,
            totalSamples: totalSamples,
            structure: structure
        };
    }

    /**
     * 데이터 구조 분석
     */
    analyzeStructure(data) {
        if (!data || data.length === 0) {
            return { type: 'unknown' };
        }

        const cols = data[0].length;
        const colTypes = [];

        // 각 열의 타입 분석
        for (let col = 0; col < cols; col++) {
            let numericCount = 0;
            let stringCount = 0;
            let uniqueValues = new Set();

            for (const row of data) {
                const value = row[col];
                if (typeof value === 'number') {
                    numericCount++;
                } else if (typeof value === 'string') {
                    stringCount++;
                    uniqueValues.add(value);
                }
            }

            if (numericCount > stringCount) {
                colTypes.push('numeric');
            } else if (stringCount > 0 && uniqueValues.size < data.length / 2) {
                colTypes.push('group');
            } else {
                colTypes.push('mixed');
            }
        }

        // 구조 판단
        const groupColumns = colTypes.map((type, idx) => type === 'group' ? idx : -1)
                                     .filter(idx => idx >= 0);
        const valueColumns = colTypes.map((type, idx) => type === 'numeric' ? idx : -1)
                                     .filter(idx => idx >= 0);

        if (groupColumns.length > 0 && valueColumns.length > 0) {
            return {
                type: 'grouped',
                groupColumn: groupColumns[0],
                valueColumns: valueColumns
            };
        } else if (valueColumns.length > 1) {
            return {
                type: 'columns',
                valueColumns: valueColumns
            };
        } else {
            return {
                type: 'single',
                valueColumns: valueColumns
            };
        }
    }

    /**
     * 기본 통계 계산
     */
    calculateBasicStats(structuredData) {
        const stats = [];

        for (let i = 0; i < structuredData.groups.length; i++) {
            const group = structuredData.groups[i];
            const label = structuredData.labels[i];

            const n = group.length;
            const mean = group.reduce((a, b) => a + b, 0) / n;
            const sortedGroup = [...group].sort((a, b) => a - b);
            const median = n % 2 === 0
                ? (sortedGroup[n/2 - 1] + sortedGroup[n/2]) / 2
                : sortedGroup[Math.floor(n/2)];
            
            const variance = group.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
            const std = Math.sqrt(variance);
            const se = std / Math.sqrt(n);
            
            const min = Math.min(...group);
            const max = Math.max(...group);
            const q1 = sortedGroup[Math.floor(n * 0.25)];
            const q3 = sortedGroup[Math.floor(n * 0.75)];

            stats.push({
                label: label,
                n: n,
                mean: mean,
                median: median,
                std: std,
                se: se,
                min: min,
                max: max,
                q1: q1,
                q3: q3,
                ci95Lower: mean - 1.96 * se,
                ci95Upper: mean + 1.96 * se
            });
        }

        return stats;
    }

    /**
     * 오류 메시지에 따른 해결 방법 제안
     */
    getSuggestion(errorMessage) {
        const suggestions = {
            '데이터가 비어있습니다': '데이터를 복사한 후 입력 영역에 붙여넣기(Ctrl+V) 해주세요.',
            '숫자 데이터가 없습니다': '분석할 수치 데이터가 포함되어 있는지 확인해주세요.',
            '분석 가능한 그룹이 없습니다': '최소 3개 이상의 데이터가 필요합니다.',
            '그룹 수가 너무 많습니다': '그룹을 20개 이하로 줄여주세요.',
            'Excel 파일은 아직 지원하지 않습니다': 'Excel에서 데이터를 복사하여 붙여넣기 하거나, CSV로 저장 후 업로드해주세요.'
        };

        for (const [key, suggestion] of Object.entries(suggestions)) {
            if (errorMessage.includes(key)) {
                return suggestion;
            }
        }

        return '데이터 형식을 확인하고 다시 시도해주세요.';
    }

    /**
     * 샘플 데이터 생성 (테스트용)
     */
    generateSampleData(type = 'anova') {
        if (type === 'anova') {
            return {
                text: `그룹\t값
A\t23.5
A\t24.1
A\t22.9
A\t24.5
A\t23.8
B\t26.8
B\t27.2
B\t26.5
B\t27.0
B\t26.9
C\t21.3
C\t20.9
C\t21.7
C\t21.5
C\t20.8`,
                description: 'ANOVA 분석용 3그룹 데이터'
            };
        } else if (type === 'ttest') {
            return {
                text: `대조군\t실험군
23.5\t26.8
24.1\t27.2
22.9\t26.5
24.5\t27.0
23.8\t26.9`,
                description: 't-test용 2그룹 데이터'
            };
        }
    }

    /**
     * 클립보드 데이터 처리
     */
    async handlePaste(event) {
        event.preventDefault();
        
        const clipboardData = event.clipboardData || window.clipboardData;
        const pastedData = clipboardData.getData('text');
        
        return await this.parse(pastedData);
    }

    /**
     * 드래그 앤 드롭 처리
     */
    async handleDrop(event) {
        event.preventDefault();
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            return await this.parse(files[0]);
        }
        
        const text = event.dataTransfer.getData('text');
        if (text) {
            return await this.parse(text);
        }
        
        throw new Error('드롭된 데이터를 처리할 수 없습니다.');
    }
}

// 전역 객체로 내보내기
if (typeof window !== 'undefined') {
    window.DataParser = DataParser;
}

// 모듈로 내보내기 (Node.js 환경)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataParser;
}