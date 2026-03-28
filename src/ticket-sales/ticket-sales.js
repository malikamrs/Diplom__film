import ApiService from '../api/ApiService.js';

const api = new ApiService();
const FILM_COLORS = ['#CAFF85', '#85B2FF', '#FFB085', '#E185FF', '#85FFD3', '#FFFFA8'];

let seancesToAdd = [];
let seancesToDelete = [];
let hallsData = [];
let filmsData = [];
let seancesData = [];

let draggedFilmId = null;
let draggedFilmName = null;
let draggedSeanceId = null;

/**
 * @param {string} text Текст сообщения
 * @param {string} title Заголовок
 * @param {string} okLabel Текст кнопки ОК
 * @param {boolean} showCancel Показывать ли кнопку отмены
 */
function showConfirm(text, title = 'Подтверждение', okLabel = 'УДАЛИТЬ', showCancel = true) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-modal-title');
        const textEl = document.getElementById('confirm-modal-text');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');
        const closeBtn = document.getElementById('confirm-close');

        titleEl.textContent = title;
        textEl.textContent = text;
        okBtn.textContent = okLabel;
        cancelBtn.style.display = showCancel ? 'inline-block' : 'none';

        modal.style.display = 'flex';

        const cleanup = (result) => {
            modal.style.display = 'none';
            okBtn.onclick = null;
            cancelBtn.onclick = null;
            closeBtn.onclick = null;
            resolve(result);
        };

        okBtn.onclick = () => cleanup(true);
        cancelBtn.onclick = () => cleanup(false);
        closeBtn.onclick = () => cleanup(false);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const headers = document.querySelectorAll('.conf-step__header');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('conf-step__header_opened');
        });
    });

    try {
        const data = await api.getAllData();
        hallsData = data.halls || [];
        filmsData = data.films || [];
        seancesData = data.seances || [];

        renderHallLists();
        renderFilms();
        renderTimelines();

        if (hallsData.length > 0) {
            setupInitialHallConfig();
        }
    } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
    }

    document.getElementById('create-hall-btn')?.addEventListener('click', () => {
        window.location.href = '../addhall/addhall.html';
    });
    document.getElementById('add-film-btn')?.addEventListener('click', () => {
        window.location.href = '../addfilm/addfilm.html';
    });

    document.getElementById('hall-selectors')?.addEventListener('change', (e) => {
        const hallId = parseInt(e.target.value);
        const selectedHall = hallsData.find(h => h.id === hallId);
        if (selectedHall) {
            const r = selectedHall.hall_rows || 10;
            const p = selectedHall.hall_places || 8;
            document.getElementById('input-rows').value = r;
            document.getElementById('input-places').value = p;
            let config = null;
            if (selectedHall.hall_config) {
                try { config = JSON.parse(selectedHall.hall_config); } catch (e) { }
            }
            renderHallGrid(config, r, p);
        }
    });

    document.getElementById('price-hall-selectors')?.addEventListener('change', (e) => {
        const hallId = parseInt(e.target.value);
        const selectedHall = hallsData.find(h => h.id === hallId);
        if (selectedHall) {
            document.getElementById('price-standard').value = selectedHall.hall_price_standart || 0;
            document.getElementById('price-vip').value = selectedHall.hall_price_vip || 0;
        }
    });

    document.getElementById('hall-list')?.addEventListener('click', async (e) => {
        if (e.target.classList.contains('conf-step__button-trash')) {
            const hallId = e.target.dataset.id;
            const confirmed = await showConfirm('Удалить этот зал?');
            if (confirmed) {
                try {
                    await api.deleteHall(hallId);
                    window.location.reload();
                } catch (err) {
                    showConfirm('Ошибка при удалении: ' + err.message, 'Ошибка', 'ОК', false);
                }
            }
        }
    });

    document.getElementById('movies-list')?.addEventListener('click', async (e) => {
        const trashBtn = e.target.closest('.conf-step__button-trash');
        if (trashBtn) {
            const filmId = trashBtn.dataset.id;
            const confirmed = await showConfirm('Вы действительно хотите удалить этот фильм?', 'Удаление фильма');
            if (confirmed) {
                try {
                    await api.deleteFilm(filmId);
                    window.location.reload();
                } catch (err) {
                    showConfirm('Ошибка при удалении фильма: ' + err.message, 'Ошибка', 'ОК', false);
                }
            }
        }
    });

    document.getElementById('save-hall-config')?.addEventListener('click', async () => {
        const hallId = document.querySelector('input[name="chairs-hall"]:checked')?.value;
        if (!hallId) return showConfirm('Выберите зал', 'Внимание', 'ОК', false);

        const rows = parseInt(document.getElementById('input-rows').value);
        const places = parseInt(document.getElementById('input-places').value);
        const config = [];
        document.querySelectorAll('#hall-config-wrapper .conf-step__row').forEach(rowEl => {
            const rowConfig = [];
            rowEl.querySelectorAll('.conf-step__chair').forEach(chairEl => {
                if (chairEl.classList.contains('conf-step__chair_standart')) rowConfig.push('standart');
                else if (chairEl.classList.contains('conf-step__chair_vip')) rowConfig.push('vip');
                else rowConfig.push('disabled');
            });
            config.push(rowConfig);
        });

        try {
            await api.updateHallConfig(hallId, rows, places, config);
            showConfirm('Конфигурация зала успешно сохранена!', 'Успех', 'ОК', false);
            const data = await api.getAllData();
            hallsData = data.halls;
        } catch (err) {
            showConfirm('Ошибка сохранения: ' + err.message, 'Ошибка', 'ОК', false);
        }
    });

    document.getElementById('cancel-hall-config')?.addEventListener('click', () => {
        const selectEvent = new Event('change', { bubbles: true });
        document.getElementById('hall-selectors')?.dispatchEvent(selectEvent);
    });

    document.getElementById('save-hall-prices')?.addEventListener('click', async () => {
        const hallId = document.querySelector('input[name="prices-hall"]:checked')?.value;
        if (!hallId) return showConfirm('Выберите зал', 'Внимание', 'ОК', false);

        const prStandard = parseInt(document.getElementById('price-standard').value);
        const prVip = parseInt(document.getElementById('price-vip').value);

        try {
            await api.updateHallPrice(hallId, prStandard, prVip);
            showConfirm('Цены успешно сохранены!', 'Успех', 'ОК', false);
            const data = await api.getAllData();
            hallsData = data.halls;
        } catch (err) {
            showConfirm('Ошибка сохранения цен: ' + err.message, 'Ошибка', 'ОК', false);
        }
    });

    document.getElementById('cancel-hall-prices')?.addEventListener('click', () => {
        const selectEvent = new Event('change', { bubbles: true });
        document.getElementById('price-hall-selectors')?.dispatchEvent(selectEvent);
    });

    document.getElementById('save-seances')?.addEventListener('click', async () => {
        if (seancesToAdd.length === 0 && seancesToDelete.length === 0) {
            return showConfirm('Нет изменений для сохранения', 'Внимание', 'ОК', false);
        }

        const btn = document.getElementById('save-seances');
        btn.disabled = true;

        try {
            for (const id of seancesToDelete) await api.deleteSeance(id);
            for (const s of seancesToAdd) await api.addSeance(s.hallId, s.filmId, s.time);

            await showConfirm('Сетка сеансов успешно сохранена!', 'Успех', 'ОК', false);
            window.location.reload();
        } catch (err) {
            showConfirm('Ошибка при сохранении сеансов: ' + err.message, 'Ошибка', 'ОК', false);
            btn.disabled = false;
        }
    });

    document.getElementById('cancel-seances')?.addEventListener('click', () => {
        seancesToAdd = [];
        seancesToDelete = [];
        renderTimelines();
    });

    const salesSelectors = document.getElementById('sales-hall-selectors');
    const salesBtn = document.querySelector('.conf-step__button-sales');

    salesSelectors?.addEventListener('change', (e) => {
        const hall = hallsData.find(h => h.id == e.target.value);
        if (hall) updateSalesStatusUI(hall);
    });

    salesBtn?.addEventListener('click', async () => {
        const hallId = salesSelectors.querySelector('input:checked')?.value;
        const hall = hallsData.find(h => h.id == hallId);
        if (!hall) return;

        const newStatus = hall.hall_open === 1 ? 0 : 1;

        salesBtn.disabled = true;
        salesBtn.textContent = 'Сохранение...';

        try {
            const updatedHall = await api.toggleHallOpen(hallId, newStatus);
            const index = hallsData.findIndex(h => h.id == hallId);
            if (index !== -1) {
                hallsData[index] = updatedHall;
                updateSalesStatusUI(updatedHall);
            }

            showConfirm(newStatus === 1 ? 'Продажи открыты!' : 'Продажи приостановлены!', 'Статус продаж', 'ОК', false);
        } catch (err) {
            showConfirm('Ошибка: ' + err.message, 'Ошибка', 'ОК', false);
        } finally {
            salesBtn.disabled = false;
        }
    });

    document.getElementById('input-rows')?.addEventListener('input', () => renderHallGrid());
    document.getElementById('input-places')?.addEventListener('input', () => renderHallGrid());

    document.body.addEventListener('dragover', (e) => e.preventDefault());
    document.body.addEventListener('drop', async (e) => {
        if (e.target.closest('.conf-step__timeline-bar')) return;
        if (draggedSeanceId) {
            const confirmed = await showConfirm('Удалить этот сеанс из черновика?', 'Удаление сеанса');
            if (confirmed) {
                if (String(draggedSeanceId).startsWith('temp_')) {
                    seancesToAdd = seancesToAdd.filter(s => s.tempId !== draggedSeanceId);
                } else {
                    seancesToDelete.push(parseInt(draggedSeanceId));
                }
                draggedSeanceId = null;
                renderTimelines();
            }
        }
    });

    initDragAndDrop();
});

function renderHallLists() {
    const list = document.getElementById('hall-list');
    if (list) {
        list.innerHTML = hallsData.map(h => {
            const capitalizedName = h.hall_name.charAt(0).toUpperCase() + h.hall_name.slice(1);
            return `<li>— ${capitalizedName} <button class="conf-step__button-trash" data-id="${h.id}"></button></li>`;
        }).join('');
    }

    const render = (containerId, name) => {
        const el = document.getElementById(containerId);
        if (el) {
            el.innerHTML = hallsData.map((h, i) => {
                const capitalizedName = h.hall_name.charAt(0).toUpperCase() + h.hall_name.slice(1);
                return `<li><label><input type="radio" class="conf-step__radio" name="${name}" value="${h.id}" ${i === 0 ? 'checked' : ''}>
                <span class="conf-step__selector">${capitalizedName}</span></label></li>`;
            }).join('');
        }
    };
    render('hall-selectors', 'chairs-hall');
    render('price-hall-selectors', 'prices-hall');
    render('sales-hall-selectors', 'sales-hall');
}

function setupInitialHallConfig() {
    const first = hallsData[0];
    if (!first) return;

    const r = first.hall_rows || 10;
    const p = first.hall_places || 8;

    document.getElementById('input-rows').value = r;
    document.getElementById('input-places').value = p;
    document.getElementById('price-standard').value = first.hall_price_standart || 0;
    document.getElementById('price-vip').value = first.hall_price_vip || 0;

    updateSalesStatusUI(first);

    setTimeout(() => {
        let config = null;
        if (first.hall_config) {
            try { config = JSON.parse(first.hall_config); } catch (e) { }
        }
        renderHallGrid(config, r, p);
    }, 0);
}

function renderHallGrid(config = null, rowsOverride = null, placesOverride = null) {
    const wrapper = document.getElementById('hall-config-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = '';

    const rows = rowsOverride !== null ? rowsOverride : (parseInt(document.getElementById('input-rows').value) || 1);
    const places = placesOverride !== null ? placesOverride : (parseInt(document.getElementById('input-places').value) || 1);

    console.log(`Отрисовка сетки: рядов=${rows}, мест=${places}`);
    for (let r = 0; r < rows; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'conf-step__row';
        for (let p = 0; p < places; p++) {
            const chair = document.createElement('span');
            let type = (config && config[r] && config[r][p]) ? config[r][p] : 'standart';
            chair.className = `conf-step__chair conf-step__chair_${type}`;
            chair.addEventListener('click', () => {
                const nextType = { 'standart': 'vip', 'vip': 'disabled', 'disabled': 'standart' };
                chair.className = `conf-step__chair conf-step__chair_${nextType[type]}`;
                type = nextType[type];
            });
            rowDiv.append(chair);
        }
        wrapper.append(rowDiv);
    }
}

function renderFilms() {
    const list = document.getElementById('movies-list');
    if (!list) return;
    list.innerHTML = filmsData.map((f, i) => `
        <div class="conf-step__movie" draggable="true" data-id="${f.id}" data-name="${f.film_name}" 
             style="background-color: ${FILM_COLORS[i % FILM_COLORS.length]}">
            <img src="../img/The-Star-Wars.jpg" alt="${f.film_name}" class="conf-step__movie-poster">
            <div class="conf-step__movie-info">
                <span class="conf-step__movie-title">${f.film_name}</span>
                <span class="conf-step__movie-duration">${f.film_duration} мин.</span>
            </div>
            <button class="conf-step__button-trash" data-id="${f.id}"></button>
        </div>
    `).join('');
    initDragAndDrop();
}

function renderTimelines() {
    const container = document.getElementById('hall-timelines');
    if (!container) return;

    const allSeances = [
        ...seancesData.filter(s => !seancesToDelete.includes(s.id)),
        ...seancesToAdd.map(s => ({
            id: s.tempId,
            seance_hallid: parseInt(s.hallId),
            seance_filmid: parseInt(s.filmId),
            seance_time: s.time
        }))
    ];

    container.innerHTML = hallsData.map(hall => {
        const hSeances = allSeances.filter(s => s.seance_hallid == hall.id);
        const seanceBlocks = hSeances.map(s => {
            const film = filmsData.find(f => f.id == s.seance_filmid);
            if (!film) return '';
            const left = (timeToMin(s.seance_time) / 1440 * 100).toFixed(2);
            const width = (film.film_duration / 1440 * 100).toFixed(2);
            const color = FILM_COLORS[filmsData.indexOf(film) % FILM_COLORS.length];
            const isTemp = String(s.id).startsWith('temp_');

            return `<div class="conf-step__seance" draggable="true" data-id="${s.id}" 
                         style="left:${left}%; width:${width}%; background-color:${color}; overflow:hidden; ${isTemp ? 'outline:2px dashed #000' : ''}">
                        <span class="conf-step__seance-title">${film.film_name}</span>
                    </div>`;
        }).join('');

        const timeSet = new Set();
        hSeances.forEach(s => {
            const film = filmsData.find(f => f.id == s.seance_filmid);
            if (film) timeSet.add(s.seance_time);
        });
        const sortedTimes = [...timeSet].sort();
        const timeLabels = sortedTimes.map(t => {
            const leftPos = (timeToMin(t) / 1440 * 100).toFixed(2);
            return `<span class="conf-step__time-label" style="left:${leftPos}%">${t}</span>`;
        }).join('');

        const capitalizedName = hall.hall_name.charAt(0).toUpperCase() + hall.hall_name.slice(1);
        return `
            <div class="conf-step__timeline">
                <h3 class="conf-step__timeline-title">${capitalizedName}</h3>
                <div class="conf-step__timeline-bar" data-hallid="${hall.id}" data-hallname="${hall.hall_name}">
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

function initDragAndDrop() {
    document.querySelectorAll('.conf-step__movie').forEach(m => {
        m.ondragstart = (e) => {
            draggedFilmId = m.dataset.id;
            draggedFilmName = m.dataset.name;
            draggedSeanceId = null;
            e.dataTransfer.setData('type', 'film');
        };
    });

    document.querySelectorAll('.conf-step__seance').forEach(s => {
        s.ondragstart = (e) => {
            draggedSeanceId = s.dataset.id;
            draggedFilmId = null;
            e.dataTransfer.setData('type', 'seance');
        };
    });

    document.querySelectorAll('.conf-step__timeline-bar').forEach(bar => {
        bar.ondragover = (e) => e.preventDefault();
        bar.ondrop = (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('type');
            if (type === 'film' && draggedFilmId) {
                openAddSeanceModal(bar.dataset.hallid, bar.dataset.hallname, draggedFilmId, draggedFilmName);
            }
        };
    });
}

function openAddSeanceModal(hallId, hallName, filmId, filmName) {
    const modal = document.getElementById('add-seance-modal');
    document.getElementById('modal-hall-name').value = hallName;
    document.getElementById('modal-hall-id').value = hallId;
    document.getElementById('modal-film-name').value = filmName;
    document.getElementById('modal-film-id').value = filmId;
    document.getElementById('modal-seance-time').value = '10:00';
    modal.style.display = 'flex';

    document.getElementById('modal-close').onclick = () => modal.style.display = 'none';
    document.getElementById('modal-cancel').onclick = () => modal.style.display = 'none';
    document.getElementById('modal-seance-form').onsubmit = (e) => {
        e.preventDefault();
        seancesToAdd.push({
            tempId: 'temp_' + Date.now(),
            hallId, filmId,
            time: document.getElementById('modal-seance-time').value
        });
        modal.style.display = 'none';
        renderTimelines();
    };
}

function updateSalesStatusUI(hall) {
    const btn = document.querySelector('.conf-step__button-sales');
    const text = document.querySelector('.conf-step__sales-ready');
    if (!btn || !text) return;
    text.textContent = hall.hall_open === 1 ? 'Продажа билетов открыта' : 'Всё готово к открытию';
    btn.textContent = hall.hall_open === 1 ? 'ПРИОСТАНОВИТЬ ПРОДАЖУ БИЛЕТОВ' : 'ОТКРЫТЬ ПРОДАЖУ БИЛЕТОВ';
}

function timeToMin(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}
