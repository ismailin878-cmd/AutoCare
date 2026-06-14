const db = require('./db');

class ServiceJobDal {
  // =========================================================================
  // HİZMETLER VE ÜRÜNLER (autocare_hizmetler)
  // =========================================================================

  async getAllServices() {
    const [rows] = await db.query('CALL autocare_HizmetlerHepsi()');
    return rows[0];
  }

  async createService(id, ad, kategori, fiyat, stok, birim, detay) {
    const [result] = await db.query('CALL autocare_HizmetEkle(?, ?, ?, ?, ?, ?, ?)', [
      id, ad, kategori, fiyat, stok, birim, detay
    ]);
    return result;
  }

  async updateService(id, ad, kategori, fiyat, stok, birim, detay) {
    const [result] = await db.query('CALL autocare_HizmetGuncelle(?, ?, ?, ?, ?, ?, ?)', [
      id, ad, kategori, fiyat, stok, birim, detay
    ]);
    return result;
  }

  async deleteService(id) {
    const [result] = await db.query('CALL autocare_HizmetSil(?)', [id]);
    return result;
  }

  async findService(filtre) {
    const [rows] = await db.query('CALL autocare_HizmetBul(?)', [filtre]);
    return rows[0];
  }

  // =========================================================================
  // SERVİS İŞLEMLERİ (autocare_servis_islemleri)
  // =========================================================================

  async getAllJobs() {
    const [rows] = await db.query('CALL autocare_IslemlerHepsi()');
    return rows[0];
  }

  async createJob(id, aracId, hizmetId, tarih, fiyat) {
    const [result] = await db.query('CALL autocare_IslemEkle(?, ?, ?, ?, ?)', [
      id, aracId, hizmetId, tarih, fiyat
    ]);
    return result;
  }

  async updateJob(id, aracId, hizmetId, tarih, fiyat) {
    const [result] = await db.query('CALL autocare_IslemGuncelle(?, ?, ?, ?, ?)', [
      id, aracId, hizmetId, tarih, fiyat
    ]);
    return result;
  }

  async deleteJob(id) {
    const [result] = await db.query('CALL autocare_IslemSil(?)', [id]);
    return result;
  }

  async findJob(filtre) {
    const [rows] = await db.query('CALL autocare_IslemBul(?)', [filtre]);
    return rows[0];
  }

  async getJobDetails() {
    const [rows] = await db.query('CALL autocare_IslemDetay()');
    return rows[0];
  }

  async getTotalSales() {
    const [rows] = await db.query('CALL autocare_SatislarToplam()');
    return rows[0][0]; // Returns single row with ToplamSatis
  }
}

module.exports = new ServiceJobDal();
