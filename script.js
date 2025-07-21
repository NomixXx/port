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
        this.users.push({ username, password, role });
        this.saveUsers();
        return true;
    }

    updateUser(oldUsername, newUsername, newPassword, newRole) {
        const userIndex = this.users.findIndex(u => u.username === oldUsername);
        if (userIndex !== -1) {
            this.users[userIndex] = { username: newUsername, password: newPassword, role: newRole };
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