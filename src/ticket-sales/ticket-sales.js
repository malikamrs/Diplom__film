import ApiService from '../api/ApiService.js';

const api = new ApiService();

const FILM_COLORS = ['#CAFF85', '#85B2FF', '#FFB085', '#E185FF', '#85FFD3', '#FFFFA8'];

document.addEventListener('DOMContentLoaded', async () => {
    const headers = document.querySelectorAll('.conf-step__header');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('conf-step__header_opened');
        });
    });

    initHallConfigUI();

    let hallsData = [];
    let filmsData = [];
    let seancesData = [];

    try {
        const data = await api.getAllData();
        hallsData = data.halls || [];
        filmsData = data.films || [];
        seancesData = data.seances || [];

        renderHallLists(hallsData);
        renderFilms(filmsData);
        renderTimelines(hallsData, filmsData, seancesData);

        if (hallsData.length > 0) {
            const firstHall = hallsData[0];
            const rows = firstHall.hall_rows || firstHall.rowCount || 10;
            const places = firstHall.hall_places || firstHall.placeCount || 8;
            const rowsInput = document.getElementById('input-rows');
            const placesInput = document.getElementById('input-places');
            if (rowsInput) rowsInput.value = rows;
            if (placesInput) placesInput.value = places;
            renderHallGrid();
            updateSalesStatusUI(hallsData[0]);
        }
    } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
    }

    document.getElementById('create-hall-btn')?.addEventListener('click', () => {
        window.location.href = '../addhall/addhall.html';
    });

    document.getElementById('hall-selectors')?.addEventListener('change', (e) => {
        const hallId = parseInt(e.target.value);
        const selectedHall = hallsData.find(h => h.id === hallId);
        if (selectedHall) {
            const rows = selectedHall.hall_rows || 10;
            const places = selectedHall.hall_places || 8;
            const rowsInput = document.getElementById('input-rows');
            const placesInput = document.getElementById('input-places');
            if (rowsInput) rowsInput.value = rows;
            if (placesInput) placesInput.value = places;

            let config = null;
            if (selectedHall.hall_config) {
                try {
                    config = JSON.parse(selectedHall.hall_config);
                } catch (e) { }
            }
            renderHallGrid(config);
        }
    });

    document.getElementById('price-hall-selectors')?.addEventListener('change', (e) => {
        const hallId = parseInt(e.target.value);
        const selectedHall = hallsData.find(h => h.id === hallId);
        if (selectedHall) {
            const pStandart = document.getElementById('price-standard');
            const pVip = document.getElementById('price-vip');
            if (pStandart) pStandart.value = selectedHall.hall_price_standart || 0;
            if (pVip) pVip.value = selectedHall.hall_price_vip || 0;
        }
    });

    document.getElementById('hall-list')?.addEventListener('click', async (e) => {
        if (e.target.classList.contains('conf-step__button-trash')) {
            const hallId = e.target.dataset.id;
            if (confirm('Удалить этот зал?')) {
                try {
                    await api.deleteHall(hallId);
                    window.location.reload();
                } catch (err) {
                    alert('Ошибка при удалении: ' + err.message);
                }
            }
        }
    });

    document.getElementById('movies-list')?.addEventListener('click', async (e) => {
        const trashBtn = e.target.closest('.conf-step__button-trash');
        if (trashBtn) {
            const filmId = trashBtn.dataset.id;
            if (confirm('Удалить этот фильм?')) {
                try {
                    const result = await api.deleteFilm(filmId);
                    filmsData = result.films || filmsData;
                    seancesData = result.seances || seancesData;
                    renderFilms(filmsData);
                    renderTimelines(hallsData, filmsData, seancesData);
                } catch (err) {
                    alert('Ошибка при удалении фильма: ' + err.message);
                }
            }
        }
    });

    document.getElementById('add-film-btn')?.addEventListener('click', () => {
        window.location.href = '../addfilm/addfilm.html';
    });
    document.getElementById('hall-timelines')?.addEventListener('click', (e) => {
        const bar = e.target.closest('.conf-step__timeline-bar');
        if (bar) {
            const hallId = bar.dataset.hallid;
            window.location.href = `../addseance/addseance.html?hallId=${hallId}`;
        }
    });

    document.getElementById('save-hall-config')?.addEventListener('click', async () => {
        const hallRadio = document.querySelector('input[name="chairs-hall"]:checked');
        if (!hallRadio) return alert('Выберите зал');

        const hallId = hallRadio.value;
        const rows = parseInt(document.getElementById('input-rows').value);
        const places = parseInt(document.getElementById('input-places').value);

        const config = [];
        const rowsEls = document.querySelectorAll('#hall-config-wrapper .conf-step__row');
        rowsEls.forEach(rowEl => {
            const rowConfig = [];
            const chairEls = rowEl.querySelectorAll('.conf-step__chair');
            chairEls.forEach(chairEl => {
                if (chairEl.classList.contains('conf-step__chair_standart')) rowConfig.push('standart');
                else if (chairEl.classList.contains('conf-step__chair_vip')) rowConfig.push('vip');
                else rowConfig.push('disabled');
            });
            config.push(rowConfig);
        });

        try {
            const updatedHall = await api.updateHallConfig(hallId, rows, places, config);
            const index = hallsData.findIndex(h => h.id == hallId);
            if (index !== -1) hallsData[index] = updatedHall;

            alert('Конфигурация зала сохранена!');
        } catch (err) {
            alert('Ошибка сохранения: ' + err.message);
        }
    });

    document.getElementById('save-hall-prices')?.addEventListener('click', async () => {
        const hallRadio = document.querySelector('input[name="prices-hall"]:checked');
        if (!hallRadio) return alert('Выберите зал');

        const hallId = hallRadio.value;
        const priceStandart = parseInt(document.getElementById('price-standard').value);
        const priceVip = parseInt(document.getElementById('price-vip').value);

        try {
            const updatedHall = await api.updateHallPrice(hallId, priceStandart, priceVip);
            const index = hallsData.findIndex(h => h.id == hallId);
            if (index !== -1) hallsData[index] = updatedHall;

            alert('Цены успешно сохранены!');
        } catch (err) {
            alert('Ошибка сохранения цен: ' + err.message);
        }
    });

    const salesSelectors = document.getElementById('sales-hall-selectors');
    const salesBtn = document.querySelector('.conf-step__button-sales');

    salesSelectors?.addEventListener('change', (e) => {
        const hallId = parseInt(e.target.value);
        const selectedHall = hallsData.find(h => h.id === hallId);
        if (selectedHall) {
            updateSalesStatusUI(selectedHall);
        }
    });

    salesBtn?.addEventListener('click', async () => {
        const checkedRadio = salesSelectors.querySelector('input:checked');
        if (!checkedRadio) return;

        const hallId = parseInt(checkedRadio.value);
        const selectedHall = hallsData.find(h => h.id === hallId);
        if (!selectedHall) return;

        const newStatus = selectedHall.hall_open === 1 ? 0 : 1;

        salesBtn.disabled = true;
        salesBtn.textContent = 'Обработка...';

        try {
            const updatedHall = await api.toggleHallOpen(hallId, newStatus);
            const index = hallsData.findIndex(h => h.id === hallId);
            if (index !== -1) {
                hallsData[index] = updatedHall;
                updateSalesStatusUI(updatedHall);
            }
            window.location.href = '../index/index.html';
        } catch (err) {
            alert('Ошибка при изменении статуса продаж: ' + err.message);
            updateSalesStatusUI(selectedHall);
        } finally {
            salesBtn.disabled = false;
        }
    });

    document.body.addEventListener('dragover', (e) => e.preventDefault());
    document.body.addEventListener('drop', async (e) => {
        if (e.target.closest('.conf-step__timeline-bar')) return;

        if (draggedSeanceId) {
            const idToRemove = draggedSeanceId;
            draggedSeanceId = null;

            if (confirm('Удалить этот сеанс?')) {
                try {
                    await api.deleteSeance(idToRemove);
                    window.location.reload();
                } catch (err) {
                    alert('Ошибка удаления: ' + err.message);
                }
            }
        }
    });

    initDragAndDrop();
});

let draggedFilmId = null;
let draggedFilmName = null;
let draggedSeanceId = null;

function initDragAndDrop() {
    const movies = document.querySelectorAll('.conf-step__movie');
    movies.forEach(movie => {
        movie.addEventListener('dragstart', (e) => {
            draggedFilmId = movie.dataset.id;
            draggedFilmName = movie.dataset.name;
            draggedSeanceId = null;
            movie.classList.add('dragging');
            e.dataTransfer.setData('type', 'film');
        });

        movie.addEventListener('dragend', () => {
            movie.classList.remove('dragging');
        });
    });

    const seances = document.querySelectorAll('.conf-step__seance');
    seances.forEach(seance => {
        seance.addEventListener('dragstart', (e) => {
            draggedSeanceId = seance.dataset.id;
            draggedFilmId = null;
            seance.classList.add('dragging');
            e.dataTransfer.setData('type', 'seance');
        });

        seance.addEventListener('dragend', () => {
            seance.classList.remove('dragging');
        });
    });

    const timelines = document.querySelectorAll('.conf-step__timeline-bar');
    timelines.forEach(bar => {
        bar.addEventListener('dragover', (e) => {
            e.preventDefault();
            bar.classList.add('drag-over');
        });

        bar.addEventListener('dragleave', () => {
            bar.classList.remove('drag-over');
        });

        bar.addEventListener('drop', (e) => {
            e.preventDefault();
            bar.classList.remove('drag-over');

            const type = e.dataTransfer.getData('type');
            if (type === 'film' && draggedFilmId) {
                openAddSeanceModal(bar.dataset.hallid, bar.dataset.hallname, draggedFilmId, draggedFilmName);
            }
        });
    });

}

function openAddSeanceModal(hallId, hallName, filmId, filmName) {
    const modal = document.getElementById('add-seance-modal');
    if (!modal) return;

    document.getElementById('modal-hall-name').value = hallName;
    document.getElementById('modal-hall-id').value = hallId;
    document.getElementById('modal-film-name').value = filmName;
    document.getElementById('modal-film-id').value = filmId;
    document.getElementById('modal-seance-time').value = '10:00';

    modal.style.display = 'flex';

    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    const form = document.getElementById('modal-seance-form');

    const closeModal = () => modal.style.display = 'none';

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const time = document.getElementById('modal-seance-time').value;

        try {
            const api = new ApiService();
            await api.addSeance(hallId, filmId, time);
            alert('Сеанс успешно добавлен!');
            window.location.reload();
        } catch (err) {
            if (err.message.includes('невозможно')) {
                alert('Ошибка: сеансы пересекаются. Пожалуйста, добавьте 1-2 минуты перерыва.');
            } else {
                alert('Ошибка добавления: ' + err.message);
            }
        }
    };
}

function updateSalesStatusUI(hall) {
    const salesBtn = document.querySelector('.conf-step__button-sales');
    const statusText = document.querySelector('.conf-step__sales-ready');

    if (!hall || !salesBtn || !statusText) return;

    if (hall.hall_open === 1) {
        statusText.textContent = 'Продажа билетов открыта';
        salesBtn.textContent = 'ПРИОСТАНОВИТЬ ПРОДАЖУ БИЛЕТОВ';
    } else {
        statusText.textContent = 'Всё готово к открытию';
        salesBtn.textContent = 'ОТКРЫТЬ ПРОДАЖУ БИЛЕТОВ';
    }
}

function renderFilms(films) {
    const container = document.getElementById('movies-list');
    if (!container) return;

    container.innerHTML = films.map((film, i) => `
        <div class="conf-step__movie" draggable="true" data-id="${film.id}" data-name="${film.film_name}" style="background-color: ${FILM_COLORS[i % FILM_COLORS.length]}">
            <img src="../img/The-Star-Wars.jpg" alt="${film.film_name}" class="conf-step__movie-poster">
            <div class="conf-step__movie-info">
                <span class="conf-step__movie-title">${film.film_name}</span>
                <span class="conf-step__movie-duration">${film.film_duration} минут</span>
            </div>
            <button class="conf-step__button-trash" data-id="${film.id}"></button>
        </div>
    `).join('');
    initDragAndDrop();
}

function renderTimelines(halls, films, seances) {
    const container = document.getElementById('hall-timelines');
    if (!container) return;

    if (halls.length === 0) {
        container.innerHTML = '<p class="conf-step__paragraph">Нет залов для отображения</p>';
        return;
    }

    const totalMinutes = 1440;

    container.innerHTML = halls.map(hall => {
        const hallSeances = seances.filter(s => s.seance_hallid === hall.id);

        const seanceBlocks = hallSeances.map(s => {
            const film = films.find(f => f.id === s.seance_filmid);
            if (!film) return '';

            const startMin = timeToMinutes(s.seance_time);
            const leftPercent = (startMin / totalMinutes * 100).toFixed(2);
            const widthPercent = (film.film_duration / totalMinutes * 100).toFixed(2);
            const colorIndex = films.indexOf(film) % FILM_COLORS.length;

            return `<div class="conf-step__seance" draggable="true" data-id="${s.id}" style="left: ${leftPercent}%; width: ${widthPercent}%; background-color: ${FILM_COLORS[colorIndex]}">
                <span class="conf-step__seance-title">${film.film_name}</span>
            </div>`;
        }).join('');

        const renderedMinutes = [];
        const timeLabels = hallSeances.map(s => {
            const film = films.find(f => f.id === s.seance_filmid);
            if (!film) return '';

            const startMin = timeToMinutes(s.seance_time);
            const endMin = startMin + film.film_duration;

            let html = '';

            const isFarEnough = (min) => !renderedMinutes.some(rm => Math.abs(rm - min) < 60);

            if (isFarEnough(startMin)) {
                renderedMinutes.push(startMin);
                const leftStart = (startMin / totalMinutes * 100).toFixed(2);
                html += `<span class="conf-step__time-label" style="left: ${leftStart}%">${s.seance_time}</span>`;
            }

            const endTime = minutesToTime(endMin);
            if (isFarEnough(endMin)) {
                renderedMinutes.push(endMin);
                const leftEnd = (endMin / totalMinutes * 100).toFixed(2);
                html += `<span class="conf-step__time-label" style="left: ${leftEnd}%">${endTime}</span>`;
            }
            return html;
        }).join('');

        return `
            <div class="conf-step__timeline">
                <h3 class="conf-step__timeline-title">${hall.hall_name}</h3>
                <div class="conf-step__timeline-bar" data-hallid="${hall.id}" data-hallname="${hall.hall_name}" style="cursor: pointer;">
                    ${seanceBlocks}
                </div>
                <div class="conf-step__timeline-labels">
                    ${timeLabels}
                </div>
            </div>
        `;
    }).join('');
    initDragAndDrop();
}

function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(totalMin) {
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function initHallConfigUI() {
    const rowsInput = document.getElementById('input-rows');
    const placesInput = document.getElementById('input-places');

    if (!rowsInput || !placesInput) return;

    rowsInput.addEventListener('input', renderHallGrid);
    placesInput.addEventListener('input', renderHallGrid);

    renderHallGrid();
}

function renderHallGrid(config = null) {
    const wrapper = document.getElementById('hall-config-wrapper');
    if (!wrapper) return;

    const rowsInput = document.getElementById('input-rows');
    const placesInput = document.getElementById('input-places');

    const rows = parseInt(rowsInput?.value) || 10;
    const places = parseInt(placesInput?.value) || 8;

    wrapper.innerHTML = '';

    for (let r = 0; r < rows; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'conf-step__row';

        for (let p = 0; p < places; p++) {
            const chair = document.createElement('span');

            let type = 'standart';
            if (config && config[r] && config[r][p]) {
                type = config[r][p];
            }

            chair.className = `conf-step__chair conf-step__chair_${type}`;

            chair.addEventListener('click', () => {
                if (chair.classList.contains('conf-step__chair_standart')) {
                    chair.classList.replace('conf-step__chair_standart', 'conf-step__chair_vip');
                } else if (chair.classList.contains('conf-step__chair_vip')) {
                    chair.classList.replace('conf-step__chair_vip', 'conf-step__chair_disabled');
                } else {
                    chair.classList.replace('conf-step__chair_disabled', 'conf-step__chair_standart');
                }
            });

            rowDiv.appendChild(chair);
        }
        wrapper.appendChild(rowDiv);
    }
}

function renderHallLists(halls) {
    const hallListUl = document.getElementById('hall-list');
    const hallSelectorsUl = document.getElementById('hall-selectors');
    const priceSelectorsUl = document.getElementById('price-hall-selectors');
    const salesSelectorsUl = document.getElementById('sales-hall-selectors');

    if (hallListUl) {
        hallListUl.innerHTML = halls.map(h => `
            <li>— ${h.hall_name} <button class="conf-step__button-trash" data-id="${h.id}"></button></li>
        `).join('');
    }

    const renderSelectors = (ul, name) => {
        if (!ul) return;
        ul.innerHTML = halls.map((h, index) => `
            <li>
                <label>
                    <input type="radio" class="conf-step__radio" name="${name}" value="${h.id}" ${index === 0 ? 'checked' : ''}>
                    <span class="conf-step__selector">${h.hall_name}</span>
                </label>
            </li>
        `).join('');
    };

    renderSelectors(hallSelectorsUl, 'chairs-hall');
    renderSelectors(priceSelectorsUl, 'prices-hall');
    renderSelectors(salesSelectorsUl, 'sales-hall');

    if (halls.length > 0) {
        const pStandart = document.getElementById('price-standard');
        const pVip = document.getElementById('price-vip');
        if (pStandart) pStandart.value = halls[0].hall_price_standart || 0;
        if (pVip) pVip.value = halls[0].hall_price_vip || 0;

        let config = null;
        if (halls[0].hall_config) {
            try { config = JSON.parse(halls[0].hall_config); } catch (e) { }
        }
        renderHallGrid(config);
    }
}

