/**
 * ApiService — класс для взаимодействия с API кинотеатра.
 * Базовый URL: https://shfe-diplom.neto-server.ru/
 *
 * Все методы возвращают Promise.
 * При успешном ответе (success: true) возвращается объект result.
 * При ошибке (success: false) выбрасывается Error с сообщением от сервера.
 */

const BASE_URL = 'https://shfe-diplom.neto-server.ru';

export default class ApiService {
    /**
     * @param {string} [baseUrl] — базовый URL API (по умолчанию BASE_URL)
     */
    constructor(baseUrl = BASE_URL) {
        this.baseUrl = baseUrl;
    }

    // ─────────────────────────────────────────────────────────
    //  ВНУТРЕННИЕ МЕТОДЫ
    // ─────────────────────────────────────────────────────────

    /**
     * Обёртка над fetch с обработкой стандартной структуры ответа { success, result | error }.
     *
     * @param {string}  endpoint — путь (например '/alldata')
     * @param {object}  [options] — параметры fetch (method, body и т.д.)
     * @returns {Promise<*>} — содержимое поля result
     */
    async _request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`Ошибка сети: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Неизвестная ошибка сервера');
            }

            return data.result;
        } catch (err) {
            console.error(`[ApiService] Ошибка при запросе ${endpoint}:`, err);
            throw err;
        }
    }

    /**
     * Создаёт FormData из объекта ключ-значение.
     *
     * @param {Object<string, string|number|File>} fields
     * @returns {FormData}
     */
    _buildFormData(fields) {
        const fd = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
            fd.set(key, value);
        });
        return fd;
    }

    // ─────────────────────────────────────────────────────────
    //  1. ПОЛУЧЕНИЕ ОБЩИХ ДАННЫХ
    // ─────────────────────────────────────────────────────────

    /**
     * GET /alldata
     * Возвращает все залы, фильмы и сеансы.
     *
     * @returns {Promise<{ halls: Array, films: Array, seances: Array }>}
     */
    async getAllData() {
        return this._request('/alldata');
    }

    // ─────────────────────────────────────────────────────────
    //  2. АВТОРИЗАЦИЯ (АДМИН)
    // ─────────────────────────────────────────────────────────

    /**
     * POST /login
     * Авторизация администратора.
     *
     * @param {string} login — логин (по умолчанию 'shfe-diplom@netology.ru')
     * @param {string} password — пароль (по умолчанию 'shfe-diplom')
     * @returns {Promise<string>} — сообщение об успешной авторизации
     */
    async login(login = 'shfe-diplom@netology.ru', password = 'shfe-diplom') {
        return this._request('/login', {
            method: 'POST',
            body: this._buildFormData({ login, password }),
        });
    }

    // ─────────────────────────────────────────────────────────
    //  3. ЗАЛЫ (HALLS)
    // ─────────────────────────────────────────────────────────

    /**
     * POST /hall
     * Добавляет новый кинозал.
     *
     * @param {string} hallName — название зала
     * @returns {Promise<{ halls: Array }>}
     */
    async addHall(hallName) {
        return this._request('/hall', {
            method: 'POST',
            body: this._buildFormData({ hallName }),
        });
    }

    /**
     * DELETE /hall/{hallId}
     * Удаляет кинозал (и все связанные сеансы).
     *
     * @param {number|string} hallId
     * @returns {Promise<{ halls: Array, seances: Array }>}
     */
    async deleteHall(hallId) {
        return this._request(`/hall/${hallId}`, {
            method: 'DELETE',
        });
    }

    /**
     * POST /hall/{hallId}
     * Изменяет конфигурацию посадочных мест в зале.
     *
     * @param {number|string} hallId
     * @param {number}        rowCount   — кол-во рядов
     * @param {number}        placeCount — кол-во мест в ряду
     * @param {Array<Array<string>>} config — двумерный массив мест
     *        ('standart' | 'vip' | 'disabled')
     * @returns {Promise<Object>} — обновлённый объект зала
     */
    async updateHallConfig(hallId, rowCount, placeCount, config) {
        return this._request(`/hall/${hallId}`, {
            method: 'POST',
            body: this._buildFormData({
                rowCount: String(rowCount),
                placeCount: String(placeCount),
                config: JSON.stringify(config),
            }),
        });
    }

    /**
     * POST /price/{hallId}
     * Изменяет стоимость билетов в зале.
     *
     * @param {number|string} hallId
     * @param {number}        priceStandart — цена обычного билета
     * @param {number}        priceVip      — цена VIP билета
     * @returns {Promise<Object>} — обновлённый объект зала
     */
    async updateHallPrice(hallId, priceStandart, priceVip) {
        return this._request(`/price/${hallId}`, {
            method: 'POST',
            body: this._buildFormData({
                priceStandart: String(priceStandart),
                priceVip: String(priceVip),
            }),
        });
    }

    /**
     * POST /open/{hallId}
     * Открывает или закрывает продажу билетов в зале.
     *
     * @param {number|string} hallId
     * @param {0|1}           hallOpen — 0 = закрыт, 1 = открыт
     * @returns {Promise<Object>} — обновлённый объект зала
     */
    async toggleHallOpen(hallId, hallOpen) {
        return this._request(`/open/${hallId}`, {
            method: 'POST',
            body: this._buildFormData({ hallOpen: String(hallOpen) }),
        });
    }

    // ─────────────────────────────────────────────────────────
    //  4. ФИЛЬМЫ (FILMS)
    // ─────────────────────────────────────────────────────────

    /**
     * POST /film
     * Добавляет новый фильм.
     *
     * @param {Object}  filmData
     * @param {string}  filmData.filmName        — название
     * @param {number}  filmData.filmDuration    — длительность (мин)
     * @param {string}  filmData.filmDescription — описание
     * @param {string}  filmData.filmOrigin      — страна
     * @param {File}    filmData.filePoster      — файл постера (png, до 3 MB)
     * @returns {Promise<{ films: Array }>}
     */
    async addFilm({ filmName, filmDuration, filmDescription, filmOrigin, filePoster }) {
        const fd = new FormData();
        fd.set('filmName', filmName);
        fd.set('filmDuration', String(filmDuration));
        fd.set('filmDescription', filmDescription);
        fd.set('filmOrigin', filmOrigin);
        if (filePoster) {
            fd.set('filePoster', filePoster);
        }
        return this._request('/film', {
            method: 'POST',
            body: fd,
        });
    }

    /**
     * DELETE /film/{filmId}
     * Удаляет фильм (и все связанные сеансы).
     *
     * @param {number|string} filmId
     * @returns {Promise<{ films: Array, seances: Array }>}
     */
    async deleteFilm(filmId) {
        return this._request(`/film/${filmId}`, {
            method: 'DELETE',
        });
    }

    // ─────────────────────────────────────────────────────────
    //  5. СЕАНСЫ (SEANCES)
    // ─────────────────────────────────────────────────────────

    /**
     * POST /seance
     * Добавляет новый сеанс.
     *
     * @param {number|string} seanceHallid — ID зала
     * @param {number|string} seanceFilmid — ID фильма
     * @param {string}        seanceTime   — время ('HH:MM')
     * @returns {Promise<{ seances: Array }>}
     */
    async addSeance(seanceHallid, seanceFilmid, seanceTime) {
        return this._request('/seance', {
            method: 'POST',
            body: this._buildFormData({
                seanceHallid: String(seanceHallid),
                seanceFilmid: String(seanceFilmid),
                seanceTime,
            }),
        });
    }

    /**
     * DELETE /seance/{seanceId}
     * Удаляет сеанс.
     *
     * @param {number|string} seanceId
     * @returns {Promise<{ seances: Array }>}
     */
    async deleteSeance(seanceId) {
        return this._request(`/seance/${seanceId}`, {
            method: 'DELETE',
        });
    }

    // ─────────────────────────────────────────────────────────
    //  6. КОНФИГУРАЦИЯ ЗАЛА ДЛЯ КОНКРЕТНОГО СЕАНСА + ДАТА
    // ─────────────────────────────────────────────────────────

    /**
     * GET /hallconfig?seanceId=...&date=...
     * Возвращает актуальную схему зала для конкретного сеанса
     * с учётом уже купленных билетов (места со статусом 'taken').
     *
     * @param {number|string} seanceId
     * @param {string}        date — формат 'YYYY-MM-DD'
     * @returns {Promise<Array<Array<string>>>} — двумерный массив мест
     */
    async getHallConfig(seanceId, date) {
        return this._request(`/hallconfig?seanceId=${seanceId}&date=${date}`);
    }

    // ─────────────────────────────────────────────────────────
    //  7. ПОКУПКА БИЛЕТОВ
    // ─────────────────────────────────────────────────────────

    /**
     * POST /ticket
     * Покупает (бронирует) билеты.
     *
     * @param {number|string} seanceId
     * @param {string}        ticketDate — формат 'YYYY-MM-DD'
     * @param {Array<{row: number, place: number, coast: number}>} tickets
     *        Массив объектов с информацией о каждом билете
     * @returns {Promise<{ tickets: Array }>}
     */
    async buyTickets(seanceId, ticketDate, tickets) {
        const fd = new FormData();
        fd.set('seanceId', String(seanceId));
        fd.set('ticketDate', ticketDate);
        fd.set('tickets', JSON.stringify(tickets));
        return this._request('/ticket', {
            method: 'POST',
            body: fd,
        });
    }
}
