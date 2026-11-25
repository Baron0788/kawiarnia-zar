-- Żar — baza danych (MySQL / MariaDB)
-- Import: phpMyAdmin → Import, albo: mysql -u root < schema.sql
-- UWAGA: skrypt usuwa i tworzy bazę „zar” od nowa.

DROP DATABASE IF EXISTS zar;
CREATE DATABASE zar CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci;
USE zar;


CREATE TABLE tables (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name  VARCHAR(40)  NOT NULL,
  seats TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE = InnoDB;


CREATE TABLE reservations (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_id   INT UNSIGNED NOT NULL,
  res_date   DATE NOT NULL,
  res_time   TIME NOT NULL,
  guests     TINYINT UNSIGNED NOT NULL,
  name       VARCHAR(60) NOT NULL,
  phone      VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  -- Jeden stolik = jedna rezerwacja na dany termin (chroni przed podwójną rezerwacją)
  UNIQUE KEY one_booking_per_slot (table_id, res_date, res_time),
  CONSTRAINT fk_reservation_table FOREIGN KEY (table_id) REFERENCES tables (id)
) ENGINE = InnoDB;


CREATE TABLE reviews (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(60)  NOT NULL,
  rating     TINYINT UNSIGNED NOT NULL,
  text       VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT rating_1_to_5 CHECK (rating BETWEEN 1 AND 5)
) ENGINE = InnoDB;


-- ---------- Dane przykładowe ----------

INSERT INTO tables (name, seats) VALUES
  ('Przy oknie', 2),
  ('Przy oknie', 2),
  ('Przy barze', 2),
  ('Kanapa',     4),
  ('Kanapa',     4),
  ('Środek',     4),
  ('Kominek',    6),
  ('Duży stół',  8);

-- Daty względem dnia importu, żeby demo zawsze miało zajęte stoliki
INSERT INTO reservations (table_id, res_date, res_time, guests, name, phone) VALUES
  (1, CURDATE(),                     '18:00', 2, 'Anna',     '+48 600 100 200'),
  (4, CURDATE(),                     '18:00', 3, 'Piotr',    '+48 600 100 201'),
  (7, CURDATE(),                     '16:00', 5, 'Magda',    '+48 600 100 202'),
  (2, CURDATE() + INTERVAL 1 DAY,    '12:00', 2, 'Kuba',     '+48 600 100 203'),
  (5, CURDATE() + INTERVAL 1 DAY,    '14:00', 4, 'Ewa',      '+48 600 100 204'),
  (8, CURDATE() + INTERVAL 1 DAY,    '18:00', 7, 'Marek',    '+48 600 100 205'),
  (1, CURDATE() + INTERVAL 1 DAY,    '18:00', 2, 'Zosia',    '+48 600 100 206'),
  (3, CURDATE() + INTERVAL 2 DAY,    '10:00', 1, 'Bartek',   '+48 600 100 207'),
  (6, CURDATE() + INTERVAL 2 DAY,    '16:00', 4, 'Ola',      '+48 600 100 208'),
  (4, CURDATE() + INTERVAL 3 DAY,    '18:00', 4, 'Tomek',    '+48 600 100 209'),
  (5, CURDATE() + INTERVAL 3 DAY,    '18:00', 3, 'Kasia',    '+48 600 100 210'),
  (7, CURDATE() + INTERVAL 3 DAY,    '18:00', 6, 'Agata',    '+48 600 100 211'),
  (2, CURDATE() + INTERVAL 4 DAY,    '14:00', 2, 'Michał',   '+48 600 100 212'),
  (8, CURDATE() + INTERVAL 5 DAY,    '12:00', 8, 'Rodzina K.', '+48 600 100 213');

INSERT INTO reviews (name, rating, text, created_at) VALUES
  ('Kasia',   5, 'Najlepszy flat white w okolicy. Wieczorem atmosfera jak w domu.',            NOW() - INTERVAL 2 DAY),
  ('Tomek',   5, 'Cynamonki znikają przed południem — warto przyjść wcześnie!',                NOW() - INTERVAL 5 DAY),
  ('Ola',     5, 'Kupuję tu ziarno do domu. Barista zawsze doradzi coś nowego.',               NOW() - INTERVAL 8 DAY),
  ('Paweł',   4, 'Świetna kawa, tylko w sobotę trudno o wolny stolik. Lepiej zarezerwować.',   NOW() - INTERVAL 11 DAY),
  ('Natalia', 5, 'Sernik baskijski to poezja. Wrócę na pewno.',                                NOW() - INTERVAL 15 DAY),
  ('Jan',     4, 'Przyjemne miejsce do pracy z laptopem, dobre Wi-Fi i ciche wieczory.',       NOW() - INTERVAL 19 DAY),
  ('Marta',   5, 'Matcha latte idealnie słodka. Obsługa bardzo miła.',                         NOW() - INTERVAL 24 DAY),
  ('Krzysztof', 3, 'Kawa dobra, ale czekałem długo na zamówienie w weekend.',                  NOW() - INTERVAL 30 DAY),
  ('Iza',     5, 'Byłyśmy z przyjaciółkami przy kominku — klimat cudowny.',                    NOW() - INTERVAL 37 DAY),
  ('Adam',    5, 'Cold brew latem ratuje życie. Polecam!',                                     NOW() - INTERVAL 45 DAY);
