import ApiService from '../api/ApiService.js';
import showAlert from '../api/Alert.js';

const api = new ApiService();

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Пытаемся авторизоваться через API
            await api.login(email, password);

            // Если успешно — сохраняем состояние или просто переходим в админку
            // Обычно после логина перенаправляют на страницу управления сеансами
            // Переходим на страницу администратора (ticket-sales)
            window.location.assign('../ticket-sales/ticket-sales.html');

        } catch (error) {
            showAlert('Ошибка авторизации: ' + error.message);
        }
    });
});
