# AutoCare Araç Bakım ve Oto Servis Otomasyonu Final Ödevi Raporu

**Ad SOYAD:** [Adınızı Buraya Yazınız]  
**Öğrenci No:** [Öğrenci Numaranızı Buraya Yazınız]  

**BİLGİSAYAR TEKNOLOJİSİ VE BİLİŞİM SİSTEMLERİ BÖLÜMÜ**  
**BTS304 - Veritabanı Yönetim Sistemleri II**  
**Final Ödevi**  

**2026 - Bartın**

---

## ADIM-1: Senaryo

Bu uygulama, **AutoCare** isimli modern bir araç bakım ve oto servis işletmesinin dijital altyapısını optimize etmek, operasyonel süreçlerini hızlandırmak ve veritabanı yönetimini kurumsal standartlara taşımak amacıyla hazırlanmıştır. İşletmenin günlük işleyişinde müşteri kayıtlarının düzgün tutulması, bu müşterilere ait araç bilgilerinin sisteme hatasız işlenmesi ve veri bütünlüğünün korunması hayati önem taşımaktadır.

### İşleyiş Senaryosu ve Kurallar:
1. **Müşteri Kaydı Olmadan İşlem Yapılamaz:** Veritabanına kayıtlı olmayan müşterilere herhangi bir araç tanımlanamaz, servis işlemi yapılamaz veya ödeme alınamaz.
2. **Araç Kaydı Olmadan Servis Yapılamaz:** Servise gelen her aracın plakası, markası, modeli, yılı ve şasi numarası veritabanına kaydedilir. Servis işlemleri (yağ değişimi, fren balatası değişimi vb.) sadece kayıtlı araçlar üzerinden gerçekleştirilir.
3. **Ürün ve Hizmet Tanımları:** Serviste verilen tüm hizmetler ve satılan yedek parçalar (yağ filtresi, buji vb.) birim fiyatları, kategorileri ve stok durumları ile birlikte sisteme işlenir.
4. **Stoklu Parçalar için Kontrol:** Yedek parça niteliğindeki ürünler (Birimi 'Adet' olanlar) için veritabanında stok takibi yapılır. Stokta bulunmayan bir parça servis işlemine eklenmek istendiğinde veritabanı tetikleyicisi (Trigger) işlemi engeller ve hata fırlatır.
5. **Otomatik Stok Düşümü:** Bir servis işlemi başarıyla eklendiğinde ve bu işlemde yedek parça kullanıldıysa, ilgili parçanın stok miktarı otomatik olarak 1 adet azaltılır. Servis işlemi silindiğinde ise stok otomatik olarak 1 adet geri iade edilir.
6. **Müşteri Bakiyesi:** Müşterinin güncel borç/alacak durumu veritabanında tutulan bir fonksiyon vasıtasıyla dinamik olarak hesaplanır. Müşteri Bakiyesi = (Toplam Yapılan Ödemeler) - (Müşterinin Araçlarına Yapılan Servis İşlemleri Toplamı) şeklinde hesaplanır. Bakiye eksi ise müşterinin borcu vardır, artı ise fazla ödeme yapmıştır.
7. **Ödeme Türleri:** Ödemeler sadece `Nakit`, `Kredi Kartı` ve `Banka Havalesi` şeklinde kabul edilmektedir.

---

## ADIM-2: Varlıklar, Nitelikler, İlişkiler ve ER Diagramı

### Varlıklar (Entities) ve Alanlar (Attributes)
* **Müşteriler (`autocare_musteriler`):** `musteri_id` (PK), `musteri_ad`, `musteri_soyad`, `musteri_tel`, `musteri_mail`, `musteri_adres`.
* **Araçlar (`autocare_araclar`):** `arac_id` (PK), `musteri_id` (FK), `arac_plaka` (Unique), `arac_marka`, `arac_model`, `arac_yil`, `arac_sasi_no` (Unique).
* **Hizmetler/Ürünler (`autocare_hizmetler`):** `hizmet_id` (PK), `hizmet_ad`, `hizmet_kategori`, `hizmet_fiyat`, `hizmet_stok`, `hizmet_birim`, `hizmet_detay`.
* **Servis İşlemleri (`autocare_servis_islemleri`):** `islem_id` (PK), `arac_id` (FK), `hizmet_id` (FK), `islem_tarih`, `islem_fiyat`.
* **Ödemeler (`autocare_odemeler`):** `odeme_id` (PK), `musteri_id` (FK), `odeme_tarih`, `odeme_tutar`, `odeme_tur`, `odeme_aciklama`.

### Varlıklar Arası İlişkiler
1. **Müşteri - Araç (1:N):** Bir müşterinin birden fazla aracı olabilir. Bir araç sadece bir müşteriye aittir.
2. **Araç - Servis İşlemi (1:N):** Bir araca birden fazla servis işlemi uygulanabilir. Bir servis kaydı sadece tek bir araca aittir.
3. **Hizmet - Servis İşlemi (1:N):** Bir hizmet/ürün birden fazla servis işleminde yer alabilir.
4. **Müşteri - Ödeme (1:N):** Bir müşteri birden fazla ödeme yapabilir. Bir ödeme kaydı sadece bir müşteriye aittir.

### İlişkisel (Mantıksal) Şema
* **autocare_musteriler** = {<u>musteri_id</u>, musteri_ad, musteri_soyad, musteri_tel, musteri_mail, musteri_adres}
* **autocare_araclar** = {<u>arac_id</u>, *musteri_id*, arac_plaka, arac_marka, arac_model, arac_yil, arac_sasi_no}
* **autocare_hizmetler** = {<u>hizmet_id</u>, hizmet_ad, hizmet_kategori, hizmet_fiyat, hizmet_stok, hizmet_birim, hizmet_detay}
* **autocare_servis_islemleri** = {<u>islem_id</u>, *arac_id*, *hizmet_id*, islem_tarih, islem_fiyat}
* **autocare_odemeler** = {<u>odeme_id</u>, *musteri_id*, odeme_tarih, odeme_tutar, odeme_tur, odeme_aciklama}

---

## ADIM-3: Fiziksel Tasarım (MySQL)

### Veritabanı ve Tablo Oluşturma SQL Kodları

```sql
DROP DATABASE IF EXISTS autocare_db;
CREATE DATABASE autocare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE autocare_db;

-- Müşteriler Tablosu
CREATE TABLE autocare_musteriler (
    musteri_id VARCHAR(64) NOT NULL,
    musteri_ad VARCHAR(64) NOT NULL,
    musteri_soyad VARCHAR(64) NOT NULL,
    musteri_tel VARCHAR(25) NOT NULL,
    musteri_mail VARCHAR(250) NOT NULL,
    musteri_adres VARCHAR(250) NOT NULL,
    PRIMARY KEY (musteri_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    FOREIGN KEY (musteri_id) REFERENCES autocare_musteriler(musteri_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hizmetler/Ürünler Tablosu
CREATE TABLE autocare_hizmetler (
    hizmet_id VARCHAR(64) NOT NULL,
    hizmet_ad VARCHAR(250) NOT NULL,
    hizmet_kategori VARCHAR(250) NOT NULL,
    hizmet_fiyat FLOAT NOT NULL,
    hizmet_stok FLOAT NOT NULL,
    hizmet_birim VARCHAR(16) NOT NULL,
    hizmet_detay VARCHAR(250) NOT NULL,
    PRIMARY KEY (hizmet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Servis İşlemleri Tablosu
CREATE TABLE autocare_servis_islemleri (
    islem_id VARCHAR(64) NOT NULL,
    arac_id VARCHAR(64) NOT NULL,
    hizmet_id VARCHAR(64) NOT NULL,
    islem_tarih DATETIME NOT NULL,
    islem_fiyat FLOAT NOT NULL,
    PRIMARY KEY (islem_id),
    FOREIGN KEY (arac_id) REFERENCES autocare_araclar(arac_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (hizmet_id) REFERENCES autocare_hizmetler(hizmet_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ödemeler Tablosu
CREATE TABLE autocare_odemeler (
    odeme_id VARCHAR(64) NOT NULL,
    musteri_id VARCHAR(64) NOT NULL,
    odeme_tarih DATETIME NOT NULL,
    odeme_tutar FLOAT NOT NULL,
    odeme_tur VARCHAR(25) NOT NULL,
    odeme_aciklama VARCHAR(250) NOT NULL,
    PRIMARY KEY (odeme_id),
    FOREIGN KEY (musteri_id) REFERENCES autocare_musteriler(musteri_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Tetikleyiciler (Triggers)

```sql
DELIMITER //

-- 1. Stok Kontrolü Tetikleyicisi (Önce)
CREATE TRIGGER tg_stok_kontrol
BEFORE INSERT ON autocare_servis_islemleri FOR EACH ROW
BEGIN
    DECLARE current_stok FLOAT;
    DECLARE item_birim VARCHAR(16);
    DECLARE hatamesaj VARCHAR(250);
    
    SELECT hizmet_stok, hizmet_birim INTO current_stok, item_birim
    FROM autocare_hizmetler
    WHERE hizmet_id = NEW.hizmet_id;
    
    IF (item_birim = 'Adet' AND current_stok < 1) THEN
        SET hatamesaj = CONCAT('HATA: Secilen yedek parca stokta kalmamistir! Mevcut Stok: ', IFNULL(current_stok, 0));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = hatamesaj;
    END IF;
END; //

-- 2. Stok Azaltma Tetikleyicisi (Sonra)
CREATE TRIGGER tg_stok_azalt
AFTER INSERT ON autocare_servis_islemleri FOR EACH ROW
BEGIN
    DECLARE item_birim VARCHAR(16);
    
    SELECT hizmet_birim INTO item_birim
    FROM autocare_hizmetler
    WHERE hizmet_id = NEW.hizmet_id;
    
    IF (item_birim = 'Adet') THEN
        UPDATE autocare_hizmetler
        SET hizmet_stok = hizmet_stok - 1
        WHERE hizmet_id = NEW.hizmet_id;
    END IF;
END; //

-- 3. Stok Geri Yükleme Tetikleyicisi (İptal Durumunda)
CREATE TRIGGER tg_stok_arttir
AFTER DELETE ON autocare_servis_islemleri FOR EACH ROW
BEGIN
    DECLARE item_birim VARCHAR(16);
    
    SELECT hizmet_birim INTO item_birim
    FROM autocare_hizmetler
    WHERE hizmet_id = OLD.hizmet_id;
    
    IF (item_birim = 'Adet') THEN
        UPDATE autocare_hizmetler
        SET hizmet_stok = hizmet_stok + 1
        WHERE hizmet_id = OLD.hizmet_id;
    END IF;
END; //

DELIMITER ;
```

### Kullanıcı Tanımlı Fonksiyonlar (Functions)

```sql
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
```

### Saklı Yordamlar (Stored Procedures)

```sql
DELIMITER $$

-- --- MÜŞTERİ YORDAMLARI ---
CREATE PROCEDURE autocare_MusterilerHepsi()
BEGIN
    SELECT musteri_id AS ID, musteri_ad AS Adı, musteri_soyad AS Soyadı, musteri_tel AS Telefon, musteri_mail AS Mail, musteri_adres AS Adres, fn_MusteriBakiye(musteri_id) AS Bakiye FROM autocare_musteriler;
END $$

CREATE PROCEDURE autocare_MusteriEkle(p_id VARCHAR(64), p_ad VARCHAR(64), p_soy VARCHAR(64), p_tel VARCHAR(25), p_mail VARCHAR(250), p_adr VARCHAR(250))
BEGIN
    INSERT INTO autocare_musteriler VALUES (p_id, p_ad, p_soy, p_tel, p_mail, p_adr);
END $$

CREATE PROCEDURE autocare_MusteriGuncelle(p_id VARCHAR(64), p_ad VARCHAR(64), p_soy VARCHAR(64), p_tel VARCHAR(25), p_mail VARCHAR(250), p_adr VARCHAR(250))
BEGIN
    UPDATE autocare_musteriler SET musteri_ad = p_ad, musteri_soyad = p_soy, musteri_tel = p_tel, musteri_mail = p_mail, musteri_adres = p_adr WHERE musteri_id = p_id;
END $$

CREATE PROCEDURE autocare_MusteriSil(p_id VARCHAR(64))
BEGIN
    DELETE FROM autocare_musteriler WHERE musteri_id = p_id;
END $$

CREATE PROCEDURE autocare_MusteriBul(p_filtre VARCHAR(64))
BEGIN
    SELECT musteri_id AS ID, musteri_ad AS Adı, musteri_soyad AS Soyadı, musteri_tel AS Telefon, musteri_mail AS Mail, musteri_adres AS Adres, fn_MusteriBakiye(musteri_id) AS Bakiye FROM autocare_musteriler
    WHERE musteri_ad LIKE CONCAT('%', p_filtre, '%') OR musteri_soyad LIKE CONCAT('%', p_filtre, '%');
END $$

-- --- ARAÇ YORDAMLARI ---
CREATE PROCEDURE autocare_AraclarHepsi()
BEGIN
    SELECT a.arac_id AS ID, a.musteri_id AS MusteriID, CONCAT(m.musteri_ad, ' ', m.musteri_soyad) AS Sahibi, a.arac_plaka AS Plaka, a.arac_marka AS Marka, a.arac_model AS Model, a.arac_yil AS Yıl, a.arac_sasi_no AS SasiNo, fn_AracServisSayisi(a.arac_id) AS ServisSayisi FROM autocare_araclar a JOIN autocare_musteriler m ON a.musteri_id = m.musteri_id;
END $$

CREATE PROCEDURE autocare_AracEkle(p_id VARCHAR(64), p_mid VARCHAR(64), p_plaka VARCHAR(20), p_marka VARCHAR(50), p_model VARCHAR(50), p_yil INT, p_sasi VARCHAR(50))
BEGIN
    INSERT INTO autocare_araclar VALUES (p_id, p_mid, p_plaka, p_marka, p_model, p_yil, p_sasi);
END $$

CREATE PROCEDURE autocare_AracGuncelle(p_id VARCHAR(64), p_mid VARCHAR(64), p_plaka VARCHAR(20), p_marka VARCHAR(50), p_model VARCHAR(50), p_yil INT, p_sasi VARCHAR(50))
BEGIN
    UPDATE autocare_araclar SET musteri_id = p_mid, arac_plaka = p_plaka, arac_marka = p_marka, arac_model = p_model, arac_yil = p_yil, arac_sasi_no = p_sasi WHERE arac_id = p_id;
END $$

CREATE PROCEDURE autocare_AracSil(p_id VARCHAR(64))
BEGIN
    DELETE FROM autocare_araclar WHERE arac_id = p_id;
END $$

CREATE PROCEDURE autocare_AracBul(p_filtre VARCHAR(64))
BEGIN
    SELECT a.arac_id AS ID, a.musteri_id AS MusteriID, CONCAT(m.musteri_ad, ' ', m.musteri_soyad) AS Sahibi, a.arac_plaka AS Plaka, a.arac_marka AS Marka, a.arac_model AS Model, a.arac_yil AS Yıl, a.arac_sasi_no AS SasiNo, fn_AracServisSayisi(a.arac_id) AS ServisSayisi FROM autocare_araclar a JOIN autocare_musteriler m ON a.musteri_id = m.musteri_id WHERE a.arac_plaka LIKE CONCAT('%', p_filtre, '%') OR a.arac_marka LIKE CONCAT('%', p_filtre, '%');
END $$

-- --- HİZMET YORDAMLARI ---
CREATE PROCEDURE autocare_HizmetlerHepsi()
BEGIN
    SELECT hizmet_id AS ID, hizmet_ad AS Adı, hizmet_kategori AS Kategori, hizmet_fiyat AS Fiyat, hizmet_stok AS Stok, hizmet_birim AS Birim, hizmet_detay AS Detay FROM autocare_hizmetler;
END $$

CREATE PROCEDURE autocare_HizmetEkle(p_id VARCHAR(64), p_ad VARCHAR(250), p_kategori VARCHAR(250), p_fiyat FLOAT, p_stok FLOAT, p_birim VARCHAR(16), p_detay VARCHAR(250))
BEGIN
    INSERT INTO autocare_hizmetler VALUES (p_id, p_ad, p_kategori, p_fiyat, p_stok, p_birim, p_detay);
END $$

CREATE PROCEDURE autocare_HizmetGuncelle(p_id VARCHAR(64), p_ad VARCHAR(250), p_kategori VARCHAR(250), p_fiyat FLOAT, p_stok FLOAT, p_birim VARCHAR(16), p_detay VARCHAR(250))
BEGIN
    UPDATE autocare_hizmetler SET hizmet_ad = p_ad, hizmet_kategori = p_kategori, hizmet_fiyat = p_fiyat, hizmet_stok = p_stok, hizmet_birim = p_birim, hizmet_detay = p_detay WHERE hizmet_id = p_id;
END $$

CREATE PROCEDURE autocare_HizmetSil(p_id VARCHAR(64))
BEGIN
    DELETE FROM autocare_hizmetler WHERE hizmet_id = p_id;
END $$

CREATE PROCEDURE autocare_HizmetBul(p_filtre VARCHAR(64))
BEGIN
    SELECT * FROM autocare_hizmetler WHERE hizmet_ad LIKE CONCAT('%', p_filtre, '%') OR hizmet_kategori LIKE CONCAT('%', p_filtre, '%');
END $$

-- --- İŞLEM YORDAMLARI ---
CREATE PROCEDURE autocare_IslemlerHepsi()
BEGIN
    SELECT islem_id AS ID, arac_id AS AracID, hizmet_id AS HizmetID, islem_tarih AS Tarih, islem_fiyat AS Fiyat FROM autocare_servis_islemleri;
END $$

CREATE PROCEDURE autocare_IslemEkle(p_id VARCHAR(64), p_aid VARCHAR(64), p_hid VARCHAR(64), p_tarih DATETIME, p_fiyat FLOAT)
BEGIN
    INSERT INTO autocare_servis_islemleri VALUES (p_id, p_aid, p_hid, p_tarih, p_fiyat);
END $$

CREATE PROCEDURE autocare_IslemGuncelle(p_id VARCHAR(64), p_aid VARCHAR(64), p_hid VARCHAR(64), p_tarih DATETIME, p_fiyat FLOAT)
BEGIN
    UPDATE autocare_servis_islemleri SET arac_id = p_aid, hizmet_id = p_hid, islem_tarih = p_tarih, islem_fiyat = p_fiyat WHERE islem_id = p_id;
END $$

CREATE PROCEDURE autocare_IslemSil(p_id VARCHAR(64))
BEGIN
    DELETE FROM autocare_servis_islemleri WHERE islem_id = p_id;
END $$

CREATE PROCEDURE autocare_IslemBul(p_filtre VARCHAR(64))
BEGIN
    SELECT s.islem_id AS ID, s.arac_id AS AracID, s.hizmet_id AS HizmetID, a.arac_plaka AS Plaka, CONCAT(a.arac_marka, ' ', a.arac_model) AS Arac, h.hizmet_ad AS Hizmet, s.islem_tarih AS Tarih, s.islem_fiyat AS Fiyat FROM autocare_servis_islemleri s JOIN autocare_araclar a ON s.arac_id = a.arac_id JOIN autocare_hizmetler h ON s.hizmet_id = h.hizmet_id
    WHERE a.arac_plaka LIKE CONCAT('%', p_filtre, '%') OR h.hizmet_ad LIKE CONCAT('%', p_filtre, '%');
END $$

CREATE PROCEDURE autocare_IslemDetay()
BEGIN
    SELECT s.islem_id AS `İşlem ID`, a.arac_id AS `Araç ID`, h.hizmet_id AS `Hizmet ID`, m.musteri_id AS `Müşteri ID`, CONCAT(m.musteri_ad, ' ', m.musteri_soyad) AS `Müşteri Ad Soyad`, a.arac_plaka AS `Plaka`, CONCAT(a.arac_marka, ' ', a.arac_model) AS `Araç`, h.hizmet_ad AS `Uygulanan Hizmet`, h.hizmet_kategori AS `Kategori`, s.islem_fiyat AS `Tutar`, s.islem_tarih AS `Tarih`
    FROM autocare_servis_islemleri s JOIN autocare_araclar a ON s.arac_id = a.arac_id JOIN autocare_musteriler m ON a.musteri_id = m.musteri_id JOIN autocare_hizmetler h ON s.hizmet_id = h.hizmet_id ORDER BY s.islem_tarih DESC;
END $$

-- --- ÖDEME YORDAMLARI ---
CREATE PROCEDURE autocare_OdemelerHepsi()
BEGIN
    SELECT odeme_id AS ID, musteri_id AS MusteriID, odeme_tarih AS Tarih, odeme_tutar AS Tutar, odeme_tur AS Tur, odeme_aciklama AS Aciklama FROM autocare_odemeler;
END $$

CREATE PROCEDURE autocare_OdemeEkle(p_id VARCHAR(64), p_mid VARCHAR(64), p_tarih DATETIME, p_tutar FLOAT, p_tur VARCHAR(25), p_aciklama VARCHAR(250))
BEGIN
    INSERT INTO autocare_odemeler VALUES (p_id, p_mid, p_tarih, p_tutar, p_tur, p_aciklama);
END $$

CREATE PROCEDURE autocare_OdemeGuncelle(p_id VARCHAR(64), p_mid VARCHAR(64), p_tarih DATETIME, p_tutar FLOAT, p_tur VARCHAR(25), p_aciklama VARCHAR(250))
BEGIN
    UPDATE autocare_odemeler SET musteri_id = p_mid, odeme_tarih = p_tarih, odeme_tutar = p_tutar, odeme_tur = p_tur, odeme_aciklama = p_aciklama WHERE odeme_id = p_id;
END $$

CREATE PROCEDURE autocare_OdemeSil(p_id VARCHAR(64))
BEGIN
    DELETE FROM autocare_odemeler WHERE odeme_id = p_id;
END $$

CREATE PROCEDURE autocare_OdemeDetay()
BEGIN
    SELECT o.odeme_id AS `Ödeme ID`, o.musteri_id AS `Müşteri ID`, CONCAT(m.musteri_ad, ' ', m.musteri_soyad) AS `Müşteri Ad Soyad`, o.odeme_tarih AS `Tarih`, o.odeme_tutar AS `Ödeme Tutarı`, o.odeme_tur AS `Ödeme Türü`, o.odeme_aciklama AS `Açıklama` FROM autocare_odemeler o JOIN autocare_musteriler m ON o.musteri_id = m.musteri_id ORDER BY o.odeme_tarih DESC;
END $$

CREATE PROCEDURE autocare_OdemeBul(p_filtre VARCHAR(64))
BEGIN
    SELECT o.odeme_id AS `Ödeme ID`, o.musteri_id AS `Müşteri ID`, CONCAT(m.musteri_ad, ' ', m.musteri_soyad) AS `Müşteri Ad Soyad`, o.odeme_tarih AS `Tarih`, o.odeme_tutar AS `Ödeme Tutarı`, o.odeme_tur AS `Ödeme Türü`, o.odeme_aciklama AS `Açıklama` FROM autocare_odemeler o JOIN autocare_musteriler m ON o.musteri_id = m.musteri_id WHERE CONCAT(m.musteri_ad, ' ', m.musteri_soyad) LIKE CONCAT('%', p_filtre, '%') OR o.odeme_tur LIKE CONCAT('%', p_filtre, '%');
END $$

-- --- GENEL İSTATİSTİKLER ---
CREATE PROCEDURE autocare_SatislarToplam()
BEGIN
    SELECT IFNULL(SUM(islem_fiyat), 0) AS ToplamSatis FROM autocare_servis_islemleri;
END $$

CREATE PROCEDURE autocare_OdemelerToplam()
BEGIN
    SELECT IFNULL(SUM(odeme_tutar), 0) AS ToplamOdeme FROM autocare_odemeler;
END $$

DELIMITER ;
```

---

## ADIM-4: Uygulama Geliştirme ve Mimari Tasarım

Uygulama, dersin gereksinimlerine uygun olarak **N-Katmanlı Mimari (N-Tier Architecture)** prensiplerine göre yapılandırılmıştır.

```
AutoCare Web Application
 ├── public/                    <-- SUNUM KATMANI (Presentation Layer)
 │    ├── index.html            <-- Arayüz HTML
 │    ├── css/style.css         <-- Premium Stil Sayfası (Glassmorphic CSS)
 │    └── js/app.js             <-- İstemci Tarafı AJAX ve UI Yönetimi
 ├── bl/                        <-- İŞ MANTIĞI KATMANI (Business Layer)
 │    ├── customerBl.js
 │    ├── vehicleBl.js
 │    ├── serviceJobBl.js
 │    └── paymentBl.js
 ├── dal/                       <-- VERİ ERİŞİM KATMANI (Data Access Layer)
 │    ├── db.js                 <-- MySQL Bağlantı Havuzu
 │    ├── customerDal.js
 │    ├── vehicleDal.js
 │    ├── serviceJobDal.js
 │    └── paymentDal.js
 ├── .env                       <-- Veritabanı Şifre/Konfigürasyon Dosyası
 ├── package.json               <-- Node.js Proje Bağımlılıkları
 └── app.js                     <-- Sunucu Giriş Noktası & Rotalar (Express.js)
```

### Veri Tabanı Erişim Kurallarının Uygulanması:
* Sunucu veya business kodlarında **KESİNLİKLE** hiçbir raw SQL ifadesi (`SELECT, INSERT, UPDATE, DELETE`) yazılmamıştır.
* Veritabanı işlemleri sadece `dal/` klasöründeki Data Access Layer dosyalarından, veritabanına yüklenen Stored Procedure'ler `CALL` edilerek gerçekleştirilmiştir.
* Hata yönetimleri tamamen veritabanından fırlatılan MySQL hatalarını (örneğin stok bittiğinde `tg_stok_kontrol` tetikleyicisinin fırlattığı hata) yakalayarak arayüze şık bir uyarı penceresi olarak yansıtır.

### GitHub Bağlantısı:
Proje GitHub Repository Bağlantısı: [https://github.com/[KullaniciAdiniz]/AutoCareCenter](https://github.com/[KullaniciAdiniz]/AutoCareCenter)

---

## ADIM-5: Uygulama Ekran Görüntüleri ve Anlatım Rehberi

### Ekran Görüntüleri Yer Tutucuları
*(Lütfen uygulamanızı lokalde çalıştırdıktan sonra aşağıdaki başlıklara ait ekran görüntülerini kırparak ilgili yerlere ekleyiniz.)*

1. **Dashboard Ekranı:** Genel ciro, tahsil edilen toplam tutar ve alacak bakiye grafiklerini içeren ana sayfa görüntüsü.
2. **Müşteri Yönetim Paneli:** Yeni müşteri ekleme modali açıkken ve bakiye sütunundaki borçlu (kırmızı) / alacaklı (yeşil) durumlarını gösteren tablo görüntüsü.
3. **Araç Kayıt Ekranı:** Müşteri seçimi yapılarak yeni araç ekleme modali ve araçların toplam servis görme sayılarını gösteren liste görüntüsü.
4. **Tetikleyici Stok Kontrol Testi:** Stok miktarı 0 olan bir yedek parçayı (Örn: Ön Fren Balatası) bir araca uygulamaya çalıştığınızda, veritabanındaki `tg_stok_kontrol` trigger'ının çalışmasıyla ekranda beliren *"HATA: Secilen yedek parca stokta kalmamistir!"* uyarı penceresinin görüntüsü.
5. **Ödemeler Ekranı:** Müşterilerden Nakit veya Kredi Kartı ile tahsil edilen tutarların listelendiği finansal takip tablosu görüntüsü.

### Video Sunumu İçerik Planı (5-10 Dakika)
* **Dakika 0-2 (Giriş):** Senaryonun, N-Katmanlı mimarinin (DAL, BLL, UI) ve Stored Procedure kullanım kurallarının açıklanması.
* **Dakika 2-4 (Veri Girişleri):** Arayüzden yeni bir müşteri ekleme, ona araç tanımlama ve araç listesindeki dinamik alanların gösterimi.
* **Dakika 4-7 (Tetikleyiciler ve Fonksiyonlar):**
  * Bir yedek parça satışı gerçekleştirerek stok miktarının nasıl 1 azaldığının gösterilmesi (`tg_stok_azalt` testi).
  * Stokta kalmayan bir parçayı eklemeye çalışarak trigger hatasının ekrana yansımasının gösterilmesi (`tg_stok_kontrol` testi).
  * Servis kaydını silerek stoğun nasıl 1 geri arttığının gösterilmesi (`tg_stok_arttir` testi).
  * Müşteri bakiye alanındaki borç/alacak değerinin fonksiyon aracılığıyla nasıl dinamik olarak değiştiğinin canlı gösterimi.
* **Dakika 7-10 (Kod İncelemesi):** DAL dosyalarında hiçbir SQL sorgusu (SELECT/INSERT vb.) olmadığının, sadece `CALL` komutlarıyla Stored Procedure çalıştırıldığının kod editörü üzerinden ispatlanması.
