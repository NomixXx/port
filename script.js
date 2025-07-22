// Система аутентификации
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('uptaxi_users')) || [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'user', password: 'user123', role: 'user' }
        ];
        this.currentUser = JSON.parse(localStorage.getItem('uptaxi_currentUser')) || null;
        this.saveUsers();
    }

    saveUsers() {
        localStorage.setItem('uptaxi_users', JSON.stringify(this.users));
    }

    login(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);
        if (user) {
            // Убедиться, что у пользователя есть уровень доступа
            if (!user.accessLevel) {
                user.accessLevel = user.role === 'admin' ? 10 : 1;
                console.log('Установлен уровень доступа по умолчанию:', user.accessLevel);
                this.saveUsers();
            }
            
            // Автоматически устанавливаем максимальный уровень доступа для админов
            if (user.role === 'admin' && user.accessLevel !== 10) {
                user.accessLevel = 10;
                console.log('Установлен максимальный уровень для админа:', user.accessLevel);
                this.saveUsers();
            }
            
            console.log('Пользователь вошел в систему:', user);
            this.currentUser = user;
            localStorage.setItem('uptaxi_currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('uptaxi_currentUser');
        window.location.href = 'index.html';
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    createUser(username, password, role) {
        if (this.users.find(u => u.username === username)) {
            return false;
        }
        // Установить уровень доступа по умолчанию
        const defaultAccessLevel = role === 'admin' ? 10 : 1;
        this.users.push({ username, password, role, accessLevel: defaultAccessLevel });
        this.saveUsers();
        return true;
    }

    updateUser(oldUsername, newUsername, newPassword, newRole, newAccessLevel) {
        const userIndex = this.users.findIndex(u => u.username === oldUsername);
        if (userIndex !== -1) {
            this.users[userIndex] = { 
                username: newUsername, 
                password: newPassword, 
                role: newRole,
                accessLevel: newAccessLevel || (newRole === 'admin' ? 10 : 1)
            };
            this.saveUsers();
            return true;
        }
        return false;
    }

    deleteUser(username) {
        this.users = this.users.filter(u => u.username !== username);
        this.saveUsers();
    }

    getUsers() {
        return this.users;
    }
}

// Глобальный экземпляр системы аутентификации
const auth = new AuthSystem();

// Функция выхода
function logout() {
    auth.logout();
}

// Обработчик формы входа
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        
        if (auth.login(username, password)) {
            window.location.href = 'menu.html';
        } else {
            errorMessage.textContent = 'Неверный логин или пароль';
            errorMessage.classList.add('show');
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 3000);
        }
    });
}