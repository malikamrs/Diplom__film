import ApiService from '../api/ApiService.js';

const api = new ApiService();

const params = new URLSearchParams(window.location.search);
const seanceIdParam = params.get('seanceId');
const dateParam = params.get('date');
const hallParam = params.get('hall');
const timeParam = params.get('time');
const movieParam = params.get('movie');

const selectedSeats = [];
let currentHall = null;
let currentFilm = null;
let currentSeance = null;
let currentDate = dateParam || new Date().toISOString().slice(0, 10);

async function init() {
  try {
    const data = await api.getAllData();
    const { halls, films, seances } = data;

    currentSeance = findSeance(halls, films, seances);

    if (currentSeance) {
      currentHall = halls.find((h) => h.id === currentSeance.seance_hallid);
      currentFilm = films.find((f) => f.id === currentSeance.seance_filmid);
    } else {
      if (hallParam) {
        currentHall = halls.find(
          (h) => h.hall_name.toLowerCase() === hallParam.toLowerCase(),
        );
      }
      if (!currentHall) {
        currentHall = halls.find((h) => h.hall_open === 1) || halls[0];
      }
    }

    fillInfo();

    if (currentSeance) {
      const hallConfig = await api.getHallConfig(currentSeance.id, currentDate);
      renderSeats(hallConfig);
    } else if (currentHall && currentHall.hall_config) {
      renderSeats(currentHall.hall_config);
    }

    updatePrices();

    setupBookingButton();
  } catch (err) {
    console.error('Ошибка при загрузке данных:', err);
    fillInfoFromParams();
  }
}

function findSeance(halls, films, seances) {
  if (seanceIdParam) {
    const found = seances.find((s) => String(s.id) === String(seanceIdParam));
    if (found) return found;
  }

  if (hallParam && timeParam) {
    const hall = halls.find(
      (h) => h.hall_name.toLowerCase() === hallParam.toLowerCase(),
    );

    if (hall) {
      let found = seances.find(
        (s) => s.seance_hallid === hall.id && s.seance_time === timeParam,
      );
      if (found) return found;
      if (movieParam) {
        const film = films.find(
          (f) => f.film_name.toLowerCase() === movieParam.toLowerCase(),
        );
        if (film) {
          found = seances.find(
            (s) =>
              s.seance_hallid === hall.id &&
              s.seance_filmid === film.id &&
              s.seance_time === timeParam,
          );
          if (found) return found;
        }
      }
    }

    const hallById = halls.find((h) => String(h.id) === String(hallParam));
    if (hallById) {
      const found = seances.find(
        (s) => s.seance_hallid === hallById.id && s.seance_time === timeParam,
      );
      if (found) return found;
    }

    const hallIndex = parseInt(hallParam, 10) - 1;
    if (!isNaN(hallIndex) && hallIndex >= 0 && hallIndex < halls.length) {
      const targetHall = halls[hallIndex];
      const found = seances.find(
        (s) => s.seance_hallid === targetHall.id && s.seance_time === timeParam,
      );
      if (found) return found;
    }
  }

  return null;
}

function fillInfo() {
  const movieTitleEl = document.querySelector('.hall__movie-title');
  const timeEl = document.querySelector('.hall__time');
  const hallTitleEl = document.querySelector('.hall__title');
  if (movieTitleEl) {
    movieTitleEl.textContent =
      currentFilm?.film_name || movieParam || 'Фильм не указан';
  }
  if (timeEl) {
    const time = currentSeance?.seance_time || timeParam || '--:--';
    timeEl.textContent = `Начало сеанса: ${time}`;
  }
  if (hallTitleEl) {
    const hallName = currentHall?.hall_name || hallParam || 'Зал';
    hallTitleEl.textContent = toProperCase(hallName);
  }
}

function fillInfoFromParams() {
  const movieTitleEl = document.querySelector('.hall__movie-title');
  const timeEl = document.querySelector('.hall__time');
  const hallTitleEl = document.querySelector('.hall__title');

  if (movieTitleEl) movieTitleEl.textContent = movieParam || 'Фильм';
  if (timeEl) timeEl.textContent = `Начало сеанса: ${timeParam || '--:--'}`;
  if (hallTitleEl) hallTitleEl.textContent = hallParam || 'Зал';
}

function updatePrices() {
  const priceStandartEl = document.getElementById('price-standart');
  const priceVipEl = document.getElementById('price-vip');

  if (priceStandartEl && currentHall) {
    priceStandartEl.textContent = currentHall.hall_price_standart;
  }
  if (priceVipEl && currentHall) {
    priceVipEl.textContent = currentHall.hall_price_vip;
  }
}

function renderSeats(config) {
  const container = document.getElementById('hall-seats');
  container.innerHTML = '';

  config.forEach((row, rowIndex) => {
    const rowEl = document.createElement('div');
    rowEl.classList.add('hall__row');

    row.forEach((seatType, placeIndex) => {
      const seat = document.createElement('div');
      seat.classList.add('hall__seat');
      seat.classList.add(`hall__seat--${seatType}`);
      seat.dataset.row = rowIndex + 1;
      seat.dataset.place = placeIndex + 1;
      seat.dataset.type = seatType;

      if (seatType === 'standart' || seatType === 'vip') {
        seat.addEventListener('click', () => toggleSeat(seat));
      }

      rowEl.appendChild(seat);
    });

    container.appendChild(rowEl);
  });
}

function toggleSeat(seatEl) {
  const row = parseInt(seatEl.dataset.row, 10);
  const place = parseInt(seatEl.dataset.place, 10);
  const originalType = seatEl.dataset.type;

  const existingIndex = selectedSeats.findIndex(
    (s) => s.row === row && s.place === place,
  );

  if (existingIndex !== -1) {
    selectedSeats.splice(existingIndex, 1);
    seatEl.classList.remove('hall__seat--selected');
    seatEl.classList.add(`hall__seat--${originalType}`);
  } else {
    selectedSeats.push({ row, place, type: originalType });
    seatEl.classList.remove(`hall__seat--${originalType}`);
    seatEl.classList.add('hall__seat--selected');
  }

  updateBookingButton();
}

function updateBookingButton() {
  const btn = document.getElementById('booking-btn');
  btn.disabled = selectedSeats.length === 0;
}

function setupBookingButton() {
  const btn = document.getElementById('booking-btn');

  btn.addEventListener('click', async () => {
    if (selectedSeats.length === 0) return;

    const totalCost = selectedSeats.reduce((sum, seat) => {
      if (seat.type === 'vip') {
        return sum + Number(currentHall?.hall_price_vip || 0);
      }
      return sum + Number(currentHall?.hall_price_standart || 0);
    }, 0);

    const baseTicketData = {
      filmName: currentFilm?.film_name || movieParam || 'Фильм',
      hallName: currentHall?.hall_name || hallParam || 'Зал',
      seanceTime: currentSeance?.seance_time || timeParam || '--:--',
      seanceDate: currentDate,
      seats: selectedSeats.map((seat) => ({
        row: seat.row,
        place: seat.place,
        type: seat.type,
      })),
      totalCost,
    };

    if (!currentSeance) {
      sessionStorage.setItem('ticketData', JSON.stringify(baseTicketData));
      window.location.href = '../payment/payment.html';
      return;
    }

    const tickets = selectedSeats.map((s) => ({
      row: s.row,
      place: s.place,
      coast:
        s.type === 'vip'
          ? currentHall.hall_price_vip
          : currentHall.hall_price_standart,
    }));

    try {
      btn.disabled = true;
      btn.textContent = 'ОФОРМЛЯЕМ...';

      const result = await api.buyTickets(currentSeance.id, currentDate, tickets);

      console.log('Билеты куплены:', result);

      sessionStorage.setItem('ticketData', JSON.stringify(baseTicketData));
      window.location.href = '../payment/payment.html';
    } catch (err) {
      console.error('Ошибка при покупке билетов:', err);
      alert('Ошибка при бронировании: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'ЗАБРОНИРОВАТЬ';
    }
  });
}

function toProperCase(str) {
  return str
    .toLowerCase()
    .replace(/(^|\s)\S/g, (char) => char.toUpperCase());
}

init();