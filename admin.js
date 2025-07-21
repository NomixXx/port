// Проверка авторизации при загрузке страницы
function checkAdminAuth() {
    if (!auth.isLoggedIn() || !auth.isAdmin()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Система управления разделами (импорт из menu.js)
class AdminSectionManager {
    constructor() {
        this.sections = JSON.parse(localStorage.getItem('uptaxi_sections')) || [];
        this.users = JSON.parse(localStorage.getItem('uptaxi_users')) || [];
        this.content = JSON.parse(localStorage.getItem('uptaxi_content')) || {};
        this.googleDocs = JSON.parse(localStorage.getItem('uptaxi_googleDocs')) || [];
        this.files = JSON.parse(localStorage.getItem('uptaxi_files')) || [];
        this.activities = JSON.parse(localStorage.getItem('uptaxi_activities')) || [];
        this.accessLevels = JSON.parse(localStorage.getItem('uptaxi_accessLevels')) || [
            { id: 1, name: 'Базовый', description: 'Базовый уровень доступа' },
            { id: 2, name: 'Расширенный', description: 'Расширенный уровень доступа' },
            { id: 3, name: 'Полный', description: 'Полный уровень доступа' }
        ];
    }

    saveSections() {
        localStorage.setItem('uptaxi_sections', JSON.stringify(this.sections));
        // Уведомить меню об обновлении
        window.dispatchEvent(new CustomEvent('sectionsUpdated'));
    }

    saveUsers() {
        localStorage.setItem('uptaxi_users', JSON.stringify(this.users));
    }

    saveContent() {
        localStorage.setItem('uptaxi_content', JSON.stringify(this.content));
        localStorage.setItem('uptaxi_googleDocs', JSON.stringify(this.googleDocs));
        localStorage.setItem('uptaxi_files', JSON.stringify(this.files));
        localStorage.setItem('uptaxi_activities', JSON.stringify(this.activities));
    }

    saveAccessLevels() {
        localStorage.setItem('uptaxi_accessLevels', JSON.stringify(this.accessLevels));
    }

    createSection(name, icon, accessLevel) {
        const newSection = {
            id: 'section' + Date.now(),
            name: name,
            icon: icon,
            accessLevel: parseInt(accessLevel),
            subsections: [
                { id: 'subsection1', name: 'Подраздел 1', accessLevel: parseInt(accessLevel) },
                { id: 'subsection2', name: 'Подраздел 2', accessLevel: parseInt(accessLevel) },
                { id: 'subsection3', name: 'Подраздел 3', accessLevel: parseInt(accessLevel) }
            ]
        };
        this.sections.push(newSection);
        this.saveSections();
        return newSection;
    }

    updateSection(sectionId, name, icon, accessLevel, subsections) {
        const sectionIndex = this.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            this.sections[sectionIndex].name = name;
            this.sections[sectionIndex].icon = icon;
            this.sections[sectionIndex].accessLevel = parseInt(accessLevel);
            this.sections[sectionIndex].subsections = subsections;
            this.saveSections();
            return true;
        }
        return false;
    }

    deleteSection(sectionId) {
        this.sections = this.sections.filter(s => s.id !== sectionId);
        this.saveSections();
    }

    createUser(username, password, role, accessLevel) {
        const newUser = {
            username: username,
            password: password,
            role: role,
            accessLevel: parseInt(accessLevel)
        };
        this.users.push(newUser);
        this.saveUsers();
        return newUser;
    }

    updateUser(oldUsername, newUsername, newPassword, newRole, newAccessLevel) {
        const userIndex = this.users.findIndex(u => u.username === oldUsername);
        if (userIndex !== -1) {
            this.users[userIndex].username = newUsername;
            this.users[userIndex].password = newPassword;
            this.users[userIndex].role = newRole;
            this.users[userIndex].accessLevel = parseInt(newAccessLevel);
            this.saveUsers();
            return true;
        }
        return false;
    }

    deleteUser(username) {
        this.users = this.users.filter(u => u.username !== username);
        this.saveUsers();
    }

    addContent(section, subsection, title, description) {
        const key = `${section}_${subsection}`;
        if (!this.content[key]) this.content[key] = [];
        
        this.content[key].push({
            id: Date.now(),
            title: title,
            description: description,
            createdAt: new Date().toLocaleDateString()
        });
        this.saveContent();
    }

    addGoogleDoc(title, url, sectionId, subsectionId) {
        this.googleDocs.push({
            id: Date.now(),
            title: title,
            url: url,
            sectionId: sectionId,
            subsectionId: subsectionId,
            createdAt: new Date().toLocaleDateString()
        });
        this.saveContent();
    }

    addFile(name, url, sectionId, subsectionId, type) {
        this.files.push({
            id: Date.now(),
            name: name,
            url: url,
            sectionId: sectionId,
            subsectionId: subsectionId,
            type: type,
            createdAt: new Date().toLocaleDateString()
        });
        this.saveContent();
    }

    addActivity(title, icon) {
        this.activities.push({
            id: Date.now(),
            title: title,
            icon: icon,
            date: new Date().toLocaleDateString('ru-RU'),
            createdAt: new Date().toLocaleDateString('ru-RU')
        });
        this.saveContent();
    }

    deleteActivity(id) {
        this.activities = this.activities.filter(activity => activity.id !== id);
        this.saveContent();
    }

    createAccessLevel(name, description) {
        const newLevel = {
            id: Date.now(),
            name: name,
            description: description
        };
        this.accessLevels.push(newLevel);
        this.saveAccessLevels();
        return newLevel;
    }

    updateAccessLevel(id, name, description) {
        const levelIndex = this.accessLevels.findIndex(l => l.id == id);
        if (levelIndex !== -1) {
            this.accessLevels[levelIndex].name = name;
            this.accessLevels[levelIndex].description = description;
            this.saveAccessLevels();
            return true;
        }
        return false;
    }

    deleteAccessLevel(id) {
        this.accessLevels = this.accessLevels.filter(l => l.id != id);
        this.saveAccessLevels();
    }
}

// Глобальный экземпляр менеджера
const adminManager = new AdminSectionManager();

// Глобальная переменная для хранения редактируемых подразделов
let editingSubsections = [];

// Функции управления модальными окнами
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        
        // Заполнить селекты разделов если нужно
        if (modalId === 'addContentModal' || modalId === 'addDocModal') {
            fillSectionSelects(modalId);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Заполнение селектов разделов
function fillSectionSelects(modalId) {
    const sectionSelect = document.getElementById(modalId === 'addContentModal' ? 'contentSection' : 'docSection');
    const subsectionSelect = document.getElementById(modalId === 'addContentModal' ? 'contentSubsection' : 'docSubsection');
    
    if (sectionSelect && subsectionSelect) {
        sectionSelect.innerHTML = '<option value="">Выберите раздел</option>';
        adminManager.sections.forEach(section => {
            sectionSelect.innerHTML += `<option value="${section.id}">${section.name}</option>`;
        });
        
        sectionSelect.onchange = function() {
            const selectedSection = adminManager.sections.find(s => s.id === this.value);
            subsectionSelect.innerHTML = '<option value="">Выберите подраздел</option>';
            if (selectedSection) {
                selectedSection.subsections.forEach(subsection => {
                    subsectionSelect.innerHTML += `<option value="${subsection.id}">${subsection.name}</option>`;
                });
            }
        };
    }
}

// Функции переключения разделов админки
function showAdminSection(sectionName) {
    // Убрать активный класс со всех пунктов меню
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Скрыть все разделы
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Показать выбранный раздел
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Активировать пункт меню
    const menuItems = document.querySelectorAll('.admin-nav-item a');
    menuItems.forEach(item => {
        if (item.onclick && item.onclick.toString().includes(sectionName)) {
            item.parentElement.classList.add('active');
        }
    });
    
    // Загрузить данные для раздела
    loadSectionData(sectionName);
}

// Загрузка данных для разделов
function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'users':
            loadUsers();
            break;
        case 'sections':
            loadSections();
            break;
        case 'access':
            loadAccessLevels();
            break;
        case 'content':
            loadContent();
            break;
        case 'files':
            loadFiles();
            break;
        case 'docs':
            loadDocs();
            break;
        case 'activities':
            loadActivities();
            break;
        case 'subsections':
            loadSubsections();
            break;
    }
}

// Загрузка статистики дашборда
function loadDashboardStats() {
    document.getElementById('totalUsers').textContent = adminManager.users.length;
    document.getElementById('totalSections').textContent = adminManager.sections.length;
    
    let totalContent = 0;
    Object.values(adminManager.content).forEach(sectionContent => {
        totalContent += sectionContent.length;
    });
    document.getElementById('totalContent').textContent = totalContent;
    document.getElementById('totalDocs').textContent = adminManager.googleDocs.length;
}

// Загрузка пользователей
function loadUsers() {
    const grid = document.getElementById('users-grid');
    if (!grid) return;
    
    let html = '';
    adminManager.users.forEach(user => {
        html += `
            <div class="data-card">
                <h4>${user.username}</h4>
                <p>Роль: ${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
                <p>Уровень доступа: ${user.accessLevel || 1}</p>
                <div class="data-card-actions">
                    <button class="btn-edit" onclick="editUser('${user.username}')">Редактировать</button>
                    <button class="btn-danger" onclick="deleteUser('${user.username}')">Удалить</button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

// Загрузка разделов
function loadSections() {
    const grid = document.getElementById('sections-grid');
    if (!grid) return;
    
    let html = '';
    adminManager.sections.forEach(section => {
        html += `
            <div class="data-card">
                <h4>${section.icon} ${section.name}</h4>
                <p>Подразделов: ${section.subsections ? section.subsections.length : 0}</p>
                <p>Доступ: ${getAccessLevelName(section.accessLevel)}</p>
                <div class="data-card-actions">
                    <button class="btn-edit" onclick="editSection('${section.id}')">Редактировать</button>
                    <button class="btn-danger" onclick="deleteSection('${section.id}')">Удалить</button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

// Загрузка уровней доступа
function loadAccessLevels() {
    const grid = document.getElementById('access-grid');
    if (!grid) return;
    
    let html = '';
    adminManager.accessLevels.forEach(level => {
        html += `
            <div class="data-card">
                <h4>${level.name}</h4>
                <p>${level.description}</p>
                <div class="data-card-actions">
                    <button class="btn-edit" onclick="editAccessLevel(${level.id})">Редактировать</button>
                    <button class="btn-danger" onclick="deleteAccessLevel(${level.id})">Удалить</button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

// Загрузка контента
function loadContent() {
    const grid = document.getElementById('content-grid');
    if (!grid) return;
    
    let html = '';
    Object.entries(adminManager.content).forEach(([key, items]) => {
        items.forEach(item => {
            html += `
                <div class="data-card">
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                    <p><small>Создано: ${item.createdAt}</small></p>
                    <div class="data-card-actions">
                        <button class="btn-danger" onclick="deleteContent('${key}', ${item.id})">Удалить</button>
                    </div>
                </div>
            `;
        });
    });
    
    if (html === '') {
        html = '<p>Контент не найден</p>';
    }
    
    grid.innerHTML = html;
}

// Загрузка файлов
function loadFiles() {
    const grid = document.getElementById('files-grid');
    if (!grid) return;
    
    let html = '';
    adminManager.files.forEach(file => {
        html += `
            <div class="data-card">
                <h4>${file.name}</h4>
                <p>Тип: ${file.type}</p>
                <p><small>Загружено: ${file.createdAt}</small></p>
                <div class="data-card-actions">
                    <a href="${file.url}" target="_blank" class="btn-edit">Открыть</a>
                    <button class="btn-danger" onclick="deleteFile(${file.id})">Удалить</button>
                </div>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p>Файлы не найдены</p>';
    }
    
    grid.innerHTML = html;
}

// Загрузка документов
function loadDocs() {
    const grid = document.getElementById('docs-grid');
    if (!grid) return;
    
    let html = '';
    adminManager.googleDocs.forEach(doc => {
        html += `
            <div class="data-card">
                <h4>${doc.title}</h4>
                <p><small>Создано: ${doc.createdAt}</small></p>
                <div class="data-card-actions">
                    <a href="${doc.url}" target="_blank" class="btn-edit">Открыть</a>
                    <button class="btn-danger" onclick="deleteDoc(${doc.id})">Удалить</button>
                </div>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p>Документы не найдены</p>';
    }
    
    grid.innerHTML = html;
}

// Загрузка активностей
function loadActivities() {
    const grid = document.getElementById('activities-grid');
    if (!grid) return;
    
    let html = '';
    adminManager.activities.forEach(activity => {
        html += `
            <div class="data-card">
                <h4>${activity.icon} ${activity.title}</h4>
                <p><small>${activity.date}</small></p>
                <div class="data-card-actions">
                    <button class="btn-danger" onclick="deleteActivity(${activity.id})">Удалить</button>
                </div>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p>Активности не найдены</p>';
    }
    
    grid.innerHTML = html;
}

// Загрузка подразделов
function loadSubsections() {
    const grid = document.getElementById('subsections-grid');
    const filter = document.getElementById('sectionFilter');
    
    if (!grid || !filter) return;
    
    // Заполнить фильтр разделов
    filter.innerHTML = '<option value="">Все разделы</option>';
    adminManager.sections.forEach(section => {
        filter.innerHTML += `<option value="${section.id}">${section.name}</option>`;
    });
    
    filterSubsectionContent();
}

// Фильтрация контента подразделов
function filterSubsectionContent() {
    const grid = document.getElementById('subsections-grid');
    const filter = document.getElementById('sectionFilter');
    
    if (!grid || !filter) return;
    
    const selectedSectionId = filter.value;
    let html = '';
    
    adminManager.sections.forEach(section => {
        if (!selectedSectionId || section.id === selectedSectionId) {
            section.subsections.forEach(subsection => {
                const key = `${section.id}_${subsection.id}`;
                const content = adminManager.content[key] || [];
                const docs = adminManager.googleDocs.filter(doc => 
                    doc.sectionId === section.id && doc.subsectionId === subsection.id
                );
                const files = adminManager.files.filter(file => 
                    file.sectionId === section.id && file.subsectionId === subsection.id
                );
                
                const totalItems = content.length + docs.length + files.length;
                
                html += `
                    <div class="data-card">
                        <h4>${section.icon} ${section.name} - ${subsection.name}</h4>
                        <p>Контента: ${content.length}</p>
                        <p>Документов: ${docs.length}</p>
                        <p>Файлов: ${files.length}</p>
                        <p>Всего элементов: ${totalItems}</p>
                        <div class="data-card-actions">
                            <button class="btn-edit" onclick="manageSubsectionContent('${section.id}', '${subsection.id}')">Управлять</button>
                        </div>
                    </div>
                `;
            });
        }
    });
    
    if (html === '') {
        html = '<p>Подразделы не найдены</p>';
    }
    
    grid.innerHTML = html;
}

// Управление контентом подраздела
function manageSubsectionContent(sectionId, subsectionId) {
    alert(`Управление контентом подраздела ${sectionId}_${subsectionId} будет добавлено в следующих версиях`);
}

// Вспомогательные функции
function getAccessLevelName(level) {
    const accessLevel = adminManager.accessLevels.find(l => l.id == level);
    return accessLevel ? accessLevel.name : 'Неизвестный';
}

// Функции редактирования
function editUser(username) {
    const user = adminManager.users.find(u => u.username === username);
    if (user) {
        document.getElementById('editUserOldUsername').value = username;
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editPassword').value = user.password;
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserAccess').value = user.accessLevel || 1;
        openModal('editUserModal');
    }
}

function editSection(sectionId) {
    const section = adminManager.sections.find(s => s.id === sectionId);
    if (section) {
        document.getElementById('editSectionId').value = sectionId;
        document.getElementById('editSectionName').value = section.name;
        document.getElementById('editSectionIcon').value = section.icon;
        document.getElementById('editSectionAccess').value = section.accessLevel;
        
        // Сохранить копию подразделов для редактирования
        editingSubsections = JSON.parse(JSON.stringify(section.subsections));
        loadSubsectionsForEdit(editingSubsections);
        openModal('editSectionModal');
    }
}

function loadSubsectionsForEdit(subsections) {
    const container = document.getElementById('editSubsectionsList');
    if (!container) return;
    
    let html = '';
    subsections.forEach((subsection, index) => {
        html += `
            <div class="subsection-edit-item" style="margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <div class="form-group">
                    <label>Название подраздела ${index + 1}</label>
                    <input type="text" value="${subsection.name}" onchange="updateSubsectionName(${index}, this.value)">
                </div>
                <div class="form-group">
                    <label>Уровень доступа</label>
                    <select onchange="updateSubsectionAccess(${index}, this.value)">
                        <option value="1" ${subsection.accessLevel == 1 ? 'selected' : ''}>Базовый</option>
                        <option value="2" ${subsection.accessLevel == 2 ? 'selected' : ''}>Расширенный</option>
                        <option value="3" ${subsection.accessLevel == 3 ? 'selected' : ''}>Полный</option>
                    </select>
                </div>
                <button type="button" onclick="removeSubsection(${index})" class="btn-danger" style="margin-top: 10px;">Удалить подраздел</button>
            </div>
        `;
    });
    container.innerHTML = html;
}

function updateSubsectionName(index, name) {
    if (editingSubsections[index]) {
        editingSubsections[index].name = name;
    }
}

function updateSubsectionAccess(index, accessLevel) {
    if (editingSubsections[index]) {
        editingSubsections[index].accessLevel = parseInt(accessLevel);
    }
}

function addSubsectionToEdit() {
    const newSubsection = {
        id: 'subsection' + Date.now(),
        name: 'Новый подраздел',
        accessLevel: 1
    };
    editingSubsections.push(newSubsection);
    loadSubsectionsForEdit(editingSubsections);
}

function removeSubsection(index) {
    if (confirm('Вы уверены, что хотите удалить этот подраздел?')) {
        editingSubsections.splice(index, 1);
        loadSubsectionsForEdit(editingSubsections);
    }
}

function editAccessLevel(id) {
    const level = adminManager.accessLevels.find(l => l.id == id);
    if (level) {
        document.getElementById('editAccessId').value = id;
        document.getElementById('editAccessName').value = level.name;
        document.getElementById('editAccessDescription').value = level.description;
        openModal('editAccessModal');
    }
}

// Функции удаления
function deleteUser(username) {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        adminManager.deleteUser(username);
        loadUsers();
    }
}

function deleteSection(sectionId) {
    if (confirm('Вы уверены, что хотите удалить этот раздел?')) {
        adminManager.deleteSection(sectionId);
        loadSections();
    }
}

function deleteAccessLevel(id) {
    if (confirm('Вы уверены, что хотите удалить этот уровень доступа?')) {
        adminManager.deleteAccessLevel(id);
        loadAccessLevels();
    }
}

function deleteContent(key, id) {
    if (confirm('Вы уверены, что хотите удалить этот контент?')) {
        adminManager.content[key] = adminManager.content[key].filter(item => item.id !== id);
        adminManager.saveContent();
        loadContent();
    }
}

function deleteFile(id) {
    if (confirm('Вы уверены, что хотите удалить этот файл?')) {
        adminManager.files = adminManager.files.filter(file => file.id !== id);
        adminManager.saveContent();
        loadFiles();
    }
}

function deleteDoc(id) {
    if (confirm('Вы уверены, что хотите удалить этот документ?')) {
        adminManager.googleDocs = adminManager.googleDocs.filter(doc => doc.id !== id);
        adminManager.saveContent();
        loadDocs();
    }
}

function deleteActivity(id) {
    if (confirm('Вы уверены, что хотите удалить это обновление?')) {
        adminManager.deleteActivity(id);
        loadActivities();
    }
}

// Функция загрузки файлов
function uploadFiles() {
    const fileInput = document.getElementById('fileUpload');
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('Выберите файлы для загрузки');
        return;
    }
    
    // Имитация загрузки файлов (в реальном приложении здесь был бы запрос к серверу)
    Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file);
        adminManager.addFile(file.name, url, '', '', file.type);
    });
    
    loadFiles();
    fileInput.value = '';
    alert('Файлы успешно загружены');
}

// Обработчики форм
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuth()) return;
    
    const user = auth.currentUser;
    document.getElementById('adminCurrentUser').textContent = user.username;
    document.getElementById('adminUserInitials').textContent = user.username.charAt(0).toUpperCase();
    
    // Показать дашборд по умолчанию
    showAdminSection('dashboard');
    
    // Обработчик создания пользователя
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        createUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('newUsername').value;
            const password = document.getElementById('newPassword').value;
            const role = document.getElementById('newUserRole').value;
            const accessLevel = document.getElementById('newUserAccess').value;
            
            if (adminManager.users.find(u => u.username === username)) {
                alert('Пользователь с таким именем уже существует');
                return;
            }
            
            adminManager.createUser(username, password, role, accessLevel);
            closeModal('createUserModal');
            loadUsers();
            createUserForm.reset();
        });
    }
    
    // Обработчик создания раздела
    const createSectionForm = document.getElementById('createSectionForm');
    if (createSectionForm) {
        createSectionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('sectionName').value;
            const icon = document.getElementById('sectionIcon').value;
            const accessLevel = document.getElementById('sectionAccess').value;
            
            adminManager.createSection(name, icon, accessLevel);
            closeModal('createSectionModal');
            loadSections();
            createSectionForm.reset();
        });
    }
    
    // Обработчик создания уровня доступа
    const createAccessForm = document.getElementById('createAccessForm');
    if (createAccessForm) {
        createAccessForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('accessName').value;
            const description = document.getElementById('accessDescription').value;
            
            adminManager.createAccessLevel(name, description);
            closeModal('createAccessModal');
            loadAccessLevels();
            createAccessForm.reset();
        });
    }
    
    // Обработчик редактирования пользователя
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const oldUsername = document.getElementById('editUserOldUsername').value;
            const newUsername = document.getElementById('editUsername').value;
            const newPassword = document.getElementById('editPassword').value;
            const newRole = document.getElementById('editUserRole').value;
            const newAccessLevel = document.getElementById('editUserAccess').value;
            
            adminManager.updateUser(oldUsername, newUsername, newPassword, newRole, newAccessLevel);
            closeModal('editUserModal');
            loadUsers();
        });
    }
    
    // Обработчик редактирования раздела
    const editSectionForm = document.getElementById('editSectionForm');
    if (editSectionForm) {
        editSectionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const sectionId = document.getElementById('editSectionId').value;
            const name = document.getElementById('editSectionName').value;
            const icon = document.getElementById('editSectionIcon').value;
            const accessLevel = document.getElementById('editSectionAccess').value;
            
            adminManager.updateSection(sectionId, name, icon, accessLevel, editingSubsections);
            closeModal('editSectionModal');
            loadSections();
        });
    }
    
    // Обработчик редактирования уровня доступа
    const editAccessForm = document.getElementById('editAccessForm');
    if (editAccessForm) {
        editAccessForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const id = document.getElementById('editAccessId').value;
            const name = document.getElementById('editAccessName').value;
            const description = document.getElementById('editAccessDescription').value;
            
            adminManager.updateAccessLevel(id, name, description);
            closeModal('editAccessModal');
            loadAccessLevels();
        });
    }
    
    // Обработчик добавления контента
    const addContentForm = document.getElementById('addContentForm');
    if (addContentForm) {
        addContentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const section = document.getElementById('contentSection').value;
            const subsection = document.getElementById('contentSubsection').value;
            const title = document.getElementById('contentTitle').value;
            const description = document.getElementById('contentDescription').value;
            
            adminManager.addContent(section, subsection, title, description);
            closeModal('addContentModal');
            loadContent();
            addContentForm.reset();
        });
    }
    
    // Обработчик добавления документа
    const addDocForm = document.getElementById('addDocForm');
    if (addDocForm) {
        addDocForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('docTitle').value;
            const url = document.getElementById('docUrl').value;
            const sectionId = document.getElementById('docSection').value;
            const subsectionId = document.getElementById('docSubsection').value;
            
            adminManager.addGoogleDoc(title, url, sectionId, subsectionId);
            closeModal('addDocModal');
            loadDocs();
            addDocForm.reset();
        });
    }
    
    // Обработчик добавления активности
    const addActivityForm = document.getElementById('addActivityForm');
    if (addActivityForm) {
        addActivityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('activityTitle').value;
            const icon = document.getElementById('activityIcon').value;
            
            adminManager.addActivity(title, icon);
            closeModal('addActivityModal');
            loadActivities();
            addActivityForm.reset();
        });
    }
});