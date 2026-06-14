-- AutoCare Veritabanı Kurulum Betiği
-- Veritabanını oluştur ve seç
DROP DATABASE IF EXISTS autocare_db;
CREATE DATABASE autocare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE autocare_db;

-- =========================================================================
-- 1. TABLOLARIN OLUŞTURULMASI
-- =========================================================================

-- Müşteriler Tablosu
CREATE TABLE autocare_musteriler (
    musteri_id VARCHAR(64) NOT NULL,
    musteri_ad VARCHAR(64) NOT NULL,
    musteri_soyad VARCHAR(64) NOT NULL,
    musteri_tel VARCHAR(25) NOT NULL,
    musteri_mail VARCHAR(250) NOT NULL,
    musteri_adres VARCHAR(250) NOT NULL,
    PRIMARY KEY (musteri_id)
) ENGINE=InnoDB;

-- Araçlar Tablosu
CREATE TABLE autocare_araclar (
    arac_id VARCHAR(64) NOT NULL,
    musteri_id VARCHAR(64) NOT NULL,
    arac_plaka VARCHAR(20) NOT NULL,
    arac_marka VARCHAR(50) NOT NULL,
    arac_model VARCHAR(50) NOT NULL,
    arac_yil INT NOT NULL,
    arac_sasi_no VARCHAR(50),
    PRIMARY KEY (arac_id),
    UNIQUE KEY (arac_plaka),
    UNIQUE KEY (arac_sasi_no),
    FOREIGN KEY (musteri_id) REFERENCES autocare_musteriler(musteri_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_arac_yil CHECK (arac_yil >= 1900)
) ENGINE=InnoDB;

-- Hizmetler/Ürünler Tablosu
CREATE TABLE autocare_hizmetler (
    hizmet_id VARCHAR(64) NOT NULL,
    hizmet_ad VARCHAR(250) NOT NULL,
    hizmet_kategori VARCHAR(250) NOT NULL,
    hizmet_fiyat FLOAT NOT NULL,
    hizmet_stok FLOAT NOT NULL,
    hizmet_birim VARCHAR(16) NOT NULL,
    hizmet_detay VARCHAR(250) NOT NULL,
    PRIMARY KEY (hizmet_id),
    CONSTRAINT chk_hizmet_fiyat CHECK (hizmet_fiyat >= 0),
    CONSTRAINT chk_hizmet_stok CHECK (hizmet_stok >= 0)
) ENGINE=InnoDB;

-- Servis İşlemleri Tablosu
CREATE TABLE autocare_servis_islemleri (
    islem_id VARCHAR(64) NOT NULL,
    arac_id VARCHAR(64) NOT NULL,
    hizmet_id VARCHAR(64) NOT NULL,
    islem_tarih DATETIME NOT NULL,
    islem_fiyat FLOAT NOT NULL,
    PRIMARY KEY (islem_id),
    FOREIGN KEY (arac_id) REFERENCES autocare_araclar(arac_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (hizmet_id) REFERENCES autocare_hizmetler(hizmet_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_islem_fiyat CHECK (islem_fiyat >= 0)
) ENGINE=InnoDB;

-- Ödemeler Tablosu
CREATE TABLE autocare_odemeler (
    odeme_id VARCHAR(64) NOT NULL,
    musteri_id VARCHAR(64) NOT NULL,
    odeme_tarih DATETIME NOT NULL,
    odeme_tutar FLOAT NOT NULL,
    odeme_tur VARCHAR(25) NOT NULL,
    odeme_aciklama VARCHAR(250) NOT NULL,
    PRIMARY KEY (odeme_id),
    FOREIGN KEY (musteri_id) REFERENCES autocare_musteriler(musteri_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_odeme_tutar CHECK (odeme_tutar >= 0)
) ENGINE=InnoDB;


-- =========================================================================
-- 2. TETİKLEYİCİLER (TRIGGERS)
-- =========================================================================

DELIMITER //

-- Tetikleyici 1: Stok Kontrolü (İşlem Eklemeden Önce)
CREATE TRIGGER tg_stok_kontrol
BEFORE INSERT ON autocare_servis_islemleri FOR EACH ROW
BEGIN
    DECLARE current_stok FLOAT;
    DECLARE item_birim VARCHAR(16);
    DECLARE hatamesaj VARCHAR(250);
    
    -- Ürünün stok ve birim bilgilerini al
    SELECT hizmet_stok, hizmet_birim INTO current_stok, item_birim
    FROM autocare_hizmetler
    WHERE hizmet_id = NEW.hizmet_id;
    
    -- Eğer birim 'Adet' ise (yedek parça ise) ve stok yoksa hata fırlat
    IF (item_birim = 'Adet' AND current_stok < 1) THEN
        SET hatamesaj = CONCAT('HATA: Secilen yedek parca stokta kalmamistir! Mevcut Stok: ', IFNULL(current_stok, 0));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = hatamesaj;
    END IF;
END; //

-- Tetikleyici 2: Stok Azaltma (İşlem Eklendikten Sonra)
CREATE TRIGGER tg_stok_azalt
AFTER INSERT ON autocare_servis_islemleri FOR EACH ROW
BEGIN
    DECLARE item_birim VARCHAR(16);
    
    SELECT hizmet_birim INTO item_birim
    FROM autocare_hizmetler
    WHERE hizmet_id = NEW.hizmet_id;
    
    -- Yedek parçaysa stoğu 1 adet azalt
    IF (item_birim = 'Adet') THEN
        UPDATE autocare_hizmetler
        SET hizmet_stok = hizmet_stok - 1
        WHERE hizmet_id = NEW.hizmet_id;
    END IF;
END; //

-- Tetikleyici 3: Stok Geri Yükleme (İşlem Silindikten Sonra)
CREATE TRIGGER tg_stok_arttir
AFTER DELETE ON autocare_servis_islemleri FOR EACH ROW
BEGIN
    DECLARE item_birim VARCHAR(16);
    
    SELECT hizmet_birim INTO item_birim
    FROM autocare_hizmetler
    WHERE hizmet_id = OLD.hizmet_id;
    
    -- Silinen işlem yedek parçaysa stoğu 1 arttır
    IF (item_birim = 'Adet') THEN
        UPDATE autocare_hizmetler
        SET hizmet_stok = hizmet_stok + 1
        WHERE hizmet_id = OLD.hizmet_id;
    END IF;
END; //

DELIMITER ;


-- =========================================================================
-- 3. SAKLI YORDAMLAR (STORED PROCEDURES)
-- =========================================================================

DELIMITER $$

-- --- MÜŞTERİ PROCEDURES (ASCII Takma Adlar ile Kodlandı) ---

CREATE PROCEDURE autocare_MusterilerHepsi()
BEGIN
    SELECT 
        m.musteri_id AS ID,
        m.musteri_ad AS Adi,
        m.musteri_soyad AS Soyadi,
        m.musteri_tel AS Telefon,
        m.musteri_mail AS Mail,
        m.musteri_adres AS Adres,
        (
            (SELECT IFNULL(SUM(o.odeme_tutar), 0) FROM autocare_odemeler o WHERE o.musteri_id = m.musteri_id)
            -
            (SELECT IFNULL(SUM(s.islem_fiyat), 0) 
             FROM autocare_servis_islemleri s 
             JOIN autocare_araclar a ON s.arac_id = a.arac_id 
             WHERE a.musteri_id = m.musteri_id)
        ) AS Bakiye
    FROM autocare_musteriler m;
END $$

CREATE PROCEDURE autocare_MusteriEkle(
    p_id VARCHAR(64),
    p_ad VARCHAR(64),
    p_soy VARCHAR(64),
    p_tel VARCHAR(25),
    p_mail VARCHAR(250),
    p_adr VARCHAR(250)
)
BEGIN
    INSERT INTO autocare_musteriler(musteri_id, musteri_ad, musteri_soyad, musteri_tel, musteri_mail, musteri_adres)
    VALUES (p_id, p_ad, p_soy, p_tel, p_mail, p_adr);
END $$

CREATE PROCEDURE autocare_MusteriGuncelle(
    p_id VARCHAR(64),
    p_ad VARCHAR(64),
    p_soy VARCHAR(64),
    p_tel VARCHAR(25),
    p_mail VARCHAR(250),
    p_adr VARCHAR(250)
)
BEGIN
    UPDATE autocare_musteriler
    SET musteri_ad = p_ad,
        musteri_soyad = p_soy,
        musteri_tel = p_tel,
        musteri_mail = p_mail,
        musteri_adres = p_adr
    WHERE musteri_id = p_id;
END $$

CREATE PROCEDURE autocare_MusteriSil(p_id VARCHAR(64))
BEGIN
    DELETE FROM autocare_musteriler WHERE musteri_id = p_id;
END $$

CREATE PROCEDURE autocare_MusteriBul(p_filtre VARCHAR(64))
BEGIN
    SELECT 
        m.musteri_id AS ID,
        m.musteri_ad AS Adi,
        m.musteri_soyad AS Soyadi,
        m.musteri_tel AS Telefon,
        m.musteri_mail AS Mail,
        m.musteri_adres AS Adres,
        (
            (SELECT IFNULL(SUM(o.odeme_tutar), 0) FROM autocare_odemeler o WHERE o.musteri_id = m.musteri_id)
            -
            (SELECT IFNULL(SUM(s.islem_fiyat), 0) 
             FROM autocare_servis_islemleri s 
             JOIN autocare_araclar a ON s.arac_id = a.arac_id 
             WHERE a.musteri_id = m.musteri_id)
        ) AS Bakiye
    FROM autocare_musteriler m
    WHERE m.musteri_id LIKE CONCAT('%', p_filtre, '%')
       OR m.musteri_ad LIKE CONCAT('%', p_filtre, '%')
       OR m.musteri_soyad LIKE CONCAT('%', p_filtre, '%')
       OR m.musteri_tel LIKE CONCAT('%', p_filtre, '%')
       OR m.musteri_mail LIKE CONCAT('%', p_filtre, '%')
       OR m.musteri_adres LIKE CONCAT('%', p_filtre, '%');
END $$


-- --- ARAÇ PROCEDURES ---

CREATE PROCEDURE autocare_AraclarHepsi()
BEGIN
    SELECT 
        a.arac_id AS ID,
        a.musteri_id AS MusteriID,
        CONCAT(m.musteri_ad, ' ', m.musteri_soyad) AS Sahibi,
        a.arac_plaka AS Plaka,
        a.arac_marka AS Marka,
        a.arac_model AS Model,
        a.arac_yil AS Yil,
        a.arac_sasi_no AS SasiNo,
        (SELECT COUNT(*) FROM autocare_servis_islemleri s WHERE s.arac_id = a.arac_id) AS ServisSayisi
    FROM autocare_araclar a
    JOIN autocare_musteriler m ON a.musteri_id = m.musteri_id;
END $$

CREATE PROCEDURE autocare_AracEkle(
    p_id VARCHAR(64),
    p_mid VARCHAR(64),
    p_plaka VARCHAR(20),
    p_marka VARCHAR(50),
    p_model VARCHAR(50),
    p_yil INT,
    p_sasi VARCHAR(50)
)
BEGIN
    INSERT INTO autocare_araclar(arac_id, musteri_id, arac_plaka, arac_marka, arac_model, arac_yil, arac_sasi_no)
    VALUES (p_id, p_mid, p_plaka, p_marka, p_model, p_yil, p_sasi);
END $$

CREATE PROCEDURE autocare_AracGuncelle(
    p_id VARCHAR(64),
    p_mid VARCHAR(64),
    p_plaka VARCHAR(20),
    p_marka VARCHAR(50),
    p_model VARCHAR(50),
    p_yil INT,
    p_sasi VARCHAR(50)
)
BEGIN
    UPDATE autocare_araclar
    SET musteri_id = p_mid,
        arac_plaka = p_plaka,
        arac_marka = p_marka,
        arac_model = p_model,
        arac_yil = p_yil,
        arac_sasi_no = p_sasi
    WHERE arac_id = p_id;
END $$

CREATE PROCEDURE autocare_AracSil(p_id VARCHAR(64))
BEGIN
    DELETE FROM autocare_araclar WHERE arac_id = p_id;
END $$

CREATE PROCEDURE autocare_AracBul(p_filtre VARCHAR(64))
BEGIN
    SELECT 
        a.arac_id AS ID,
        a.musteri_id AS MusteriID,
        CONCAT(m.musteri_ad, ' ', m.musteri_soyad) AS Sahibi,
        a.arac_plaka AS Plaka,
        a.arac_marka AS Marka,
        a.arac_model AS Model,
        a.arac_yil AS Yil,
        a.arac_sasi_no AS SasiNo,
        (SELECT COUNT(*) FROM autocare_servis_islemleri s WHERE s.arac_id = a.arac_id) AS ServisSayisi
    FROM autocare_araclar a
    JOIN autocare_musteriler m ON a.musteri_id = m.musteri_id
    WHERE a.arac_plaka LIKE CONCAT('%', p_filtre, '%')
       OR a.arac_marka LIKE CONCAT('%', p_filtre, '%')
       OR a.arac_model LIKE CONCAT('%', p_filtre, '%')
       OR a.arac_sasi_no LIKE CONCAT('%', p_filtre, '%')
       OR CONCAT(m.musteri_ad, ' ', m.musteri_soyad) LIKE CONCAT('%', p_filtre, '%');
END $$


-- --- HİZMET/ÜRÜN PROCEDURES ---

CREATE PROCEDURE autocare_HizmetlerHepsi()
BEGIN
    SELECT 
        hizmet_id AS ID,
        hizmet_ad AS Adi,
        hizmet_kategori AS Kategori,
        hizmet_fiyat AS Fiyat,
        hizmet_stok AS Stok,
        hizmet_birim AS Birim,
        hizmet_detay AS Detay
    FROM autocare_hizmetler;
END $$

CREATE PROCEDURE autocare_HizmetEkle(
    p_id VARCHAR(64),
    p_ad VARCHAR(250),
    p_kategori VARCHAR(250),
    p_fiyat FLOAT,
    p_stok FLOAT,
    p_birim VARCHAR(16),
    p_detay VARCHAR(250)
)
BEGIN
    INSERT INTO autocare_hizmetler(hizmet_id, hizmet_ad, hizmet_kategori, hizmet_fiyat, hizmet_stok, hizmet_birim, hizmet_detay)
    VALUES (p_id, p_ad, p_kategori, p_fiyat, p_stok, p_birim, p_detay);
END $$

CREATE PROCEDURE autocare_HizmetGuncelle(
    p_id VARCHAR(64),
    p_ad VARCHAR(250),
    p_kategori VARCHAR(250),
    p_fiyat FLOAT,
    p_stok FLOAT,
    p_birim VARCHAR(16),
    p_detay VARCHAR(250)
)
BEGIN
    UPDATE autocare_hizmetler
    SET hizmet_ad = p_ad,
        hizmet_kategori = p_kategori,
        hizmet_fiyat = p_fiyat,
        hizmet_stok = p_stok,
        hizmet_birim = p_birim,
        hizmet_detay = p_detay
    WHERE hizmet_id = p_id;
END $$

CREATE PROCEDURE autocare_HizmetSil(p_id VARCHAR(64))
BEGIN
    DELETE FROM autocare_hizmetler WHERE hizmet_id = p_id;
END $$

CREATE PROCEDURE autocare_HizmetBul(p_filtre VARCHAR(64))
BEGIN
    SELECT 
        hizmet_id AS ID,
        hizmet_ad AS Adi,
        hizmet_kategori AS Kategori,
        hizmet_fiyat AS Fiyat,
        hizmet_stok AS Stok,
        hizmet_birim AS Birim,
        hizmet_detay AS Detay
    FROM autocare_hizmetler
    WHERE hizmet_ad LIKE CONCAT('%', p_filtre, '%')
       OR hizmet_kategori LIKE CONCAT('%', p_filtre, '%')
       OR hizmet_detay LIKE CONCAT('%', p_filtre, '%');
END $$


-- --- İŞLEM PROCEDURES ---

CREATE PROCEDURE autocare_IslemlerHepsi()
BEGIN
    SELECT 
        s.islem_id AS ID,
        s.arac_id AS AracID,
        s.hizmet_id AS HizmetID,
        s.islem_tarih AS Tarih,
        s.islem_fiyat AS Fiyat
    FROM autocare_servis_islemleri s;
END $$

CREATE PROCEDURE autocare_IslemEkle(
    p_id VARCHAR(64),
    p_aid VARCHAR(64),
    p_hid VARCHAR(64),
    p_tarih DATETIME,
    p_fiyat FLOAT
)
BEGIN
    INSERT INTO autocare_servis_islemleri(islem_id, arac_id, hizmet_id, islem_tarih, islem_fiyat)
    VALUES (p_id, p_aid, p_hid, p_tarih, p_fiyat);
END $$

CREATE PROCEDURE autocare_IslemGuncelle(
    p_id VARCHAR(64),
    p_aid VARCHAR(64),
    p_hid VARCHAR(64),
    p_tarih DATETIME,
    p_fiyat FLOAT
)
BEGIN
    UPDATE autocare_servis_islemleri
    SET arac_id = p_aid,
        hizmet_id = p_hid,
        islem_tarih = p_tarih,
        islem_fiyat = p_fiyat
    WHERE islem_id = p_id;
END $$

CREATE PROCEDURE autocare_IslemSil(p_id VARCHAR(64))
BEGIN
    DELETE FROM autocare_servis_islemleri WHERE islem_id = p_id;
END $$

CREATE PROCEDURE autocare_IslemBul(p_filtre VARCHAR(64))
BEGIN
    SELECT 
        s.islem_id AS ID,
        s.arac_id AS AracID,
        s.hizmet_id AS HizmetID,
        a.arac_plaka AS Plaka,
        CONCAT(a.arac_marka, ' ', a.arac_model) AS Arac,
        h.hizmet_ad AS Hizmet,
        s.islem_tarih AS Tarih,
        s.islem_fiyat AS Fiyat
    FROM autocare_servis_islemleri s
    JOIN autocare_araclar a ON s.arac_id = a.arac_id
    JOIN autocare_hizmetler h ON s.hizmet_id = h.hizmet_id
    WHERE a.arac_plaka LIKE CONCAT('%', p_filtre, '%')
       OR a.arac_marka LIKE CONCAT('%', p_filtre, '%')
       OR a.arac_model LIKE CONCAT('%', p_filtre, '%')
       OR h.hizmet_ad LIKE CONCAT('%', p_filtre, '%');
END $$

CREATE PROCEDURE autocare_IslemDetay()
BEGIN
    SELECT 
        s.islem_id AS Islem_ID,
        a.arac_id AS Arac_ID,
        h.hizmet_id AS Hizmet_ID,
        m.musteri_id AS Musteri_ID,
        CONCAT(m.musteri_ad, ' ', m.musteri_soyad) AS Musteri_Ad_Soyad,
        a.arac_plaka AS Plaka,
        CONCAT(a.arac_marka, ' ', a.arac_model) AS Arac,
        h.hizmet_ad AS Uygulanan_Hizmet,
        h.hizmet_kategori AS Kategori,
        s.islem_fiyat AS Tutar,
        s.islem_tarih AS Tarih
    FROM autocare_servis_islemleri s
    JOIN autocare_araclar a ON s.arac_id = a.arac_id
    JOIN autocare_musteriler m ON a.musteri_id = m.musteri_id
    JOIN autocare_hizmetler h ON s.hizmet_id = h.hizmet_id
    ORDER BY s.islem_tarih DESC;
END $$


-- --- ÖDEME PROCEDURES ---

CREATE PROCEDURE autocare_OdemelerHepsi()
BEGIN
    SELECT 
        odeme_id AS ID,
        musteri_id AS MusteriID,
        odeme_tarih AS Tarih,
        odeme_tutar AS Tutar,
        odeme_tur AS Tur,
        odeme_aciklama AS Aciklama
    FROM autocare_odemeler;
END $$

CREATE PROCEDURE autocare_OdemeEkle(
    p_id VARCHAR(64),
    p_mid VARCHAR(64),
    p_tarih DATETIME,
    p_tutar FLOAT,
    p_tur VARCHAR(25),
    p_aciklama VARCHAR(250)
)
BEGIN
    INSERT INTO autocare_odemeler(odeme_id, musteri_id, odeme_tarih, odeme_tutar, odeme_tur, odeme_aciklama)
    VALUES (p_id, p_mid, p_tarih, p_tutar, p_tur, p_aciklama);
END $$

CREATE PROCEDURE autocare_OdemeGuncelle(
    p_id VARCHAR(64),
    p_mid VARCHAR(64),
    p_tarih DATETIME,
    p_tutar FLOAT,
    p_tur VARCHAR(25),
    p_aciklama VARCHAR(250)
)
BEGIN
    UPDATE autocare_odemeler
    SET musteri_id = p_mid,
        odeme_tarih = p_tarih,
        odeme_tutar = p_tutar,
        odeme_tur = p_tur,
        odeme_aciklama = p_aciklama
    WHERE odeme_id = p_id;
END $$

CREATE PROCEDURE autocare_OdemeSil(p_id VARCHAR(64))
BEGIN
    DELETE FROM autocare_odemeler WHERE odeme_id = p_id;
END $$

CREATE PROCEDURE autocare_OdemeDetay()
BEGIN
    SELECT 
        o.odeme_id AS Odeme_ID,
        o.musteri_id AS Musteri_ID,
        CONCAT(m.musteri_ad, ' ', m.musteri_soyad) AS Musteri_Ad_Soyad,
        o.odeme_tarih AS Tarih,
        o.odeme_tutar AS Odeme_Tutari,
        o.odeme_tur AS Odeme_Turu,
        o.odeme_aciklama AS Aciklama
    FROM autocare_odemeler o
    JOIN autocare_musteriler m ON o.musteri_id = m.musteri_id
    ORDER BY o.odeme_tarih DESC;
END $$

CREATE PROCEDURE autocare_OdemeBul(p_filtre VARCHAR(64))
BEGIN
    SELECT 
        o.odeme_id AS Odeme_ID,
        o.musteri_id AS Musteri_ID,
        CONCAT(m.musteri_ad, ' ', m.musteri_soyad) AS Musteri_Ad_Soyad,
        o.odeme_tarih AS Tarih,
        o.odeme_tutar AS Odeme_Tutari,
        o.odeme_tur AS Odeme_Turu,
        o.odeme_aciklama AS Aciklama
    FROM autocare_odemeler o
    JOIN autocare_musteriler m ON o.musteri_id = m.musteri_id
    WHERE CONCAT(m.musteri_ad, ' ', m.musteri_soyad) LIKE CONCAT('%', p_filtre, '%')
       OR o.odeme_tur LIKE CONCAT('%', p_filtre, '%')
       OR o.odeme_aciklama LIKE CONCAT('%', p_filtre, '%');
END $$


-- --- GENEL İSTATİSTİK PROCEDURES ---

CREATE PROCEDURE autocare_SatislarToplam()
BEGIN
    SELECT IFNULL(SUM(islem_fiyat), 0) AS ToplamSatis FROM autocare_servis_islemleri;
END $$

CREATE PROCEDURE autocare_OdemelerToplam()
BEGIN
    SELECT IFNULL(SUM(odeme_tutar), 0) AS ToplamOdeme FROM autocare_odemeler;
END $$

DELIMITER ;


-- =========================================================================
-- 4. TEST VERİLERİNİN EKLENMESİ (MOCK DATA)
-- =========================================================================

-- Test Müşterileri
INSERT INTO autocare_musteriler (musteri_id, musteri_ad, musteri_soyad, musteri_tel, musteri_mail, musteri_adres) VALUES
('m1', 'Ahmet', 'Yılmaz', '0555-123-4567', 'ahmet.yilmaz@mail.com', 'İstanbul Kadıköy Yeni Mah. No:5'),
('m2', 'Mehmet', 'Kaya', '0532-987-6543', 'mehmet.kaya@mail.com', 'Ankara Çankaya Atatürk Bulvarı No:45'),
('m3', 'Ayşe', 'Demir', '0544-246-8135', 'ayse.demir@mail.com', 'İzmir Bornova Ege Sok. No:12'),
('m4', 'Oya', 'Öztürk', '0505-135-7924', 'oya.ozturk@mail.com', 'Bartın Merkez Çarşı Mah. No:34');

-- Test Araçları
INSERT INTO autocare_araclar (arac_id, musteri_id, arac_plaka, arac_marka, arac_model, arac_yil, arac_sasi_no) VALUES
('a1', 'm1', '34ABC123', 'Toyota', 'Corolla', 2018, 'SASI1234567890ABC'),
('a2', 'm1', '34XYZ789', 'Ford', 'Focus', 2020, 'SASI0987654321XYZ'),
('a3', 'm2', '06DEF456', 'BMW', '320i', 2017, 'SASI5555555555BMW'),
('a4', 'm3', '35GHI321', 'Renault', 'Clio', 2019, 'SASI4444444444REN'),
('a5', 'm4', '74BAR100', 'Volkswagen', 'Golf', 2021, 'SASI7777777777VW');

-- Test Hizmet ve Ürünleri (Birim = 'Adet' olanlar stoklu yedek parçadır)
INSERT INTO autocare_hizmetler (hizmet_id, hizmet_ad, hizmet_kategori, hizmet_fiyat, hizmet_stok, hizmet_birim, hizmet_detay) VALUES
('h1', 'Periyodik Bakım (Yağ + Filtreler)', 'Periyodik Bakım', 2500, 100, 'Saat', 'Motor yağı ve tüm filtrelerin değişimi (İşçilik dahil)'),
('h2', 'Ön Fren Balatası Değişimi', 'Fren Sistemi', 1200, 5, 'Adet', 'Ön fren balatalarının yenisi ile değiştirilmesi (Stoklu yedek parça)'),
('h3', 'Buji Değişimi (4 Adet)', 'Motor', 800, 15, 'Adet', 'Ateşleme bujilerinin değişimi'),
('h4', 'Detaylı İç/Dış Temizlik & Pasta Cila', 'Estetik', 3000, 50, 'Saat', 'Detaylı temizlik ve boya koruma uygulaması'),
('h5', 'Motor Arıza Tespiti (Diagnostik)', 'Elektrik & Elektronik', 500, 200, 'Saat', 'Bilgisayarlı arıza teşhis cihazı ile kontrol');

-- Test Servis İşlemleri
INSERT INTO autocare_servis_islemleri (islem_id, arac_id, hizmet_id, islem_tarih, islem_fiyat) VALUES
('s1', 'a1', 'h1', '2026-05-10 10:30:00', 2500),
('s2', 'a1', 'h2', '2026-05-10 11:30:00', 1200),
('s3', 'a3', 'h1', '2026-05-12 14:00:00', 2500),
('s4', 'a4', 'h5', '2026-05-14 09:15:00', 500),
('s5', 'a5', 'h4', '2026-05-15 16:30:00', 3000);

-- Test Ödemeleri
INSERT INTO autocare_odemeler (odeme_id, musteri_id, odeme_tarih, odeme_tutar, odeme_tur, odeme_aciklama) VALUES
('o1', 'm1', '2026-05-10 12:00:00', 3000, 'Kredi Kartı', 'Servis ücreti kısmi ödemesi'),
('o2', 'm1', '2026-05-11 09:30:00', 700, 'Nakit', 'Kalan bakiye kapatma'),
('o3', 'm2', '2026-05-12 15:00:00', 2000, 'Banka Havalesi', 'Ahmet Kaya adına havale'),
('o4', 'm3', '2026-05-14 10:00:00', 500, 'Nakit', 'Arıza tespit ödemesi'),
('o5', 'm4', '2026-05-15 17:00:00', 3000, 'Kredi Kartı', 'Pasta cila ödemesi peşin');


-- =========================================================================
-- 5. KULLANICI TANIMLI FONKSİYONLAR (USER DEFINED FUNCTIONS)
-- =========================================================================
-- NOT: Bu bölüm dosyanın en sonundadır. Eğer local sunucuda SUPER privilege/binary logging 
-- hatası oluşursa, bu kısım dışındaki tüm tablolar, tetikleyiciler ve saklı yordamlar 
-- kurulmuş olacaktır. Uygulama, fonksiyonsuz çalışabilecek şekilde tasarlanmıştır.

DELIMITER $$

-- Fonksiyon 1: Müşteri Bakiyesi Hesaplama
CREATE FUNCTION fn_MusteriBakiye(p_musteri_id VARCHAR(64))
RETURNS FLOAT
DETERMINISTIC
BEGIN
    DECLARE total_borc FLOAT DEFAULT 0;
    DECLARE total_odeme FLOAT DEFAULT 0;
    
    SELECT IFNULL(SUM(islem_fiyat), 0) INTO total_borc
    FROM autocare_servis_islemleri s
    JOIN autocare_araclar a ON s.arac_id = a.arac_id
    WHERE a.musteri_id = p_musteri_id;
    
    SELECT IFNULL(SUM(odeme_tutar), 0) INTO total_odeme
    FROM autocare_odemeler
    WHERE musteri_id = p_musteri_id;
    
    RETURN total_odeme - total_borc;
END $$

-- Fonksiyon 2: Aracın Toplam Servis Sayısı
CREATE FUNCTION fn_AracServisSayisi(p_arac_id VARCHAR(64))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE service_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO service_count
    FROM autocare_servis_islemleri
    WHERE arac_id = p_arac_id;
    
    RETURN service_count;
END $$

DELIMITER ;
