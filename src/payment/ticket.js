document.addEventListener('DOMContentLoaded', function () {
    var raw = sessionStorage.getItem('ticketData');
    var data = null;

    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch (e) {
            console.error('Ошибка парсинга данных билета:', e);
        }
    }

    var params = new URLSearchParams(window.location.search);

    var filmName = (data && data.filmName) ? data.filmName : (params.get('movie') || 'Фильм не указан');

    var seatsShort = '--';
    var rowsForQR = '--';
    var placesForQR = '--';

    if (data && Array.isArray(data.seats) && data.seats.length > 0) {
        seatsShort = data.seats.map(function (s) { return s.place; }).join(', ');
        var uniqueRows = [];
        data.seats.forEach(function (s) {
            if (uniqueRows.indexOf(s.row) === -1) uniqueRows.push(s.row);
        });
        rowsForQR = uniqueRows.join(', ');
        placesForQR = data.seats.map(function (s) { return s.place; }).join(', ');
    } else if (params.get('seats')) {
        seatsShort = params.get('seats');
        placesForQR = params.get('seats');
    }

    var hallName = (data && data.hallName) ? data.hallName : (params.get('hall') || 'Зал');
    var hallMatch = hallName.match(/(\d+)/);
    var hallDisplay = hallMatch ? hallMatch[1] : hallName;

    var seanceTime = (data && data.seanceTime) ? data.seanceTime : (params.get('time') || '--:--');

    var seanceDate = (data && data.seanceDate) ? data.seanceDate : (params.get('date') || '');
    if (!seanceDate) {
        var today = new Date();
        seanceDate = today.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } else {
        var parts = seanceDate.split('-');
        if (parts.length === 3) {
            seanceDate = parts[2] + '.' + parts[1] + '.' + parts[0];
        }
    }

    var totalCost = 0;
    if (data && typeof data.totalCost === 'number') {
        totalCost = data.totalCost;
    } else if (params.get('price')) {
        totalCost = params.get('price');
    }

    var movieEl = document.getElementById('ticket-movie');
    var seatsEl = document.getElementById('ticket-seats');
    var hallEl = document.getElementById('ticket-hall');
    var timeEl = document.getElementById('ticket-time');
    var dateEl = document.getElementById('ticket-date');
    var costEl = document.getElementById('ticket-cost');

    if (movieEl) movieEl.textContent = filmName;
    if (seatsEl) seatsEl.textContent = seatsShort;
    if (hallEl) hallEl.textContent = hallDisplay;
    if (timeEl) timeEl.textContent = seanceTime;
    if (dateEl) dateEl.textContent = seanceDate;
    if (costEl) costEl.textContent = totalCost;

    var qrText = [
        'Дата: ' + seanceDate,
        'Время: ' + seanceTime,
        'Фильм: ' + filmName,
        'Зал: ' + hallDisplay,
        'Ряд: ' + rowsForQR,
        'Место: ' + placesForQR,
        'Стоимость: ' + totalCost + ' руб.',
        'Билет действителен строго на свой сеанс'
    ].join('\n');

    var container = document.getElementById('ticket-qr-container');

    if (container && typeof QRCreator === 'function') {
        container.innerHTML = '';

        var qrcode = QRCreator(qrText, {
            image: 'SVG',
            modsize: 4,
            margin: 2,
            eccl: 1
        });

        if (qrcode.error) {
            console.error('Ошибка QRCreator:', qrcode.error, qrcode.errorSubcode);
        } else if (qrcode.result) {
            container.append(qrcode.result);

            var svgEl = container.querySelector('svg');
            if (svgEl) {
                svgEl.removeAttribute('width');
                svgEl.removeAttribute('height');
            }
        }
    } else {
        console.warn('QRCreator не найден');
    }
});
