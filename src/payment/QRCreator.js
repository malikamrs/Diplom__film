const QRCreatorLib = {
    create: function (text, options = {}) {
        if (window.QRious) {
            return new window.QRious({
                element: options.element,
                value: text,
                size: options.size || 200,
                level: options.level || 'H',
                background: options.background || '#ffffff',
                foreground: options.foreground || '#000000'
            });
        } else {
            console.error('Библиотека QR-кодов не найдена');
            return null;
        }
    }
};

function getOrCreateBookingCode() {
    let code = sessionStorage.getItem('ticketCode');
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const result = [];
        for (let i = 0; i < 8; i++) {
            const randomIndex = Math.floor(Math.random() * alphabet.length);
            result.push(alphabet[randomIndex]);
        }
        code = result.join('');
        sessionStorage.setItem('ticketCode', code);
    }
    return code;
}

function initTicketQR() {
    const raw = sessionStorage.getItem('ticketData');
    let data = null;
    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch (error) {
            console.error('Ошибка парсинга данных билета:', error);
        }
    }

    const params = new URLSearchParams(window.location.search);
    const movieEl = document.getElementById('ticket-movie');
    const seatsEl = document.getElementById('ticket-seats');
    const hallEl = document.getElementById('ticket-hall');
    const timeEl = document.getElementById('ticket-time');
    const qrCanvas = document.getElementById('ticket-qr-canvas');

    let filmName = data?.filmName || params.get('movie') || 'Фильм не указан';
    let seats = '--';
    if (data?.seats && Array.isArray(data.seats)) {
        seats = data.seats.map(s => `${s.row}/${s.place}`).join(', ');
    } else {
        seats = params.get('seats') || '--';
    }

    let hallName = data?.hallName || params.get('hall') || '--';
    let seanceTime = data?.seanceTime || params.get('time') || '--:--';
    let seanceDate = data?.seanceDate || params.get('date') || '';
    let totalCost = data?.totalCost !== undefined ? data.totalCost : (params.get('price') || '0');

    const hallNumberMatch = hallName.match(/зал\s*(\d+)/i);
    const hallDisplay = hallNumberMatch ? hallNumberMatch[1] : hallName;

    if (movieEl) movieEl.textContent = filmName;
    if (seatsEl) seatsEl.textContent = seats;
    if (hallEl) hallEl.textContent = hallDisplay;
    if (timeEl) timeEl.textContent = seanceTime;

    const bookingCode = getOrCreateBookingCode();

    const qrString = [
        `Код: ${bookingCode}`,
        `Фильм: ${filmName}`,
        `Зал: ${hallName}`,
        `Ряд/Место: ${seats}`,
        `Дата: ${seanceDate}`,
        `Время: ${seanceTime}`,
        `Стоимость: ${totalCost} руб.`,
        `Билет действителен строго на свой сеанс`
    ].join('\n');

    console.log("Данные для QR-кода:", qrString);
}


document.addEventListener('DOMContentLoaded', initTicketQR);

export { getOrCreateBookingCode, initTicketQR };
