const serviceJobDal = require('../dal/serviceJobDal');

class ServiceJobBl {
  // =========================================================================
  // HİZMETLER (SERVICES)
  // =========================================================================

  async getAllServices() {
    return await serviceJobDal.getAllServices();
  }

  async addService(ad, kategori, fiyat, stok, birim, detay) {
    if (!ad || !kategori || fiyat === undefined || stok === undefined || !birim) {
      throw new Error('Hizmet adı, kategori, fiyat, stok ve birim alanları zorunludur.');
    }
    
    // Generate sequential ID like h1, h2, h3...
    const services = await serviceJobDal.getAllServices();
    let max = 0;
    if (services && Array.isArray(services)) {
      services.forEach(s => {
        const match = s.ID.match(/^h(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > max) max = num;
        }
      });
    }
    const id = `h${max + 1}`;
    
    await serviceJobDal.createService(id, ad, kategori, parseFloat(fiyat), parseFloat(stok), birim, detay || '');
    return { id, ad, kategori, fiyat, stok, birim, detay };
  }

  async updateService(id, ad, kategori, fiyat, stok, birim, detay) {
    if (!id || !ad || !kategori || fiyat === undefined || stok === undefined || !birim) {
      throw new Error('Hizmet ID, adı, kategori, fiyat, stok ve birim alanları zorunludur.');
    }
    await serviceJobDal.updateService(id, ad, kategori, parseFloat(fiyat), parseFloat(stok), birim, detay || '');
    return { id, ad, kategori, fiyat, stok, birim, detay };
  }

  async deleteService(id) {
    if (!id) {
      throw new Error('Hizmet ID zorunludur.');
    }
    await serviceJobDal.deleteService(id);
    return { success: true, id };
  }

  async searchServices(filtre) {
    if (!filtre) {
      return await this.getAllServices();
    }
    return await serviceJobDal.findService(filtre);
  }

  // =========================================================================
  // SERVİS İŞLEMLERİ (JOBS / SALES)
  // =========================================================================

  async getAllJobs() {
    return await serviceJobDal.getJobDetails(); // Prefer details (joined query) for table view
  }

  async addJob(aracId, hizmetId, tarih, fiyat) {
    if (!aracId || !hizmetId || !tarih || fiyat === undefined) {
      throw new Error('Araç, hizmet, tarih ve fiyat alanları zorunludur.');
    }
    
    // Generate sequential ID like s1, s2, s3...
    const jobs = await serviceJobDal.getAllJobs();
    let max = 0;
    if (jobs && Array.isArray(jobs)) {
      jobs.forEach(j => {
        const match = j.ID.match(/^s(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > max) max = num;
        }
      });
    }
    const id = `s${max + 1}`;
    
    // Note: Database triggers (tg_stok_kontrol) will check stock and (tg_stok_azalt) will decrease stock.
    // If the database trigger fails (e.g. stock <= 0 for parts), it will throw an SQL error, 
    // which will bubble up here and be returned to the client as an error message!
    await serviceJobDal.createJob(id, aracId, hizmetId, tarih, parseFloat(fiyat));
    return { id, aracId, hizmetId, tarih, fiyat };
  }

  async updateJob(id, aracId, hizmetId, tarih, fiyat) {
    if (!id || !aracId || !hizmetId || !tarih || fiyat === undefined) {
      throw new Error('İşlem ID, araç, hizmet, tarih ve fiyat alanları zorunludur.');
    }
    await serviceJobDal.updateJob(id, aracId, hizmetId, tarih, parseFloat(fiyat));
    return { id, aracId, hizmetId, tarih, fiyat };
  }

  async deleteJob(id) {
    if (!id) {
      throw new Error('İşlem ID zorunludur.');
    }
    // Database trigger (tg_stok_arttir) will restore stock.
    await serviceJobDal.deleteJob(id);
    return { success: true, id };
  }

  async searchJobs(filtre) {
    if (!filtre) {
      return await this.getAllJobs();
    }
    return await serviceJobDal.findJob(filtre);
  }

  async getDashboardStats() {
    const totalSalesRow = await serviceJobDal.getTotalSales();
    return {
      totalSales: totalSalesRow.ToplamSatis || 0
    };
  }
}

module.exports = new ServiceJobBl();
