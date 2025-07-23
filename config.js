// Конфигурация для работы на сервере
const CONFIG = {
    // Настройки для локальной разработки
    development: {
        apiUrl: 'http://localhost:3000/api',
        uploadUrl: 'http://localhost:3000/uploads',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']
    },
    
    // Настройки для продакшена
    production: {
        apiUrl: '/api',
        uploadUrl: '/uploads',
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip', '.rar']
    }
};

// Определение текущей среды
const ENVIRONMENT = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'development' 
    : 'production';

// Экспорт текущей конфигурации
const CURRENT_CONFIG = CONFIG[ENVIRONMENT];

// Утилиты для работы с сервером
const ServerUtils = {
    // Проверка доступности сервера
    async checkServerConnection() {
        try {
            const response = await fetch(CURRENT_CONFIG.apiUrl + '/health');
            return response.ok;
        } catch (error) {
            console.warn('Сервер недоступен, работаем в автономном режиме');
            return false;
        }
    },
    
    // Загрузка файла на сервер
    async uploadFile(file, sectionId, subsectionId) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sectionId', sectionId);
        formData.append('subsectionId', subsectionId);
        
        try {
            const response = await fetch(CURRENT_CONFIG.apiUrl + '/upload', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Ошибка загрузки файла');
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            // Fallback к локальному хранению
            return {
                url: URL.createObjectURL(file),
                filename: file.name,
                size: file.size,
                type: file.type
            };
        }
    },
    
    // Сохранение данных на сервер
    async saveData(key, data) {
        try {
            const response = await fetch(CURRENT_CONFIG.apiUrl + '/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key, data })
            });
            
            if (!response.ok) {
                throw new Error('Ошибка сохранения данных');
            }
        } catch (error) {
            console.warn('Не удалось сохранить на сервер, используем localStorage');
            localStorage.setItem(key, JSON.stringify(data));
        }
    },
    
    // Загрузка данных с сервера
    async loadData(key) {
        try {
            const response = await fetch(CURRENT_CONFIG.apiUrl + '/data/' + key);
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
        } catch (error) {
            console.warn('Не удалось загрузить с сервера, используем localStorage');
        }
        
        // Fallback к localStorage
        const localData = localStorage.getItem(key);
        return localData ? JSON.parse(localData) : null;
    }
};