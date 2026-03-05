import ApiService from '../api/ApiService.js';

const api = new ApiService();

const BACK_URL = '../ticket-sales/ticket-sales.html';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-film-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const closeBtn = document.getElementById('close-btn');
    const uploadPosterBtn = document.getElementById('upload-poster-btn');
    const posterInput = document.getElementById('film-poster-input');
    const posterHint = document.getElementById('poster-hint');
    const submitBtn = document.getElementById('submit-btn');

    cancelBtn.addEventListener('click', () => {
        window.location.href = BACK_URL;
    });
    closeBtn.addEventListener('click', () => {
        window.location.href = BACK_URL;
    });

    uploadPosterBtn.addEventListener('click', () => {
        posterInput.click();
    });

    posterInput.addEventListener('change', () => {
        const file = posterInput.files[0];
        if (file) {
            posterHint.textContent = `Постер выбран: ${file.name}`;
        } else {
            posterHint.textContent = '';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const filmName = document.getElementById('film-name').value.trim();
        const filmDuration = parseInt(document.getElementById('film-duration').value);
        const filmDescription = document.getElementById('film-description').value.trim();
        const filmOrigin = document.getElementById('film-origin').value.trim();
        const filePoster = posterInput.files[0] || null;

        let valid = true;
        const nameInput = document.getElementById('film-name');
        const durationInput = document.getElementById('film-duration');

        nameInput.classList.remove('is-invalid');
        durationInput.classList.remove('is-invalid');

        if (!filmName) {
            nameInput.classList.add('is-invalid');
            nameInput.focus();
            valid = false;
        }
        if (!filmDuration || filmDuration < 1) {
            durationInput.classList.add('is-invalid');
            if (valid) durationInput.focus();
            valid = false;
        }
        if (!valid) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Добавление...';

        try {
            await api.addFilm({ filmName, filmDuration, filmDescription, filmOrigin, filePoster });
            window.location.href = BACK_URL;
        } catch (err) {
            alert('Ошибка при добавлении фильма: ' + err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Добавить фильм';
        }
    });
});
