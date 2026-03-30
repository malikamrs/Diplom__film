import ApiService from '../api/ApiService.js';

const api = new ApiService();

let selectedDate = new Date();
let startDateOffset = 0;


async function init() {
    renderDayNav();
    await loadMovies();
}

const DAY_NAMES_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
function renderDayNav() {
    const nav = document.getElementById('page-nav');
    nav.innerHTML = '';

    const today = new Date();

    if (startDateOffset > 0) {
        const prevLink = document.createElement('a');
        prevLink.classList.add('page-nav__day', 'page-nav__day_prev-arrow');
        prevLink.href = '#';
        prevLink.textContent = '<';
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            startDateOffset--;
            const newDate = new Date();
            newDate.setDate(newDate.getDate() + startDateOffset);
            selectedDate = newDate;
            renderDayNav();
            loadMovies();
        });
        nav.append(prevLink);
    }

    for (let i = 0; i < 6; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i + startDateOffset);

        const dayLink = document.createElement('a');
        dayLink.classList.add('page-nav__day');
        dayLink.href = '#';

        if (formatDate(date) === formatDate(selectedDate)) {
            dayLink.classList.add('page-nav__day_chosen');
        }

        const isRealToday = i + startDateOffset === 0;
        if (isRealToday) {
            dayLink.classList.add('page-nav__day_today');
        }

        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayLink.classList.add('page-nav__day_weekend');
        }

        const weekSpan = document.createElement('span');
        weekSpan.classList.add('page-nav__day-week');
        weekSpan.textContent = isRealToday ? 'Сегодня' : `${DAY_NAMES_SHORT[dayOfWeek]},`;

        const numberSpan = document.createElement('span');
        numberSpan.classList.add('page-nav__day-number');
        if (isRealToday) {
            numberSpan.textContent = `${DAY_NAMES_SHORT[dayOfWeek]}, ${date.getDate()}`;
        } else {
            numberSpan.textContent = String(date.getDate());
        }

        dayLink.append(weekSpan);
        dayLink.append(numberSpan);

        dayLink.dataset.date = formatDate(date);

        dayLink.addEventListener('click', (e) => {
            e.preventDefault();
            selectDay(dayLink);
        });

        nav.append(dayLink);
    }

    const nextLink = document.createElement('a');
    nextLink.classList.add('page-nav__day', 'page-nav__day_next');
    nextLink.href = '#';
    nextLink.textContent = '>';
    nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        startDateOffset++;
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + startDateOffset);
        selectedDate = newDate;
        renderDayNav();
        loadMovies();
    });
    nav.append(nextLink);

    if (startDateOffset > 0) {
        nav.classList.add('page-nav_double-arrows');
    } else {
        nav.classList.remove('page-nav_double-arrows');
    }
}

function selectDay(dayEl) {
    const nav = document.getElementById('page-nav');
    const days = nav.querySelectorAll('.page-nav__day');

    days.forEach((d) => {
        d.classList.remove('page-nav__day_chosen');
        d.classList.remove('page-nav__day_prev');
    });

    dayEl.classList.add('page-nav__day_chosen');

    const prevDay = dayEl.previousElementSibling;
    if (prevDay && prevDay.classList.contains('page-nav__day')) {
        prevDay.classList.add('page-nav__day_prev');
    }
    selectedDate = new Date(dayEl.dataset.date + 'T00:00:00');

    loadMovies();
}
async function loadMovies() {
    try {
        const data = await api.getAllData();
        const { halls, films, seances } = data;
        const openHalls = halls.filter((h) => Number(h.hall_open) === 1);

        if (openHalls.length === 0) {
            renderNoData('Нет доступных залов');
            return;
        }

        const openHallIds = new Set(openHalls.map((h) => Number(h.id)));
        const activeSeances = seances.filter((s) => openHallIds.has(Number(s.seance_hallid)));

        const filmSeancesMap = new Map();
        activeSeances.forEach((seance) => {
            const filmId = Number(seance.seance_filmid);
            if (!filmSeancesMap.has(filmId)) {
                filmSeancesMap.set(filmId, []);
            }
            filmSeancesMap.get(filmId).push(seance);
        });

        const filmsWithSeances = films.filter((f) => filmSeancesMap.has(Number(f.id)));

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

function renderMovies(films, filmSeancesMap, halls) {
    const container = document.getElementById('movies-container');
    container.innerHTML = '';

    const dateStr = formatDate(selectedDate);
    const now = new Date();
    const isToday = formatDate(now) === dateStr;

    films.forEach((film) => {
        const seances = filmSeancesMap.get(Number(film.id)) || [];

        const hallSeancesMap = new Map();
        seances.forEach((s) => {
            const hallId = Number(s.seance_hallid);
            if (!hallSeancesMap.has(hallId)) {
                hallSeancesMap.set(hallId, []);
            }
            hallSeancesMap.get(hallId).push(s);
        });

        const section = document.createElement('section');
        section.classList.add('movie');

        const posterDiv = document.createElement('div');
        posterDiv.classList.add('movie__poster');
        const posterImg = document.createElement('img');
        posterImg.src = '../img/The-Star-Wars.jpg';
        posterImg.alt = film.film_name;
        posterDiv.append(posterImg);
        section.append(posterDiv);

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('movie__info');

        const title = document.createElement('h2');
        title.classList.add('movie__title');
        title.textContent = film.film_name;
        infoDiv.append(title);

        if (film.film_description) {
            const desc = document.createElement('p');
            desc.classList.add('movie__description');
            desc.textContent = film.film_description;
            infoDiv.append(desc);
        }

        const dataP = document.createElement('p');
        dataP.classList.add('movie__data');

        const durationSpan = document.createElement('span');
        durationSpan.classList.add('movie__data-duration');
        durationSpan.textContent = `${film.film_duration} минут`;
        dataP.append(durationSpan);

        const originSpan = document.createElement('span');
        originSpan.classList.add('movie__data-origin');
        originSpan.textContent = film.film_origin || '';
        dataP.append(originSpan);

        infoDiv.append(dataP);
        section.append(infoDiv);

        halls.forEach((hall) => {
            const hallSeances = hallSeancesMap.get(Number(hall.id));
            if (!hallSeances || hallSeances.length === 0) return;
            hallSeances.sort((a, b) => a.seance_time.localeCompare(b.seance_time));

            const seancesDiv = document.createElement('div');
            seancesDiv.classList.add('movie__seances');

            const hallTitle = document.createElement('h3');
            hallTitle.classList.add('movie__seances-hall');
            const capitalizedName = hall.hall_name.charAt(0).toUpperCase() + hall.hall_name.slice(1);
            hallTitle.textContent = capitalizedName;
            seancesDiv.append(hallTitle);

            const seancesList = document.createElement('div');
            seancesList.classList.add('movie__seances-list');

            hallSeances.forEach((seance) => {
                const link = document.createElement('a');
                link.classList.add('movie__seance');
                link.href = `../hall/hall.html?seanceId=${seance.id}&date=${dateStr}`;

                if (isToday) {
                    const [hours, minutes] = seance.seance_time.split(':').map(Number);
                    const seanceDate = new Date(selectedDate);
                    seanceDate.setHours(hours, minutes, 0, 0);

                    if (seanceDate < now) {
                        link.classList.add('movie__seance--past');
                        link.addEventListener('click', (e) => e.preventDefault());
                    }
                }

                const timeSpan = document.createElement('span');
                timeSpan.classList.add('movie__seance-time');
                timeSpan.textContent = seance.seance_time;
                link.append(timeSpan);

                seancesList.append(link);
            });

            seancesDiv.append(seancesList);
            section.append(seancesDiv);
        });

        container.append(section);
    });
}

function renderNoData(message) {
    const container = document.getElementById('movies-container');
    container.innerHTML = `
    <div style="max-width:990px;margin:40px auto;padding:30px;background:rgba(255,255,255,0.9);border-radius:2px;text-align:center;font-size:16px;color:#333;">
      ${message}
    </div>
  `;
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

init();
