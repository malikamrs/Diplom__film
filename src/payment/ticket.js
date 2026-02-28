document.addEventListener('DOMContentLoaded', () => {
  const raw = sessionStorage.getItem('ticketData');
  let data = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.error('Не удалось прочитать данные билета из sessionStorage:', error);
    }
  }

  const params = new URLSearchParams(window.location.search);

  const movieEl = document.getElementById('ticket-movie');
  const seatsEl = document.getElementById('ticket-seats');
  const hallEl = document.getElementById('ticket-hall');
  const timeEl = document.getElementById('ticket-time');
  const qrCanvas = document.getElementById('ticket-qr-canvas');

  if (data) {
    const filmName =
      typeof data.filmName === 'string' && data.filmName.trim().length > 0
        ? data.filmName
        : 'Фильм не указан';

    const seats =
      Array.isArray(data.seats) && data.seats.length > 0
        ? data.seats
            .map((seat) => {
              const row = Number(seat.row);
              const place = Number(seat.place);
              if (!Number.isFinite(row) || !Number.isFinite(place)) {
                return null;
              }
              return `${row}/${place}`;
            })
            .filter((value) => value !== null)
            .join(', ')
        : '--';

    const hallName =
      typeof data.hallName === 'string' && data.hallName.trim().length > 0
        ? data.hallName
        : params.get('hall') || '--';

    const hallNumberMatch = hallName.match(/зал\s*(\d+)/i);
    const hallValue = hallNumberMatch ? hallNumberMatch[1] : hallName;

    const timeValue =
      typeof data.seanceTime === 'string' && data.seanceTime.trim().length > 0
        ? data.seanceTime
        : params.get('time') || '--:--';

    if (movieEl) {
      movieEl.textContent = filmName;
    }

    if (seatsEl) {
      seatsEl.textContent = seats;
    }

    if (hallEl) {
      hallEl.textContent = hallValue;
    }

    if (timeEl) {
      timeEl.textContent = timeValue;
    }
  } else {
    if (movieEl) {
      movieEl.textContent = params.get('movie') || 'Фильм не указан';
    }

    if (seatsEl) {
      seatsEl.textContent = params.get('seats') || '--';
    }

    if (hallEl) {
      hallEl.textContent = params.get('hall') || '--';
    }

    if (timeEl) {
      timeEl.textContent = params.get('time') || '--:--';
    }
  }

  const bookingCode = getOrCreateBookingCode();

  if (qrCanvas && window.QRious) {
    new window.QRious({
      element: qrCanvas,
      value: bookingCode,
      size: 160,
      level: 'H',
      background: '#ffffff',
      foreground: '#000000',
    });
  } else if (!window.QRious) {
    console.error('Библиотека QRious не загружена, QR-код не может быть создан.');
  }
});

function generateBookingCode(length) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const result = [];

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    result.push(alphabet[randomIndex]);
  }

  return result.join('');
}

function getOrCreateBookingCode() {
  let code = sessionStorage.getItem('ticketCode');

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    code = generateBookingCode(8);
    sessionStorage.setItem('ticketCode', code);
  }

  return code;
}

