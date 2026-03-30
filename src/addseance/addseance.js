import ApiService from '../api/ApiService.js';
import showAlert from '../api/Alert.js';

const api = new ApiService();
const BACK_URL = '../ticket-sales/ticket-sales.html';

let filmsData = [];
let seancesData = [];

function timeToMin(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function minToTime(minutes) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function checkSeanceOverlap(hallId, filmId, newTime) {
    const newFilm = filmsData.find(f => f.id == filmId);
    if (!newFilm) return null;

    const newStart = timeToMin(newTime);
    const newEnd = newStart + Number(newFilm.film_duration);

    const hallSeances = seancesData.filter(s => s.seance_hallid == hallId);

    for (const existing of hallSeances) {
        const existingFilm = filmsData.find(f => f.id == existing.seance_filmid);
        if (!existingFilm) continue;

        const existStart = timeToMin(existing.seance_time);
        const existEnd = existStart + Number(existingFilm.film_duration);

        if (newStart < existEnd && existStart < newEnd) {
            return `Сеанс пересекается с фильмом "${existingFilm.film_name}" (${existing.seance_time} — ${minToTime(existEnd)}). Выберите другое время.`;
        }
    }

    return null;
}

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
        filmsData = data.films || [];
        seancesData = data.seances || [];

        halls.forEach(hall => {
            const option = document.createElement('option');
            option.value = hall.id;
            option.textContent = hall.hall_name;
            hallSelect.append(option);
        });

        const urlParams = new URLSearchParams(window.location.search);
        const preselectedHallId = urlParams.get('hallId');
        if (preselectedHallId) {
            hallSelect.value = preselectedHallId;
        }

        filmsData.forEach(film => {
            const option = document.createElement('option');
            option.value = film.id;
            option.textContent = film.film_name;
            filmSelect.append(option);
        });
    } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        showAlert('Не удалось загрузить список залов или фильмов');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const seanceHallid = hallSelect.value;
        const seanceFilmid = filmSelect.value;
        const seanceTime = document.getElementById('seance-time').value;

        if (!seanceHallid || !seanceFilmid || !seanceTime) {
            showAlert('Пожалуйста, заполните все поля');
            return;
        }

        const overlapError = checkSeanceOverlap(seanceHallid, seanceFilmid, seanceTime);
        if (overlapError) {
            showAlert(overlapError);
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
            showAlert('Ошибка при добавлении сеанса: ' + message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Добавить сеанс';
        }
    });
});
