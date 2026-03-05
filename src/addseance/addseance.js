import ApiService from '../api/ApiService.js';

const api = new ApiService();
const BACK_URL = '../ticket-sales/ticket-sales.html';

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('add-seance-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const closeBtn = document.getElementById('close-btn');
    const hallSelect = document.getElementById('seance-hall');
    const filmSelect = document.getElementById('seance-film');
    const submitBtn = document.getElementById('submit-btn');

    cancelBtn.addEventListener('click', () => {
        window.location.href = BACK_URL;
    });
    closeBtn.addEventListener('click', () => {
        window.location.href = BACK_URL;
    });

    try {
        const data = await api.getAllData();
        const halls = data.halls || [];
        const films = data.films || [];

        halls.forEach(hall => {
            const option = document.createElement('option');
            option.value = hall.id;
            option.textContent = hall.hall_name;
            hallSelect.appendChild(option);
        });

        const urlParams = new URLSearchParams(window.location.search);
        const preselectedHallId = urlParams.get('hallId');
        if (preselectedHallId) {
            hallSelect.value = preselectedHallId;
        }

        films.forEach(film => {
            const option = document.createElement('option');
            option.value = film.id;
            option.textContent = film.film_name;
            filmSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        alert('Не удалось загрузить список залов или фильмов');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const seanceHallid = hallSelect.value;
        const seanceFilmid = filmSelect.value;
        const seanceTime = document.getElementById('seance-time').value;

        if (!seanceHallid || !seanceFilmid || !seanceTime) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Добавление...';

        try {
            await api.addSeance(seanceHallid, seanceFilmid, seanceTime);
            window.location.href = BACK_URL;
        } catch (err) {
            let message = err.message;
            if (message.includes('пересекается')) {
                message += '\n\nСовет: Между сеансами должен быть перерыв хотя бы в 1 минуту (например, 18:31 вместо 18:30).';
            }
            alert('Ошибка при добавлении сеанса: ' + message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Добавить сеанс';
        }
    });
});
