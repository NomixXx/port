// Система управления разделами (импорт из админ-панели)
class SectionManager {
    constructor() {
        this.sections = JSON.parse(localStorage.getItem('uptaxi_sections')) || [
            { 
                id: 'section1', 
                name: '213', 
                icon: '📁',
                accessLevel: 1,
                subsections: [
                    { id: 'subsection1', name: 'Подраздел 1', accessLevel: 1 },
                    { id: 'subsection2', name: 'Подраздел 2', accessLevel: 2 },
                    { id: 'subsection3', name: 'Подраздел 3', accessLevel: 3 }
                ]
            },
            { 
                id: 'section2', 
                name: 'Раздел 2', 
                icon: '📂',
                accessLevel: 2,
                subsections: [
                    { id: 'subsection1', name: 'Подраздел 1', accessLevel: 2 },
                    { id: 'subsection2', name: 'Подраздел 2', accessLevel: 2 },
                    { id: 'subsection3', name: 'Подраздел 3', accessLevel: 3 }
                ]
            },
            { 
                id: 'section3', 
                name: 'Раздел 3', 
                icon: '📋',
                accessLevel: 3,
                subsections: [
                    { id: 'subsection1', name: 'Подраздел 1', accessLevel: 3 },
                    { id: 'subsection2', name: 'Подраздел 2', accessLevel: 3 },
                    { id: 'subsection3', name: 'Подраздел 3', accessLevel: 3 }
                ]
            }
        ];
    }

    getSections() {
        return this.sections;
    }

    getSectionsForUser(userAccessLevel) {
        return this.sections.filter(section => section.accessLevel <= userAccessLevel);
    }
}

// Глобальный экземпляр менеджера разделов
const sectionManager = new SectionManager();

// Система управления контентом
class ContentManager {
    constructor() {
        this.content = JSON.parse(localStorage.getItem('uptaxi_content')) || {};
        this.googleDocs = JSON.parse(localStorage.getItem('uptaxi_googleDocs')) || [];
        this.files = JSON.parse(localStorage.getItem('uptaxi_files')) || [];
        this.activities = JSON.parse(localStorage.getItem('uptaxi_activities')) || [
            {
                id: 1,
                title: 'Добро пожаловать в систему',
                icon: '🎉',
                date: new Date().toLocaleDateString('ru-RU'),
                createdAt: new Date().toLocaleDateString('ru-RU')
            }
        ];
    }

    saveContent() {
        localStorage.setItem('uptaxi_content', JSON.stringify(this.content));
        localStorage.setItem('uptaxi_googleDocs', JSON.stringify(this.googleDocs));
        localStorage.setItem('uptaxi_files', JSON.stringify(this.files));
        localStorage.setItem('uptaxi_activities', JSON.stringify(this.activities));
    }

    addContent(section, subsection, title, description) {
        const key = `${section}_${subsection}`;
        if (!this.content[key]) this.content[key] = [];
        
        this.content[key].push({
            id: Date.now(),
            title,
            description,
            createdAt: new Date().toLocaleDateString()
        });
        this.saveContent();
    }

    addGoogleDoc(title, url, sectionId, subsectionId) {
        this.googleDocs.push({
            id: Date.now(),
            title,
            url,
            sectionId,
            subsectionId,
            createdAt: new Date().toLocaleDateString()
        });
        this.saveContent();
    }

    addFile(name, url, sectionId, subsectionId, type) {
        this.files.push({
            id: Date.now(),
            name,
            url,
            sectionId,
            subsectionId,
            type,
            createdAt: new Date().toLocaleDateString()
        });
        this.saveContent();
    }

    addActivity(title, icon) {
        this.activities.push({
            id: Date.now(),
            title,
            icon,
            date: new Date().toLocaleDateString('ru-RU'),
            createdAt: new Date().toLocaleDateString('ru-RU')
        });
        this.saveContent();
    }

    getActivities() {
        return this.activities.slice(-5).reverse(); // Последние 5 активностей
    }

    getContent(section, subsection) {
        const key = `${section}_${subsection}`;
        return this.content[key] || [];
    }

    getGoogleDocs(sectionId, subsectionId) {
        return this.googleDocs.filter(doc => 
            doc.sectionId === sectionId && doc.subsectionId === subsectionId
        );
    }

    getFiles(sectionId, subsectionId) {
        return this.files.filter(file => 
            file.sectionId === sectionId && file.subsectionId === subsectionId
        );
    }
}

// Глобальный экземпляр менеджера контента
const contentManager = new ContentManager();

// Проверка авторизации при загрузке страницы
function checkAuth() {
    if (!auth.isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Функция загрузки динамических разделов
function loadDynamicSections() {
    const user = auth.currentUser;
    if (!user) return;

    const userAccessLevel = user.accessLevel || 1;
    // Перезагрузить разделы из localStorage
    sectionManager.sections = JSON.parse(localStorage.getItem('uptaxi_sections')) || sectionManager.sections;
    const availableSections = sectionManager.getSectionsForUser(userAccessLevel);
    
    const dynamicSectionsContainer = document.getElementById('dynamic-sections');
    const quickLinksContainer = document.getElementById('quick-links');
    
    if (!dynamicSectionsContainer || !quickLinksContainer) return;
    
    let sectionsHtml = '';
    let quickLinksHtml = '';
    
    availableSections.forEach(section => {
        // Фильтровать подразделы по уровню доступа пользователя
        const availableSubsections = section.subsections.filter(sub => sub.accessLevel <= userAccessLevel);
        
        if (availableSubsections.length > 0) {
            sectionsHtml += `
                <li class="nav-item">
                    <a href="#" class="section-toggle" onclick="toggleSubmenu(this); return false;">
                        <span class="icon">${section.icon}</span>
                        <span>${section.name}</span>
                        <span class="arrow">▼</span>
                    </a>
                    <ul class="subsection-menu">
            `;
            
            availableSubsections.forEach(subsection => {
                sectionsHtml += `
                    <li><a href="#" onclick="showContent('${section.id}', '${subsection.id}'); return false;">${subsection.name}</a></li>
                `;
            });
            
            sectionsHtml += `
                    </ul>
                </li>
            `;
            
            // Добавить первый подраздел в быстрые ссылки
            if (availableSubsections.length > 0) {
                quickLinksHtml += `
                    <a href="#" onclick="showContent('${section.id}', '${availableSubsections[0].id}'); return false;" class="quick-link">
                        <span class="icon">${section.icon}</span>
                        <span>${section.name} - ${availableSubsections[0].name}</span>
                    </a>
                `;
            }
        }
    });
    
    if (sectionsHtml === '') {
        sectionsHtml = '<li><p style="padding: 15px; color: rgba(255,255,255,0.7);">Нет доступных разделов</p></li>';
    }
    
    if (quickLinksHtml === '') {
        quickLinksHtml = '<p>Нет доступных разделов</p>';
    }
    
    dynamicSectionsContainer.innerHTML = sectionsHtml;
    quickLinksContainer.innerHTML = quickLinksHtml;
}

// Функция переключения подменю
function toggleSubmenu(element) {
    if (event) event.preventDefault();
    const menuItem = element.parentElement;
    const isActive = menuItem.classList.contains('active');
    
    // Закрыть все подменю
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Открыть текущее, если оно не было активным
    if (!isActive) {
        menuItem.classList.add('active');
    }
}

// Функция показа дашборда
function showDashboard() {
    // Убрать активный класс со всех пунктов меню
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Активировать дашборд
    document.querySelector('.nav-item').classList.add('active');
    
    // Показать дашборд
    document.getElementById('dashboard').style.display = 'block';
    
    // Скрыть контейнер для контента
    const dynamicContent = document.getElementById('dynamic-content');
    if (dynamicContent) {
        dynamicContent.style.display = 'none';
    }
    
    // Обновить хлебные крошки
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = '<span>Главная</span>';
    }
}

// Функция переключения на контент
function switchToContent() {
    // Скрыть дашборд
    document.getElementById('dashboard').style.display = 'none';
    
    // Показать контейнер для контента
    const dynamicContent = document.getElementById('dynamic-content');
    if (dynamicContent) {
        dynamicContent.style.display = 'block';
    }
}

// Функция отображения контента
function showContent(sectionId, subsectionId) {
    if (event) event.preventDefault();
    
    // Проверить доступ пользователя к разделу
    const user = auth.currentUser;
    const sectionData = sectionManager.sections.find(s => s.id === sectionId);
    const subsectionData = sectionData?.subsections.find(sub => sub.id === subsectionId);
    
    if (!sectionData || !subsectionData) {
        alert('Раздел не найден');
        return;
    }
    
    if (user.accessLevel < subsectionData.accessLevel) {
        alert('У вас нет доступа к этому разделу');
        return;
    }
    
    // Переключиться на контент
    switchToContent();
    
    const contentArea = document.getElementById('dynamic-content');
    if (!contentArea) return;
    
    // Убрать активный класс со всех пунктов меню
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Обновить хлебные крошки
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = `<span>Главная</span><span class="separator">></span><span>${sectionData.name} - ${subsectionData.name}</span>`;
    }
    
    let html = `
        <div class="section-header">
            <h1>${sectionData.name} - ${subsectionData.name}</h1>
            <p>Информация и документы раздела</p>
            <div class="section-actions" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                <button onclick="showDashboard()" class="btn-primary">
                    <span class="icon">🏠</span>
                    Главная
                </button>
                ${auth.isAdmin() || user.role === 'admin' ? `
                    <button onclick="openAddContentModal('${sectionId}', '${subsectionId}')" class="btn-primary">
                        <span class="icon">📝</span>
                        Добавить контент
                    </button>
                    <button onclick="openAddDocModal('${sectionId}', '${subsectionId}')" class="btn-primary">
                        <span class="icon">📄</span>
                        Добавить документ
                    </button>
                    <button onclick="openUploadFileModal('${sectionId}', '${subsectionId}')" class="btn-primary">
                        <span class="icon">📁</span>
                        Загрузить файлы
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    // Получить контент
    const key = `${sectionId}_${subsectionId}`;
    const content = contentManager.getContent(sectionId, subsectionId);
    const googleDocs = contentManager.getGoogleDocs(sectionId, subsectionId);
    const files = contentManager.getFiles(sectionId, subsectionId);
    
    const totalItems = content.length + googleDocs.length + files.length;
    
    if (totalItems === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-icon">📁</div>
                <h3>Раздел пуст</h3>
                <p>В этом разделе пока нет контента. Обратитесь к администратору для добавления материалов.</p>
            </div>
        `;
    } else {
        html += '<div class="content-grid">';
        
        // Отобразить текстовый контент
        content.forEach(item => {
            html += `
                <div class="content-card">
                    <div class="card-header">
                        <h3>${item.title}</h3>
                        <span class="date">${item.createdAt}</span>
                    </div>
                    <div class="card-content">
                        <p>${item.description}</p>
                        ${auth.isAdmin() || user.role === 'admin' ? `
                            <button onclick="deleteContentFromMenu('${key}', ${item.id})" class="btn-danger" style="margin-top: 10px; padding: 5px 10px; font-size: 12px;">
                                Удалить
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        // Отобразить Google документы
        googleDocs.forEach(doc => {
            html += `
                <div class="content-card">
                    <div class="card-header">
                        <h3>📄 ${doc.title}</h3>
                        <span class="date">${doc.createdAt}</span>
                    </div>
                    <div class="card-content">
                        <p>Google документ</p>
                        <a href="${doc.url}" target="_blank" class="doc-link">Открыть документ</a>
                        ${auth.isAdmin() || user.role === 'admin' ? `
                            <button onclick="deleteDocFromMenu(${doc.id})" class="btn-danger" style="margin-top: 10px; padding: 5px 10px; font-size: 12px;">
                                Удалить
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        // Отобразить файлы
        files.forEach(file => {
            if (file.type && file.type.startsWith('image/')) {
                html += `
                    <div class="content-card file-card">
                        <div class="file-preview">
                            <img src="${file.url}" alt="${file.name}">
                        </div>
                        <div class="card-content">
                            <h4>${file.name}</h4>
                            <small>Добавлено: ${file.createdAt}</small>
                            ${auth.isAdmin() || user.role === 'admin' ? `
                                <button onclick="deleteFileFromMenu(${file.id})" class="btn-danger" style="margin-top: 10px; padding: 5px 10px; font-size: 12px;">
                                    Удалить
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="content-card">
                        <div class="card-header">
                            <h3>📁 ${file.name}</h3>
                            <span class="date">${file.createdAt}</span>
                        </div>
                        <div class="card-content">
                            <p>Файл для скачивания</p>
                            <a href="${file.url}" target="_blank" class="doc-link">Скачать файл</a>
                            ${auth.isAdmin() || user.role === 'admin' ? `
                                <button onclick="deleteFileFromMenu(${file.id})" class="btn-danger" style="margin-top: 10px; padding: 5px 10px; font-size: 12px;">
                                    Удалить
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        });
        
        html += '</div>';
    }
    
    contentArea.innerHTML = html;
}

// Функции для работы с модальными окнами в меню
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Функции для открытия модальных окон с предустановленными значениями
function openAddContentModal(sectionId, subsectionId) {
    document.getElementById('contentSectionId').value = sectionId;
    document.getElementById('contentSubsectionId').value = subsectionId;
    openModal('addContentModal');
}

function openAddDocModal(sectionId, subsectionId) {
    document.getElementById('docSectionId').value = sectionId;
    document.getElementById('docSubsectionId').value = subsectionId;
    openModal('addDocModal');
}

function openUploadFileModal(sectionId, subsectionId) {
    document.getElementById('fileSectionId').value = sectionId;
    document.getElementById('fileSubsectionId').value = subsectionId;
    openModal('uploadFileModal');
}

// Функции удаления контента из меню
function deleteContentFromMenu(key, id) {
    if (!auth.isAdmin() && auth.currentUser.role !== 'admin') return;
    
    if (confirm('Вы уверены, что хотите удалить этот контент?')) {
        let content = JSON.parse(localStorage.getItem('uptaxi_content')) || {};
        if (content[key]) {
            content[key] = content[key].filter(item => item.id !== id);
            localStorage.setItem('uptaxi_content', JSON.stringify(content));
            contentManager.content = content;
            
            // Найти текущий раздел и подраздел
            const parts = key.split('_');
            if (parts.length === 2) {
                showContent(parts[0], parts[1]);
            }
        }
    }
}

function deleteDocFromMenu(id) {
    if (!auth.isAdmin() && auth.currentUser.role !== 'admin') return;
    
    if (confirm('Вы уверены, что хотите удалить этот документ?')) {
        let googleDocs = JSON.parse(localStorage.getItem('uptaxi_googleDocs')) || [];
        const doc = googleDocs.find(d => d.id === id);
        googleDocs = googleDocs.filter(doc => doc.id !== id);
        localStorage.setItem('uptaxi_googleDocs', JSON.stringify(googleDocs));
        contentManager.googleDocs = googleDocs;
        
        // Перезагрузить текущий раздел
        if (doc) {
            showContent(doc.sectionId, doc.subsectionId);
        }
    }
}

function deleteFileFromMenu(id) {
    if (!auth.isAdmin() && auth.currentUser.role !== 'admin') return;
    
    if (confirm('Вы уверены, что хотите удалить этот файл?')) {
        let files = JSON.parse(localStorage.getItem('uptaxi_files')) || [];
        const file = files.find(f => f.id === id);
        files = files.filter(file => file.id !== id);
        localStorage.setItem('uptaxi_files', JSON.stringify(files));
        contentManager.files = files;
        
        // Перезагрузить текущий раздел
        if (file) {
            showContent(file.sectionId, file.subsectionId);
        }
    }
}

// Функция загрузки файлов из меню
function uploadFiles() {
    const fileInput = document.getElementById('fileUpload');
    const files = fileInput.files;
    const sectionId = document.getElementById('fileSectionId').value;
    const subsectionId = document.getElementById('fileSubsectionId').value;
    
    if (files.length === 0) {
        alert('Выберите файлы для загрузки');
        return;
    }
    
    if (!sectionId || !subsectionId) {
        alert('Ошибка: не указан раздел или подраздел');
        return;
    }
    
    Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file);
        contentManager.addFile(file.name, url, sectionId, subsectionId, file.type);
    });
    
    // Добавить активность
    contentManager.addActivity(`Загружено файлов: ${files.length}`, '📁');
    
    closeModal('uploadFileModal');
    fileInput.value = '';
    alert('Файлы успешно загружены');
    
    // Перезагрузить текущий раздел
    showContent(sectionId, subsectionId);
}

// Настройка обработчиков форм
function setupFormHandlers() {
    // Обработчик добавления контента
    const addContentForm = document.getElementById('addContentForm');
    if (addContentForm) {
        addContentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const sectionId = document.getElementById('contentSectionId').value;
            const subsectionId = document.getElementById('contentSubsectionId').value;
            const title = document.getElementById('contentTitle').value;
            const description = document.getElementById('contentDescription').value;
            
            if (!sectionId || !subsectionId) {
                alert('Ошибка: не указан раздел или подраздел');
                return;
            }
            
            contentManager.addContent(sectionId, subsectionId, title, description);
            contentManager.addActivity(`Добавлен контент: ${title}`, '📝');
            
            closeModal('addContentModal');
            addContentForm.reset();
            
            // Остаться в текущем разделе
            showContent(sectionId, subsectionId);
        });
    }
    
    // Обработчик добавления документа
    const addDocForm = document.getElementById('addDocForm');
    if (addDocForm) {
        addDocForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const sectionId = document.getElementById('docSectionId').value;
            const subsectionId = document.getElementById('docSubsectionId').value;
            const title = document.getElementById('docTitle').value;
            const url = document.getElementById('docUrl').value;
            
            if (!sectionId || !subsectionId) {
                alert('Ошибка: не указан раздел или подраздел');
                return;
            }
            
            contentManager.addGoogleDoc(title, url, sectionId, subsectionId);
            contentManager.addActivity(`Добавлен документ: ${title}`, '📄');
            
            closeModal('addDocModal');
            addDocForm.reset();
            
            // Остаться в текущем разделе
            showContent(sectionId, subsectionId);
        });
    }
}

// Обновление последних активностей
function updateRecentActivity() {
    const activities = contentManager.getActivities();
    const activityContainer = document.getElementById('recent-activity');
    
    if (!activityContainer) return;
    
    let html = '';
    activities.forEach(activity => {
        html += `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-info">
                    <p>${activity.title}</p>
                    <small>${activity.date}</small>
                </div>
                ${auth.isAdmin() ? `<button class="btn-danger" onclick="deleteActivity(${activity.id})" style="margin-left: auto; padding: 5px 10px; font-size: 12px;">Удалить</button>` : ''}
            </div>
        `;
    });
    
    if (activities.length === 0) {
        html = '<p>Нет последних обновлений</p>';
    }
    
    activityContainer.innerHTML = html;
}

// Функция удаления активности (только для админов)
function deleteActivity(id) {
    if (!auth.isAdmin()) return;
    
    if (confirm('Вы уверены, что хотите удалить это обновление?')) {
        let activities = JSON.parse(localStorage.getItem('uptaxi_activities')) || [];
        activities = activities.filter(activity => activity.id !== id);
        localStorage.setItem('uptaxi_activities', JSON.stringify(activities));
        contentManager.activities = activities;
        updateRecentActivity();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (checkAuth()) {
        const user = auth.currentUser;
        
        // Загрузить динамические разделы
        loadDynamicSections();
        
        document.getElementById('currentUser').textContent = user.username;
        document.getElementById('userInitials').textContent = user.username.charAt(0).toUpperCase();
        
        // Показать админ-панель только для администраторов
        if (auth.isAdmin()) {
            document.querySelectorAll('.admin-only').forEach(element => {
                element.style.display = 'block';
            });
        }
        
        // Загрузить последние активности
        updateRecentActivity();
        
        // Настроить обработчики форм
        setupFormHandlers();
        
        // Слушать обновления разделов
        window.addEventListener('sectionsUpdated', function() {
            loadDynamicSections();
            updateRecentActivity();
        });
        
        // Обновлять разделы при изменении localStorage
        window.addEventListener('storage', function(e) {
            if (e.key === 'uptaxi_sections') {
                loadDynamicSections();
            }
        });
    }
});