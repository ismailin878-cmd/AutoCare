const db = require('./db');

class CustomerDal {
  // 1. Tüm müşterileri getir (Select)
  async getAll() {
    const [rows] = await db.query('CALL autocare_MusterilerHepsi()');
    return rows[0]; // Stored procedure results are in the first element of the returned array
  }

  // 2. Müşteri ekle (Insert)
  async create(id, ad, soyad, tel, mail, adres) {
    const [result] = await db.query('CALL autocare_MusteriEkle(?, ?, ?, ?, ?, ?)', [
      id, ad, soyad, tel, mail, adres
    ]);
    return result;
  }

  // 3. Müşteri güncelle (Update)
  async update(id, ad, soyad, tel, mail, adres) {
    const [result] = await db.query('CALL autocare_MusteriGuncelle(?, ?, ?, ?, ?, ?)', [
      id, ad, soyad, tel, mail, adres
    ]);
    return result;
  }

  // 4. Müşteri sil (Delete)
  async delete(id) {
    const [result] = await db.query('CALL autocare_MusteriSil(?)', [id]);
    return result;
  }

  // 5. Müşteri bul (Search/Filter)
  async find(filtre) {
    const [rows] = await db.query('CALL autocare_MusteriBul(?)', [filtre]);
    return rows[0];
  }
}

module.exports = new CustomerDal();
