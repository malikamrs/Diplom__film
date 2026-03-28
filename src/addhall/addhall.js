import ApiService from '../api/ApiService.js';
import showAlert from '../api/Alert.js';

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

    const nameInput = document.getElementById('hall-name');
    nameInput.addEventListener('input', () => {
        let val = nameInput.value;
        if (val.length > 0) {
            nameInput.value = val.charAt(0).toUpperCase() + val.slice(1);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let hallName = nameInput.value.trim();
        if (!hallName) return;

        hallName = hallName.charAt(0).toUpperCase() + hallName.slice(1);

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Создание...';

        try {
            await api.addHall(hallName);
            window.location.href = BACK_URL;
        } catch (err) {
            showAlert('Ошибка при создании зала: ' + err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Добавить зал';
        }
    });
});
