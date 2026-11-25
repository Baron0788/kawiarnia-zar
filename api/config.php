<?php
// Wspólna konfiguracja i funkcje dla wszystkich plików API.

date_default_timezone_set('Europe/Warsaw');

// Dane bazy — domyślne dla XAMPP. Na hostingu wpisz dane od dostawcy.
const DB_HOST = 'localhost';
const DB_NAME = 'zar';
const DB_USER = 'root';
const DB_PASS = '';

// Rezerwacja trwa 2 godziny, stąd sloty co 2 h
const RESERVATION_TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00'];
const MAX_DAYS_AHEAD = 60;

// Jedno połączenie PDO na całe żądanie
function db(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    return $pdo;
}

function send_json(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function send_error(string $message, int $status = 400): void
{
    send_json(['error' => $message], $status);
}

function read_json_body(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

// Odrzuca też nieistniejące daty, np. 2026-02-31
function is_valid_date(string $date): bool
{
    $parsed = DateTime::createFromFormat('Y-m-d', $date);
    return $parsed !== false && $parsed->format('Y-m-d') === $date;
}

// Każdy nieobsłużony wyjątek → log + ogólny komunikat (bez szczegółów dla użytkownika)
set_exception_handler(function (Throwable $e) {
    error_log($e->getMessage());
    send_error('Serwer chwilowo niedostępny. Spróbuj później lub zadzwoń do nas.', 500);
});
