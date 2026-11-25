<?php
// GET  api/reviews.php?offset=0  → opinie + statystyki
// POST api/reviews.php           → nowa opinia

require __DIR__ . '/config.php';

const PAGE_SIZE = 6;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    get_reviews();
} elseif ($method === 'POST') {
    add_review();
} else {
    send_error('Nieobsługiwana metoda.', 405);
}


function get_reviews(): void
{
    $pdo = db();
    $offset = max(0, (int) ($_GET['offset'] ?? 0));

    $stats = $pdo->query('SELECT AVG(rating) AS average, COUNT(*) AS total FROM reviews')->fetch();
    $rows = $pdo->query('SELECT rating, COUNT(*) AS cnt FROM reviews GROUP BY rating')->fetchAll();

    $distribution = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
    foreach ($rows as $row) {
        $distribution[(int) $row['rating']] = (int) $row['cnt'];
    }

    $stmt = $pdo->prepare(
        'SELECT name, rating, text, created_at
           FROM reviews
          ORDER BY created_at DESC, id DESC
          LIMIT ? OFFSET ?'
    );
    $stmt->bindValue(1, PAGE_SIZE, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $reviews = $stmt->fetchAll();

    $total = (int) $stats['total'];

    send_json([
        'average'      => $total > 0 ? round((float) $stats['average'], 1) : 0,
        'total'        => $total,
        'distribution' => $distribution,
        'reviews'      => $reviews,
        'hasMore'      => $offset + count($reviews) < $total,
    ]);
}


function add_review(): void
{
    $data = read_json_body();

    $name   = trim((string) ($data['name'] ?? ''));
    $text   = trim((string) ($data['text'] ?? ''));
    $rating = (int) ($data['rating'] ?? 0);

    // Walidacja po stronie serwera — przeglądarce nie ufamy
    if (mb_strlen($name) < 2 || mb_strlen($name) > 60) {
        send_error('Podaj imię (2–60 znaków).');
    }
    if ($rating < 1 || $rating > 5) {
        send_error('Wybierz ocenę od 1 do 5 gwiazdek.');
    }
    if (mb_strlen($text) < 10 || mb_strlen($text) > 500) {
        send_error('Opinia powinna mieć od 10 do 500 znaków.');
    }

    $stmt = db()->prepare('INSERT INTO reviews (name, rating, text) VALUES (?, ?, ?)');
    $stmt->execute([$name, $rating, $text]);

    send_json(['ok' => true], 201);
}
