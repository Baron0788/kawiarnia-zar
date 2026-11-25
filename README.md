# Żar — strona kawiarni z rezerwacją stolików

Landing page przytulnej kawiarni z palarnią: menu w zakładkach, galeria, opinie gości z oceną
i rezerwacja stolika z planem sali. Responsywna (telefon, tablet, komputer).

**Demo:** https://baron0788.github.io/kawiarnia_beta/

## Funkcje

- **Rezerwacja stolika** — wybór daty, godziny i liczby gości, plan stolików (wolny / zajęty / za mały).
  Podwójną rezerwację blokuje unikalny klucz w bazie.
- **Opinie** — dodawanie opinii z oceną 1–5, średnia ocena, rozkład ocen, „Pokaż więcej”.
- **Menu w zakładkach**, galeria, godziny otwarcia z podświetleniem dzisiejszego dnia.
- **Walidacja** po stronie przeglądarki i serwera, zapytania przygotowane (ochrona przed SQL injection),
  bezpieczne wyświetlanie treści od użytkowników (ochrona przed XSS).

## Technologie

HTML5, CSS3 (zmienne, Grid, Flexbox, animacje), JavaScript (bez frameworków, Fetch API),
PHP 8 (PDO), MySQL / MariaDB.

## Tryb demo

Gdy strona działa bez serwera PHP (np. GitHub Pages), automatycznie przechodzi w tryb demo:
opinie i rezerwacje zapisują się tylko w przeglądarce odwiedzającego (localStorage),
z taką samą walidacją jak na serwerze.

## Uruchomienie lokalne (pełna wersja)

1. Zainstaluj [XAMPP](https://www.apachefriends.org/) i uruchom MySQL.
2. Zaimportuj `database/schema.sql` (phpMyAdmin → Import).
3. W folderze projektu uruchom: `php -S localhost:8000`
4. Otwórz http://localhost:8000

Dane dostępu do bazy — w `api/config.php`.

## Struktura

```
index.html          struktura strony
style.css           wygląd
script.js           interakcje, komunikacja z API, tryb demo
api/                backend PHP (opinie, dostępność, rezerwacja)
database/schema.sql tabele i dane przykładowe
```

Zdjęcia: [Unsplash](https://unsplash.com). Kawiarnia „Żar” jest fikcyjna — projekt do portfolio.

---

**EN:** Landing page for a fictional coffee shop with table booking and guest reviews.
Vanilla HTML/CSS/JS + PHP/MySQL backend; falls back to an in-browser demo mode when PHP is unavailable.
