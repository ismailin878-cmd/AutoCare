const paymentDal = require('../dal/paymentDal');

class PaymentBl {
  async getAllPayments() {
    return await paymentDal.getPaymentDetails(); // Prefer details (joined query) for table view
  }

  async addPayment(musteriId, tarih, tutar, tur, aciklama) {
    if (!musteriId || !tarih || tutar === undefined || !tur) {
      throw new Error('Müşteri, tarih, tutar ve ödeme türü alanları zorunludur.');
    }
    
    // Generate sequential ID like o1, o2, o3...
    const payments = await paymentDal.getAll();
    let max = 0;
    if (payments && Array.isArray(payments)) {
      payments.forEach(p => {
        const match = p.ID.match(/^o(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > max) max = num;
        }
      });
    }
    const id = `o${max + 1}`;
    
    await paymentDal.create(id, musteriId, tarih, parseFloat(tutar), tur, aciklama || '');
    return { id, musteriId, tarih, tutar, tur, aciklama };
  }

  async updatePayment(id, musteriId, tarih, tutar, tur, aciklama) {
    if (!id || !musteriId || !tarih || tutar === undefined || !tur) {
      throw new Error('Ödeme ID, müşteri, tarih, tutar ve ödeme türü alanları zorunludur.');
    }
    await paymentDal.update(id, musteriId, tarih, parseFloat(tutar), tur, aciklama || '');
    return { id, musteriId, tarih, tutar, tur, aciklama };
  }

  async deletePayment(id) {
    if (!id) {
      throw new Error('Ödeme ID zorunludur.');
    }
    await paymentDal.delete(id);
    return { success: true, id };
  }

  async searchPayments(filtre) {
    if (!filtre) {
      return await this.getAllPayments();
    }
    return await paymentDal.find(filtre);
  }

  async getDashboardStats() {
    const totalPaymentsRow = await paymentDal.getTotalPayments();
    return {
      totalPayments: totalPaymentsRow.ToplamOdeme || 0
    };
  }
}

module.exports = new PaymentBl();
