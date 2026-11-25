/* Żar — skrypt strony.
   Opinie i rezerwacje działają z backendem PHP + MySQL (folder api/).
   Gdy serwera PHP nie ma (np. GitHub Pages), strona przechodzi w tryb demo:
   dane są zapisywane tylko w przeglądarce odwiedzającego (localStorage). */


/* ---------- 1. Nawigacja ---------- */

const nav = document.getElementById('nav');

function updateNavBackground() {
  nav.classList.toggle('scrolled', window.scrollY > 30);
}

window.addEventListener('scroll', updateNavBackground, { passive: true });
updateNavBackground();

document.getElementById('burger').addEventListener('click', function () {
  nav.classList.toggle('open');
});

nav.querySelectorAll('.links a').forEach(function (link) {
  link.addEventListener('click', function () {
    nav.classList.remove('open');
  });
});


/* ---------- 2. Zakładki menu ---------- */

const tabs = document.querySelectorAll('.tab');
const menuLists = document.querySelectorAll('.menu-list');

tabs.forEach(function (clickedTab) {
  clickedTab.addEventListener('click', function () {
    tabs.forEach(function (tab) {
      tab.classList.toggle('active', tab === clickedTab);
    });
    menuLists.forEach(function (list) {
      list.classList.toggle('active', list.dataset.list === clickedTab.dataset.tab);
    });
  });
});


/* ---------- 3. Animacja pojawiania się sekcji ---------- */

const revealObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(function (block) {
  revealObserver.observe(block);
});


/* ---------- 4. Godziny otwarcia: podświetlenie dzisiejszego dnia ---------- */

const today = new Date().getDay();   // 0 = niedziela, 6 = sobota
let rowKey = '1';                    // pn–pt
if (today === 0) rowKey = '0';
if (today === 6) rowKey = '6';
document.querySelector(`#hours [data-day="${rowKey}"]`).classList.add('today');

document.getElementById('year').textContent = new Date().getFullYear();


/* ---------- 5. Pomocnicze ---------- */

// Data '2026-11-19' w czasie lokalnym (toISOString liczy w UTC)
function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// '2026-11-19 14:05:00' — taki format zwraca MySQL
function toDateTimeString(date) {
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map(function (n) { return String(n).padStart(2, '0'); })
    .join(':');
  return `${toDateString(date)} ${time}`;
}

function currentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Polska odmiana: 1 opinia, 2–4 opinie, 5+ opinii (12–14 → opinii)
function polishPlural(n, one, few, many) {
  if (n === 1) return one;
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

function stars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function showMessage(box, text, isError) {
  box.textContent = text;
  box.classList.toggle('error', isError);
}


/* ---------- 6. Komunikacja z API (PHP lub tryb demo) ---------- */

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let demoMode = false;

async function api(url, options) {
  if (!demoMode) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) {
        throw new ApiError(data.error || 'Coś poszło nie tak.', response.status);
      }
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      // Brak PHP (odpowiedź nie jest JSON-em) → włączamy tryb demo
      enableDemoMode();
    }
  }
  return demoApi(url, options);
}

function postJson(url, body) {
  return api(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function enableDemoMode() {
  if (demoMode) return;
  demoMode = true;
  const badge = document.createElement('div');
  badge.className = 'demo-badge';
  badge.textContent = 'Wersja demo — opinie i rezerwacje zapisują się tylko w Twojej przeglądarce';
  document.body.append(badge);
}


/* ---------- 7. Tryb demo: „backend” w przeglądarce ----------
   Odwzorowuje api/reviews.php, api/availability.php i api/reserve.php,
   łącznie z walidacją. Dane startowe są jak w database/schema.sql. */

const DEMO_KEY = 'zar-demo-v1';
const RESERVATION_TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00'];
const MAX_DAYS_AHEAD = 60;
const PAGE_SIZE = 6;

const DEMO_TABLES = [
  { id: 1, name: 'Przy oknie', seats: 2 },
  { id: 2, name: 'Przy oknie', seats: 2 },
  { id: 3, name: 'Przy barze', seats: 2 },
  { id: 4, name: 'Kanapa', seats: 4 },
  { id: 5, name: 'Kanapa', seats: 4 },
  { id: 6, name: 'Środek', seats: 4 },
  { id: 7, name: 'Kominek', seats: 6 },
  { id: 8, name: 'Duży stół', seats: 8 },
];

// [dni od dziś, stolik, godzina]
const DEMO_SEED_RESERVATIONS = [
  [0, 1, '18:00'], [0, 4, '18:00'], [0, 7, '16:00'],
  [1, 2, '12:00'], [1, 5, '14:00'], [1, 8, '18:00'], [1, 1, '18:00'],
  [2, 3, '10:00'], [2, 6, '16:00'],
  [3, 4, '18:00'], [3, 5, '18:00'], [3, 7, '18:00'],
  [4, 2, '14:00'], [5, 8, '12:00'],
];

// [imię, ocena, tekst, dni temu]
const DEMO_SEED_REVIEWS = [
  ['Kasia', 5, 'Najlepszy flat white w okolicy. Wieczorem atmosfera jak w domu.', 2],
  ['Tomek', 5, 'Cynamonki znikają przed południem — warto przyjść wcześnie!', 5],
  ['Ola', 5, 'Kupuję tu ziarno do domu. Barista zawsze doradzi coś nowego.', 8],
  ['Paweł', 4, 'Świetna kawa, tylko w sobotę trudno o wolny stolik. Lepiej zarezerwować.', 11],
  ['Natalia', 5, 'Sernik baskijski to poezja. Wrócę na pewno.', 15],
  ['Jan', 4, 'Przyjemne miejsce do pracy z laptopem, dobre Wi-Fi i ciche wieczory.', 19],
  ['Marta', 5, 'Matcha latte idealnie słodka. Obsługa bardzo miła.', 24],
  ['Krzysztof', 3, 'Kawa dobra, ale czekałem długo na zamówienie w weekend.', 30],
  ['Iza', 5, 'Byłyśmy z przyjaciółkami przy kominku — klimat cudowny.', 37],
  ['Adam', 5, 'Cold brew latem ratuje życie. Polecam!', 45],
];

// Dane dodane przez odwiedzającego. Bez localStorage (tryb prywatny) — tylko w pamięci.
let demoMemory = { reviews: [], reservations: [] };

function loadDemoStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEMO_KEY));
    if (saved && Array.isArray(saved.reviews) && Array.isArray(saved.reservations)) {
      demoMemory = saved;
    }
  } catch (error) { /* brak dostępu — zostaje pamięć */ }
  return demoMemory;
}

function saveDemoStore(store) {
  demoMemory = store;
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(store));
  } catch (error) { /* brak dostępu — zostaje pamięć */ }
}

function daysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function demoReviews() {
  const seed = DEMO_SEED_REVIEWS.map(function ([name, rating, text, daysAgo]) {
    const date = daysFromToday(-daysAgo);
    date.setHours(12, 0, 0, 0);
    return { name, rating, text, created_at: toDateTimeString(date) };
  });
  return loadDemoStore().reviews.concat(seed).sort(function (a, b) {
    return b.created_at.localeCompare(a.created_at);
  });
}

function demoReservations() {
  const seed = DEMO_SEED_RESERVATIONS.map(function ([days, tableId, time]) {
    return { date: toDateString(daysFromToday(days)), tableId, time };
  });
  return seed.concat(loadDemoStore().reservations);
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00');
  return !isNaN(date) && toDateString(date) === value;
}

function checkDateRange(date, pastMessage, futureMessage) {
  if (date < toDateString(new Date())) throw new ApiError(pastMessage, 400);
  if (date > toDateString(daysFromToday(MAX_DAYS_AHEAD))) throw new ApiError(futureMessage, 400);
}

async function demoApi(url, options) {
  const method = (options && options.method) || 'GET';
  const body = options && options.body ? JSON.parse(options.body) : {};
  const [path, query] = url.split('?');
  const params = new URLSearchParams(query);

  if (path === 'api/reviews.php' && method === 'GET') return demoGetReviews(params);
  if (path === 'api/reviews.php' && method === 'POST') return demoAddReview(body);
  if (path === 'api/availability.php') return demoAvailability(params);
  if (path === 'api/reserve.php') return demoReserve(body);
  throw new ApiError('Nieobsługiwane zapytanie.', 404);
}

function demoGetReviews(params) {
  const all = demoReviews();
  const offset = Math.max(0, parseInt(params.get('offset'), 10) || 0);
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  all.forEach(function (review) {
    distribution[review.rating]++;
    sum += review.rating;
  });
  const page = all.slice(offset, offset + PAGE_SIZE);
  return {
    average: all.length ? Math.round((sum / all.length) * 10) / 10 : 0,
    total: all.length,
    distribution,
    reviews: page,
    hasMore: offset + page.length < all.length,
  };
}

function demoAddReview(data) {
  const name = String(data.name || '').trim();
  const text = String(data.text || '').trim();
  const rating = parseInt(data.rating, 10) || 0;

  if (name.length < 2 || name.length > 60) throw new ApiError('Podaj imię (2–60 znaków).', 400);
  if (rating < 1 || rating > 5) throw new ApiError('Wybierz ocenę od 1 do 5 gwiazdek.', 400);
  if (text.length < 10 || text.length > 500) throw new ApiError('Opinia powinna mieć od 10 do 500 znaków.', 400);

  const store = loadDemoStore();
  store.reviews.push({ name, rating, text, created_at: toDateTimeString(new Date()) });
  saveDemoStore(store);
  return { ok: true };
}

function demoAvailability(params) {
  const date = params.get('date') || '';
  if (!isValidDate(date)) throw new ApiError('Nieprawidłowa data.', 400);
  checkDateRange(date, 'Nie można rezerwować w przeszłości.',
    `Rezerwacje przyjmujemy maksymalnie ${MAX_DAYS_AHEAD} dni do przodu.`);

  const taken = new Set(demoReservations()
    .filter(function (r) { return r.date === date; })
    .map(function (r) { return `${r.time}|${r.tableId}`; }));
  const isToday = date === toDateString(new Date());
  const now = currentTime();

  return {
    date,
    slots: RESERVATION_TIMES.map(function (time) {
      return {
        time,
        past: isToday && time <= now,
        tables: DEMO_TABLES.map(function (table) {
          return { ...table, taken: taken.has(`${time}|${table.id}`) };
        }),
      };
    }),
  };
}

function demoReserve(data) {
  const date = String(data.date || '');
  const time = String(data.time || '');
  const tableId = parseInt(data.tableId, 10) || 0;
  const guests = parseInt(data.guests, 10) || 0;
  const name = String(data.name || '').trim();
  const phone = String(data.phone || '').trim();

  if (!isValidDate(date)) throw new ApiError('Wybierz poprawną datę.', 400);
  checkDateRange(date, 'Ta data jest niedostępna.', 'Ta data jest niedostępna.');
  if (!RESERVATION_TIMES.includes(time)) throw new ApiError('Wybierz godzinę z listy.', 400);
  if (date === toDateString(new Date()) && time <= currentTime()) throw new ApiError('Ta godzina już minęła.', 400);
  if (guests < 1 || guests > 8) throw new ApiError('Liczba osób: od 1 do 8. Większe grupy — zadzwoń do nas.', 400);
  if (name.length < 2 || name.length > 60) throw new ApiError('Podaj imię (2–60 znaków).', 400);
  if (!/^[0-9 +()-]{9,20}$/.test(phone)) throw new ApiError('Podaj poprawny numer telefonu.', 400);

  const table = DEMO_TABLES.find(function (t) { return t.id === tableId; });
  if (!table) throw new ApiError('Wybierz stolik.', 400);
  if (table.seats < guests) throw new ApiError(`Ten stolik jest za mały dla ${guests} osób.`, 400);

  const busy = demoReservations().some(function (r) {
    return r.date === date && r.time === time && r.tableId === tableId;
  });
  if (busy) throw new ApiError('Ktoś właśnie zarezerwował ten stolik. Wybierz inny.', 409);

  // Zapisujemy tylko stolik i termin — danych osobowych demo nie przechowuje
  const store = loadDemoStore();
  const todayStr = toDateString(new Date());
  store.reservations = store.reservations.filter(function (r) { return r.date >= todayStr; });
  store.reservations.push({ date, time, tableId });
  saveDemoStore(store);
  return { ok: true, table: table.name, tableId };
}


/* ---------- 8. Opinie ---------- */

const reviewList = document.getElementById('review-list');
const moreReviewsButton = document.getElementById('more-reviews');
let reviewsLoaded = 0;

async function loadReviews(reset) {
  if (reset) {
    reviewsLoaded = 0;
    reviewList.innerHTML = '';
  }

  try {
    const data = await api(`api/reviews.php?offset=${reviewsLoaded}`);
    renderSummary(data);
    data.reviews.forEach(function (review) {
      reviewList.append(createReviewCard(review));
    });
    reviewsLoaded += data.reviews.length;
    moreReviewsButton.hidden = !data.hasMore;
  } catch (error) {
    document.getElementById('review-count').textContent = error.message;
  }
}

function renderSummary(data) {
  const average = data.average.toLocaleString('pl-PL', { minimumFractionDigits: 1 });

  document.getElementById('avg-score').textContent = average;
  document.getElementById('avg-stars').textContent = stars(Math.round(data.average));
  document.getElementById('review-count').textContent =
    `${data.total} ${polishPlural(data.total, 'opinia', 'opinie', 'opinii')} gości`;
  document.getElementById('hero-rating').textContent = `${average} ★`;

  const bars = document.getElementById('rating-bars');
  bars.innerHTML = '';

  for (let rating = 5; rating >= 1; rating--) {
    const count = data.distribution[rating];
    const percent = data.total > 0 ? (count / data.total) * 100 : 0;

    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <span>${rating} ★</span>
      <div class="bar-track"><div class="bar-fill"></div></div>
      <span>${count}</span>`;
    bars.append(row);

    // Opóźnienie, żeby zadziałała animacja szerokości z CSS
    const fill = row.querySelector('.bar-fill');
    setTimeout(function () {
      fill.style.width = percent + '%';
    }, 50);
  }
}

// Imię i tekst pochodzą od użytkownika → tylko textContent (ochrona przed XSS)
function createReviewCard(review) {
  const card = document.createElement('div');
  card.className = 'review appear';

  const starsLine = document.createElement('div');
  starsLine.className = 'stars';
  starsLine.textContent = stars(review.rating);

  const text = document.createElement('p');
  text.textContent = `„${review.text}”`;

  const who = document.createElement('div');
  who.className = 'who';

  const name = document.createElement('b');
  name.textContent = review.name;

  const date = document.createElement('span');
  date.className = 'date';
  date.textContent = new Date(review.created_at.replace(' ', 'T'))
    .toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });

  who.append(name, date);
  card.append(starsLine, text, who);
  return card;
}

moreReviewsButton.addEventListener('click', function () {
  loadReviews(false);
});

const reviewForm = document.getElementById('review-form');
const reviewMessage = document.getElementById('review-msg');

reviewForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  const checkedStar = reviewForm.querySelector('input[name="rating"]:checked');
  const nameInput = document.getElementById('review-name');
  const textInput = document.getElementById('review-text');

  const review = {
    rating: checkedStar ? Number(checkedStar.value) : 0,
    name: nameInput.value.trim(),
    text: textInput.value.trim(),
  };

  nameInput.classList.toggle('invalid', review.name.length < 2);
  textInput.classList.toggle('invalid', review.text.length < 10);

  if (review.rating === 0) {
    showMessage(reviewMessage, 'Wybierz ocenę — kliknij gwiazdkę.', true);
    return;
  }
  if (review.name.length < 2) {
    showMessage(reviewMessage, 'Podaj imię.', true);
    return;
  }
  if (review.text.length < 10) {
    showMessage(reviewMessage, 'Napisz kilka słów (min. 10 znaków).', true);
    return;
  }

  const button = reviewForm.querySelector('button');
  button.disabled = true;

  try {
    await postJson('api/reviews.php', review);
    reviewForm.reset();
    showMessage(reviewMessage, 'Dziękujemy za opinię! Właśnie się pojawiła.', false);
    await loadReviews(true);
  } catch (error) {
    showMessage(reviewMessage, error.message, true);
  }

  button.disabled = false;
});

loadReviews(true);


/* ---------- 9. Rezerwacja stolika ----------
   Data → wolne godziny → plan stolików → formularz.
   Stan wyboru trzymamy w obiekcie booking. */

const booking = {
  slots: [],
  time: null,
  tableId: null,
};

const dateInput = document.getElementById('res-date');
const guestsSelect = document.getElementById('res-guests');
const slotsBox = document.getElementById('slots');
const tablesBox = document.getElementById('tables');
const reservationForm = document.getElementById('reservation-form');
const submitButton = document.getElementById('res-submit');
const reservationMessage = document.getElementById('res-msg');

dateInput.min = toDateString(new Date());
dateInput.max = toDateString(daysFromToday(MAX_DAYS_AHEAD));
dateInput.value = toDateString(new Date());

function guestCount() {
  return Number(guestsSelect.value);
}

function selectedSlot() {
  return booking.slots.find(function (slot) {
    return slot.time === booking.time;
  });
}

function updateSubmitButton() {
  submitButton.disabled = !(booking.time && booking.tableId);
}

async function loadAvailability() {
  if (!dateInput.value) return;

  slotsBox.innerHTML = '<p class="placeholder">Sprawdzamy wolne stoliki…</p>';

  try {
    const data = await api(`api/availability.php?date=${dateInput.value}`);
    booking.slots = data.slots;

    const slot = selectedSlot();
    if (!slot || slot.past) {
      booking.time = null;
      booking.tableId = null;
    }
  } catch (error) {
    booking.slots = [];
    booking.time = null;
    booking.tableId = null;
    slotsBox.innerHTML = '';
    showMessage(reservationMessage, error.message, true);
  }

  renderSlots();
  renderTables();
}

function renderSlots() {
  if (booking.slots.length === 0) return;

  slotsBox.innerHTML = '';
  const guests = guestCount();

  booking.slots.forEach(function (slot) {
    const freeTables = slot.tables.filter(function (table) {
      return !table.taken && table.seats >= guests;
    }).length;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'slot';
    button.classList.toggle('selected', slot.time === booking.time);
    button.disabled = slot.past || freeTables === 0;

    let note;
    if (slot.past) {
      note = 'minęła';
    } else if (freeTables === 0) {
      note = 'brak miejsc';
    } else {
      note = `${freeTables} ${polishPlural(freeTables, 'wolny', 'wolne', 'wolnych')}`;
    }
    button.innerHTML = `${slot.time}<small>${note}</small>`;

    button.addEventListener('click', function () {
      booking.time = slot.time;
      booking.tableId = null;
      showMessage(reservationMessage, '', false);
      renderSlots();
      renderTables();
    });

    slotsBox.append(button);
  });
}

function renderTables() {
  const slot = selectedSlot();

  if (!slot) {
    tablesBox.innerHTML = '<p class="placeholder">Wybierz godzinę, aby zobaczyć stoliki.</p>';
    updateSubmitButton();
    return;
  }

  tablesBox.innerHTML = '';
  const guests = guestCount();

  slot.tables.forEach(function (table) {
    const tooSmall = table.seats < guests;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'table';
    button.classList.toggle('taken', table.taken);
    button.classList.toggle('small', !table.taken && tooSmall);
    button.classList.toggle('selected', table.id === booking.tableId);
    button.disabled = table.taken || tooSmall;

    if (table.taken) {
      button.title = 'Zajęty o tej godzinie';
    } else if (tooSmall) {
      button.title = `Za mały dla ${guests} osób`;
    } else {
      button.title = 'Wolny — kliknij, aby wybrać';
    }

    button.innerHTML = `<b>${table.id}</b><span>${table.seats} os.</span><span>${table.name}</span>`;

    button.addEventListener('click', function () {
      booking.tableId = table.id;
      renderTables();
    });

    tablesBox.append(button);
  });

  updateSubmitButton();
}

dateInput.addEventListener('change', function () {
  showMessage(reservationMessage, '', false);
  loadAvailability();
});

// Zmiana liczby gości: wybrany stolik mógł stać się za mały
guestsSelect.addEventListener('change', function () {
  booking.tableId = null;
  const slot = selectedSlot();
  if (slot && !slot.tables.some(function (t) { return !t.taken && t.seats >= guestCount(); })) {
    booking.time = null;
  }
  renderSlots();
  renderTables();
});

reservationForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  const nameInput = document.getElementById('res-name');
  const phoneInput = document.getElementById('res-phone');
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const phoneOk = /^[0-9 +()-]{9,20}$/.test(phone);

  nameInput.classList.toggle('invalid', name.length < 2);
  phoneInput.classList.toggle('invalid', !phoneOk);

  if (name.length < 2) {
    showMessage(reservationMessage, 'Podaj imię.', true);
    return;
  }
  if (!phoneOk) {
    showMessage(reservationMessage, 'Podaj poprawny numer telefonu.', true);
    return;
  }

  submitButton.disabled = true;

  try {
    const result = await postJson('api/reserve.php', {
      date: dateInput.value,
      time: booking.time,
      tableId: booking.tableId,
      guests: guestCount(),
      name: name,
      phone: phone,
    });

    const niceDate = new Date(dateInput.value + 'T00:00')
      .toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });

    showMessage(
      reservationMessage,
      `Gotowe, ${name}! Stolik nr ${result.tableId} (${result.table}) czeka na Ciebie ${niceDate} o ${booking.time}. Do zobaczenia!`,
      false
    );
    nameInput.value = '';
    phoneInput.value = '';
    booking.tableId = null;
  } catch (error) {
    showMessage(reservationMessage, error.message, true);
    booking.tableId = null;
  }

  await loadAvailability();
});

// Wieczorem, gdy dzisiejsze godziny minęły — od razu pokazujemy jutro
async function initBooking() {
  await loadAvailability();

  const allPast = booking.slots.length > 0 && booking.slots.every(function (slot) {
    return slot.past;
  });

  if (allPast) {
    dateInput.value = toDateString(daysFromToday(1));
    await loadAvailability();
  }
}

initBooking();
