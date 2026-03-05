import ApiService from '../api/ApiService.js';

const api = new ApiService();
const BACK_URL = '../ticket-sales/ticket-sales.html';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-hall-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const closeBtn = document.getElementById('close-btn');

    cancelBtn.addEventListener('click', () => {
        window.location.href = BACK_URL;
    });
    closeBtn.addEventListener('click', () => {
        window.location.href = BACK_URL;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const hallName = document.getElementById('hall-name').value.trim();
        if (!hallName) return;

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Создание...';

        try {
            await api.addHall(hallName);
            window.location.href = BACK_URL;
        } catch (err) {
            alert('Ошибка при создании зала: ' + err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Добавить зал';
        }
    });
});
