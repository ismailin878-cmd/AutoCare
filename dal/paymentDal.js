const db = require('./db');

class PaymentDal {
  // 1. Tüm ödemeleri listele
  async getAll() {
    const [rows] = await db.query('CALL autocare_OdemelerHepsi()');
    return rows[0];
  }

  // 2. Ödeme ekle
  async create(id, musteriId, tarih, tutar, tur, aciklama) {
    const [result] = await db.query('CALL autocare_OdemeEkle(?, ?, ?, ?, ?, ?)', [
      id, musteriId, tarih, tutar, tur, aciklama
    ]);
    return result;
  }

  // 3. Ödeme güncelle
  async update(id, musteriId, tarih, tutar, tur, aciklama) {
    const [result] = await db.query('CALL autocare_OdemeGuncelle(?, ?, ?, ?, ?, ?)', [
      id, musteriId, tarih, tutar, tur, aciklama
    ]);
    return result;
  }

  // 4. Ödeme sil
  async delete(id) {
    const [result] = await db.query('CALL autocare_OdemeSil(?)', [id]);
    return result;
  }

  // 5. Ödeme detaylarını listele (Joinli Müşteri Ad Soyad ile)
  async getPaymentDetails() {
    const [rows] = await db.query('CALL autocare_OdemeDetay()');
    return rows[0];
  }

  // 6. Ödeme bul
  async find(filtre) {
    const [rows] = await db.query('CALL autocare_OdemeBul(?)', [filtre]);
    return rows[0];
  }

  // 7. Toplam ödeme tutarını getir
  async getTotalPayments() {
    const [rows] = await db.query('CALL autocare_OdemelerToplam()');
    return rows[0][0]; // Returns single row with ToplamOdeme
  }
}

module.exports = new PaymentDal();
