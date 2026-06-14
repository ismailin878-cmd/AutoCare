const express = require('express');
const path = require('path');
require('dotenv').config();

const customerBl = require('./bl/customerBl');
const vehicleBl = require('./bl/vehicleBl');
const serviceJobBl = require('./bl/serviceJobBl');
const paymentBl = require('./bl/paymentBl');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// =========================================================================
// MÜŞTERİ API UÇ NOKTALARI (CUSTOMER API ENDPOINTS)
// =========================================================================

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await customerBl.getAllCustomers();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { ad, soyad, tel, mail, adres } = req.body;
    const newCustomer = await customerBl.addCustomer(ad, soyad, tel, mail, adres);
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ad, soyad, tel, mail, adres } = req.body;
    const updated = await customerBl.updateCustomer(id, ad, soyad, tel, mail, adres);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await customerBl.deleteCustomer(id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/customers/search', async (req, res) => {
  try {
    const { q } = req.query;
    const results = await customerBl.searchCustomers(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// ARAÇ API UÇ NOKTALARI (VEHICLE API ENDPOINTS)
// =========================================================================

app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await vehicleBl.getAllVehicles();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const { musteriId, plaka, marka, model, yil, sasiNo } = req.body;
    const newVehicle = await vehicleBl.addVehicle(musteriId, plaka, marka, model, yil, sasiNo);
    res.status(201).json(newVehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { musteriId, plaka, marka, model, yil, sasiNo } = req.body;
    const updated = await vehicleBl.updateVehicle(id, musteriId, plaka, marka, model, yil, sasiNo);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await vehicleBl.deleteVehicle(id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/vehicles/search', async (req, res) => {
  try {
    const { q } = req.query;
    const results = await vehicleBl.searchVehicles(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// HİZMET API UÇ NOKTALARI (SERVICES API ENDPOINTS)
// =========================================================================

app.get('/api/services', async (req, res) => {
  try {
    const services = await serviceJobBl.getAllServices();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const { ad, kategori, fiyat, stok, birim, detay } = req.body;
    const newService = await serviceJobBl.addService(ad, kategori, fiyat, stok, birim, detay);
    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ad, kategori, fiyat, stok, birim, detay } = req.body;
    const updated = await serviceJobBl.updateService(id, ad, kategori, fiyat, stok, birim, detay);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await serviceJobBl.deleteService(id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/services/search', async (req, res) => {
  try {
    const { q } = req.query;
    const results = await serviceJobBl.searchServices(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// SERVİS İŞLEM API UÇ NOKTALARI (JOBS API ENDPOINTS)
// =========================================================================

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await serviceJobBl.getAllJobs();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { aracId, hizmetId, tarih, fiyat } = req.body;
    const newJob = await serviceJobBl.addJob(aracId, hizmetId, tarih, fiyat);
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { aracId, hizmetId, tarih, fiyat } = req.body;
    const updated = await serviceJobBl.updateJob(id, aracId, hizmetId, tarih, fiyat);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await serviceJobBl.deleteJob(id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/jobs/search', async (req, res) => {
  try {
    const { q } = req.query;
    const results = await serviceJobBl.searchJobs(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// ÖDEME API UÇ NOKTALARI (PAYMENTS API ENDPOINTS)
// =========================================================================

app.get('/api/payments', async (req, res) => {
  try {
    const payments = await paymentBl.getAllPayments();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const { musteriId, tarih, tutar, tur, aciklama } = req.body;
    const newPayment = await paymentBl.addPayment(musteriId, tarih, tutar, tur, aciklama);
    res.status(201).json(newPayment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { musteriId, tarih, tutar, tur, aciklama } = req.body;
    const updated = await paymentBl.updatePayment(id, musteriId, tarih, tutar, tur, aciklama);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await paymentBl.deletePayment(id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/payments/search', async (req, res) => {
  try {
    const { q } = req.query;
    const results = await paymentBl.searchPayments(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// DASHBOARD API UÇ NOKTASI (DASHBOARD API ENDPOINT)
// =========================================================================

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const salesStats = await serviceJobBl.getDashboardStats();
    const paymentStats = await paymentBl.getDashboardStats();
    res.json({
      totalSales: salesStats.totalSales,
      totalPayments: paymentStats.totalPayments,
      netBalance: paymentStats.totalPayments - salesStats.totalSales
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
