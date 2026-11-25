<?php
// GET api/availability.php?date=2026-11-20
// → { date, slots: [ { time, past, tables: [ { id, name, seats, taken } ] } ] }

require __DIR__ . '/config.php';

$date = (string) ($_GET['date'] ?? '');

if (!is_valid_date($date)) {
    send_error('Nieprawidłowa data.');
}

$today = date('Y-m-d');
$lastDay = date('Y-m-d', strtotime('+' . MAX_DAYS_AHEAD . ' days'));

if ($date < $today) {
    send_error('Nie można rezerwować w przeszłości.');
}
if ($date > $lastDay) {
    send_error('Rezerwacje przyjmujemy maksymalnie ' . MAX_DAYS_AHEAD . ' dni do przodu.');
}

$pdo = db();

$tables = $pdo->query('SELECT id, name, seats FROM tables ORDER BY id')->fetchAll();

$stmt = $pdo->prepare(
    "SELECT table_id, TIME_FORMAT(res_time, '%H:%i') AS time
       FROM reservations
      WHERE res_date = ?"
);
$stmt->execute([$date]);

// Klucz '18:00|4' = stolik 4 zajęty o 18:00
$taken = [];
foreach ($stmt->fetchAll() as $row) {
    $taken[$row['time'] . '|' . $row['table_id']] = true;
}

$now = date('H:i');
$slots = [];

foreach (RESERVATION_TIMES as $time) {
    $slotTables = [];

    foreach ($tables as $table) {
        $slotTables[] = [
            'id'    => (int) $table['id'],
            'name'  => $table['name'],
            'seats' => (int) $table['seats'],
            'taken' => isset($taken[$time . '|' . $table['id']]),
        ];
    }

    $slots[] = [
        'time'   => $time,
        'past'   => $date === $today && $time <= $now,
        'tables' => $slotTables,
    ];
}

send_json(['date' => $date, 'slots' => $slots]);
