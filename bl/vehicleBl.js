const vehicleDal = require('../dal/vehicleDal');

class VehicleBl {
  async getAllVehicles() {
    return await vehicleDal.getAll();
  }

  async addVehicle(musteriId, plaka, marka, model, yil, sasiNo) {
    if (!musteriId || !plaka || !marka || !model || !yil) {
      throw new Error('Müşteri, plaka, marka, model ve yıl alanları zorunludur.');
    }
    const cleanPlaka = plaka.replace(/\s+/g, '').toUpperCase();
    // Generate sequential ID like a1, a2, a3...
    const vehicles = await vehicleDal.getAll();
    let max = 0;
    if (vehicles && Array.isArray(vehicles)) {
      vehicles.forEach(v => {
        const match = v.ID.match(/^a(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > max) max = num;
        }
      });
    }
    const id = `a${max + 1}`;
    
    await vehicleDal.create(id, musteriId, cleanPlaka, marka, model, parseInt(yil), sasiNo || '');
    return { id, musteriId, plaka: cleanPlaka, marka, model, yil, sasiNo };
  }

  async updateVehicle(id, musteriId, plaka, marka, model, yil, sasiNo) {
    if (!id || !musteriId || !plaka || !marka || !model || !yil) {
      throw new Error('Araç ID, müşteri, plaka, marka, model ve yıl alanları zorunludur.');
    }
    const cleanPlaka = plaka.replace(/\s+/g, '').toUpperCase();
    await vehicleDal.update(id, musteriId, cleanPlaka, marka, model, parseInt(yil), sasiNo || '');
    return { id, musteriId, plaka: cleanPlaka, marka, model, yil, sasiNo };
  }

  async deleteVehicle(id) {
    if (!id) {
      throw new Error('Araç ID zorunludur.');
    }
    await vehicleDal.delete(id);
    return { success: true, id };
  }

  async searchVehicles(filtre) {
    if (!filtre) {
      return await this.getAllVehicles();
    }
    return await vehicleDal.find(filtre);
  }
}

module.exports = new VehicleBl();
