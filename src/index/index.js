import ApiService from '../api/ApiService.js';

const api = new ApiService();

// ── Текущая выбранная дата (по умолчанию — сегодня) ──
let selectedDate = new Date();

/**
 * Инициализация: генерация навигации по дням и загрузка данных.
 */
async function init() {
    renderDayNav();
    await loadMovies();
}

// ─────────────────────────────────────────────────────────
//  НАВИГАЦИЯ ПО ДНЯМ
// ─────────────────────────────────────────────────────────

const DAY_NAMES_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

/**
 * Рендерит навигацию по дням (6 дней + стрелка).
 */
function renderDayNav() {
    const nav = document.getElementById('page-nav');
    nav.innerHTML = '';

    const today = new Date();

    for (let i = 0; i < 6; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dayLink = document.createElement('a');
        dayLink.classList.add('page-nav__day');
        dayLink.href = '#';

        // Сегодня
        if (i === 0) {
            dayLink.classList.add('page-nav__day_today');
            dayLink.classList.add('page-nav__day_chosen');
        }

        // Выходные
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayLink.classList.add('page-nav__day_weekend');
        }

        // Контент
        const weekSpan = document.createElement('span');
        weekSpan.classList.add('page-nav__day-week');
        weekSpan.textContent = i === 0 ? 'Сегодня' : `${DAY_NAMES_SHORT[dayOfWeek]},`;

        const numberSpan = document.createElement('span');
        numberSpan.classList.add('page-nav__day-number');
        if (i === 0) {
            numberSpan.textContent = `${DAY_NAMES_SHORT[dayOfWeek]}, ${date.getDate()}`;
        } else {
            numberSpan.textContent = String(date.getDate());
        }

        dayLink.appendChild(weekSpan);
        dayLink.appendChild(numberSpan);

        // Сохраняем дату для клика
        dayLink.dataset.date = formatDate(date);

        // Клик — выбрать день
        dayLink.addEventListener('click', (e) => {
            e.preventDefault();
            selectDay(dayLink);
        });

        nav.appendChild(dayLink);
    }

    // Стрелка «вперёд»
    const nextLink = document.createElement('a');
    nextLink.classList.add('page-nav__day', 'page-nav__day_next');
    nextLink.href = '#';
    nextLink.addEventListener('click', (e) => e.preventDefault());
    nav.appendChild(nextLink);
}

/**
 * Обработчик выбора дня.
 */
function selectDay(dayEl) {
    const nav = document.getElementById('page-nav');
    const days = nav.querySelectorAll('.page-nav__day');

    days.forEach((d) => {
        d.classList.remove('page-nav__day_chosen');
        d.classList.remove('page-nav__day_prev');
    });

    dayEl.classList.add('page-nav__day_chosen');

    // Добавляем класс предыдущему элементу
    const prevDay = dayEl.previousElementSibling;
    if (prevDay && prevDay.classList.contains('page-nav__day')) {
        prevDay.classList.add('page-nav__day_prev');
    }

    // Обновляем выбранную дату
    selectedDate = new Date(dayEl.dataset.date + 'T00:00:00');

    // Перезагружаем расписание
    loadMovies();
}

// ─────────────────────────────────────────────────────────
//  ЗАГРУЗКА ФИЛЬМОВ И СЕАНСОВ
// ─────────────────────────────────────────────────────────

/**
 * Загружает данные с API и рендерит карточки фильмов.
 */
async function loadMovies() {
    try {
        const data = await api.getAllData();
        const { halls, films, seances } = data;

        // Показываем только открытые залы
        const openHalls = halls.filter((h) => h.hall_open === 1);

        if (openHalls.length === 0) {
            renderNoData('Нет доступных залов');
            return;
        }

        // Фильтруем сеансы: только для открытых залов
        const openHallIds = new Set(openHalls.map((h) => h.id));
        const activeSeances = seances.filter((s) => openHallIds.has(s.seance_hallid));

        // Группируем сеансы по фильмам
        const filmSeancesMap = new Map();
        activeSeances.forEach((seance) => {
            if (!filmSeancesMap.has(seance.seance_filmid)) {
                filmSeancesMap.set(seance.seance_filmid, []);
            }
            filmSeancesMap.get(seance.seance_filmid).push(seance);
        });

        // Рендерим только фильмы, у которых есть сеансы
        const filmsWithSeances = films.filter((f) => filmSeancesMap.has(f.id));

        if (filmsWithSeances.length === 0) {
            renderNoData('Нет доступных сеансов');
            return;
        }

        renderMovies(filmsWithSeances, filmSeancesMap, openHalls);
    } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        renderNoData('Ошибка загрузки данных');
    }
}

/**
 * Рендерит карточки фильмов.
 */
function renderMovies(films, filmSeancesMap, halls) {
    const container = document.getElementById('movies-container');
    container.innerHTML = '';

    const dateStr = formatDate(selectedDate);
    const now = new Date();
    const isToday = formatDate(now) === dateStr;

    films.forEach((film) => {
        const seances = filmSeancesMap.get(film.id) || [];

        // Группируем сеансы по залам
        const hallSeancesMap = new Map();
        seances.forEach((s) => {
            if (!hallSeancesMap.has(s.seance_hallid)) {
                hallSeancesMap.set(s.seance_hallid, []);
            }
            hallSeancesMap.get(s.seance_hallid).push(s);
        });

        const section = document.createElement('section');
        section.classList.add('movie');

        // ── Постер ──
        const posterDiv = document.createElement('div');
        posterDiv.classList.add('movie__poster');
        const posterImg = document.createElement('img');
        posterImg.src = film.film_poster || '../img/alpha.jpg';
        posterImg.alt = film.film_name;
        posterDiv.appendChild(posterImg);
        section.appendChild(posterDiv);

        // ── Информация ──
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('movie__info');

        const title = document.createElement('h2');
        title.classList.add('movie__title');
        title.textContent = film.film_name;
        infoDiv.appendChild(title);

        if (film.film_description) {
            const desc = document.createElement('p');
            desc.classList.add('movie__description');
            desc.textContent = film.film_description;
            infoDiv.appendChild(desc);
        }

        const dataP = document.createElement('p');
        dataP.classList.add('movie__data');

        const durationSpan = document.createElement('span');
        durationSpan.classList.add('movie__data-duration');
        durationSpan.textContent = `${film.film_duration} минут`;
        dataP.appendChild(durationSpan);

        const originSpan = document.createElement('span');
        originSpan.classList.add('movie__data-origin');
        originSpan.textContent = film.film_origin || '';
        dataP.appendChild(originSpan);

        infoDiv.appendChild(dataP);
        section.appendChild(infoDiv);

        // ── Сеансы по залам ──
        halls.forEach((hall) => {
            const hallSeances = hallSeancesMap.get(hall.id);
            if (!hallSeances || hallSeances.length === 0) return;

            // Сортируем сеансы по времени
            hallSeances.sort((a, b) => a.seance_time.localeCompare(b.seance_time));

            const seancesDiv = document.createElement('div');
            seancesDiv.classList.add('movie__seances');

            const hallTitle = document.createElement('h3');
            hallTitle.classList.add('movie__seances-hall');
            hallTitle.textContent = hall.hall_name;
            seancesDiv.appendChild(hallTitle);

            const seancesList = document.createElement('div');
            seancesList.classList.add('movie__seances-list');

            hallSeances.forEach((seance) => {
                const link = document.createElement('a');
                link.classList.add('movie__seance');
                link.href = `../hall/hall.html?seanceId=${seance.id}&date=${dateStr}`;

                // Если сегодня — деактивируем прошедшие сеансы
                if (isToday) {
                    const [hours, minutes] = seance.seance_time.split(':').map(Number);
                    const seanceDate = new Date(selectedDate);
                    seanceDate.setHours(hours, minutes, 0, 0);

                    if (seanceDate < now) {
                        link.classList.add('movie__seance--past');
                        link.style.opacity = '0.4';
                        link.style.pointerEvents = 'none';
                    }
                }

                const timeSpan = document.createElement('span');
                timeSpan.classList.add('movie__seance-time');
                timeSpan.textContent = seance.seance_time;
                link.appendChild(timeSpan);

                seancesList.appendChild(link);
            });

            seancesDiv.appendChild(seancesList);
            section.appendChild(seancesDiv);
        });

        container.appendChild(section);
    });
}

/**
 * Показывает сообщение при отсутствии данных.
 */
function renderNoData(message) {
    const container = document.getElementById('movies-container');
    container.innerHTML = `
    <div style="max-width:990px;margin:40px auto;padding:30px;background:rgba(255,255,255,0.9);border-radius:2px;text-align:center;font-size:16px;color:#333;">
      ${message}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────
//  УТИЛИТЫ
// ─────────────────────────────────────────────────────────

/**
 * Форматирует дату в YYYY-MM-DD.
 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ── Запуск ──
init();
