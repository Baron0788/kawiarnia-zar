<?php
// POST api/reserve.php
// { date, time, tableId, guests, name, phone }
// → 201 { ok, table, tableId } | 400 błąd danych | 409 stolik już zajęty

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Nieobsługiwana metoda.', 405);
}

$data = read_json_body();

$date    = (string) ($data['date'] ?? '');
$time    = (string) ($data['time'] ?? '');
$tableId = (int) ($data['tableId'] ?? 0);
$guests  = (int) ($data['guests'] ?? 0);
$name    = trim((string) ($data['name'] ?? ''));
$phone   = trim((string) ($data['phone'] ?? ''));


// ---------- Walidacja ----------

if (!is_valid_date($date)) {
    send_error('Wybierz poprawną datę.');
}
$today = date('Y-m-d');
if ($date < $today || $date > date('Y-m-d', strtotime('+' . MAX_DAYS_AHEAD . ' days'))) {
    send_error('Ta data jest niedostępna.');
}
if (!in_array($time, RESERVATION_TIMES, true)) {
    send_error('Wybierz godzinę z listy.');
}
if ($date === $today && $time <= date('H:i')) {
    send_error('Ta godzina już minęła.');
}
if ($guests < 1 || $guests > 8) {
    send_error('Liczba osób: od 1 do 8. Większe grupy — zadzwoń do nas.');
}
if (mb_strlen($name) < 2 || mb_strlen($name) > 60) {
    send_error('Podaj imię (2–60 znaków).');
}
if (!preg_match('/^[0-9 +()-]{9,20}$/', $phone)) {
    send_error('Podaj poprawny numer telefonu.');
}

$pdo = db();

$stmt = $pdo->prepare('SELECT name, seats FROM tables WHERE id = ?');
$stmt->execute([$tableId]);
$table = $stmt->fetch();

if (!$table) {
    send_error('Wybierz stolik.');
}
if ((int) $table['seats'] < $guests) {
    send_error('Ten stolik jest za mały dla ' . $guests . ' osób.');
}


// ---------- Zapis ----------
// Bez osobnego SELECT-a „czy wolny”: podwójną rezerwację blokuje
// unikalny klucz one_booking_per_slot (brak wyścigu między zapytaniami).
try {
    $stmt = $pdo->prepare(
        'INSERT INTO reservations (table_id, res_date, res_time, guests, name, phone)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$tableId, $date, $time, $guests, $name, $phone]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        send_error('Ktoś właśnie zarezerwował ten stolik. Wybierz inny.', 409);
    }
    throw $e;
}

send_json(['ok' => true, 'table' => $table['name'], 'tableId' => $tableId], 201);
