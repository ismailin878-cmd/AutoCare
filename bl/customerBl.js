const customerDal = require('../dal/customerDal');

class CustomerBl {
  async getAllCustomers() {
    return await customerDal.getAll();
  }

  async addCustomer(ad, soyad, tel, mail, adres) {
    if (!ad || !soyad || !tel) {
      throw new Error('İsim, soyisim ve telefon alanları zorunludur.');
    }
    
    // Generate sequential ID like m1, m2, m3...
    const customers = await customerDal.getAll();
    let max = 0;
    if (customers && Array.isArray(customers)) {
      customers.forEach(c => {
        const match = c.ID.match(/^m(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > max) max = num;
        }
      });
    }
    const id = `m${max + 1}`;
    
    await customerDal.create(id, ad, soyad, tel, mail || '', adres || '');
    return { id, ad, soyad, tel, mail, adres };
  }

  async updateCustomer(id, ad, soyad, tel, mail, adres) {
    if (!id || !ad || !soyad || !tel) {
      throw new Error('Müşteri ID, isim, soyisim ve telefon alanları zorunludur.');
    }
    await customerDal.update(id, ad, soyad, tel, mail || '', adres || '');
    return { id, ad, soyad, tel, mail, adres };
  }

  async deleteCustomer(id) {
    if (!id) {
      throw new Error('Müşteri ID zorunludur.');
    }
    await customerDal.delete(id);
    return { success: true, id };
  }

  async searchCustomers(filtre) {
    if (!filtre) {
      return await this.getAllCustomers();
    }
    return await customerDal.find(filtre);
  }
}

module.exports = new CustomerBl();
