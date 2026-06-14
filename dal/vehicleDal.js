const db = require('./db');

class VehicleDal {
  // 1. Tüm araçları listele
  async getAll() {
    const [rows] = await db.query('CALL autocare_AraclarHepsi()');
    return rows[0];
  }

  // 2. Araç ekle
  async create(id, musteriId, plaka, marka, model, yil, sasiNo) {
    const [result] = await db.query('CALL autocare_AracEkle(?, ?, ?, ?, ?, ?, ?)', [
      id, musteriId, plaka, marka, model, yil, sasiNo
    ]);
    return result;
  }

  // 3. Araç güncelle
  async update(id, musteriId, plaka, marka, model, yil, sasiNo) {
    const [result] = await db.query('CALL autocare_AracGuncelle(?, ?, ?, ?, ?, ?, ?)', [
      id, musteriId, plaka, marka, model, yil, sasiNo
    ]);
    return result;
  }

  // 4. Araç sil
  async delete(id) {
    const [result] = await db.query('CALL autocare_AracSil(?)', [id]);
    return result;
  }

  // 5. Araç bul
  async find(filtre) {
    const [rows] = await db.query('CALL autocare_AracBul(?)', [filtre]);
    return rows[0];
  }
}

module.exports = new VehicleDal();
