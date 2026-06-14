// API endpoints
const API_URL = '/api';

// Global state
let currentTab = 'dashboard';
let customersList = [];
let vehiclesList = [];
let servicesList = [];

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadAllData();
  setupFormSubmissions();
  setupSearchInputs();
});

// 1. Navigation setup
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const tabTitle = document.getElementById('tab-title');
  const tabSubtitle = document.getElementById('tab-subtitle');

  const tabMeta = {
    dashboard: { title: 'Dashboard', subtitle: 'İşletmenizin genel durumu ve finansal özetler' },
    customers: { title: 'Müşteri Yönetimi', subtitle: 'Müşteri kayıtları, adres bilgileri ve bakiye takibi' },
    vehicles: { title: 'Araç Yönetimi', subtitle: 'Müşteri araç plakaları, modelleri ve servis geçmişleri' },
    services: { title: 'Hizmetler & Yedek Parçalar', subtitle: 'Sunulan bakım hizmetleri ve yedek parça stok yönetimi' },
    jobs: { title: 'Servis İşlemleri', subtitle: 'Yapılan bakım, onarım, parça değişim kayıtları ve faturalandırma' },
    payments: { title: 'Ödeme Tahsilatları', subtitle: 'Müşterilerden alınan ödemeler ve finansal girdiler' }
  };

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      currentTab = tabId;

      // Active button state
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show/hide tab contents
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `tab-${tabId}`) {
          pane.classList.add('active');
        }
      });

      // Update header details
      if (tabMeta[tabId]) {
        tabTitle.textContent = tabMeta[tabId].title;
        tabSubtitle.textContent = tabMeta[tabId].subtitle;
      }

      // Refresh data on tab switch
      loadTabContent(tabId);
    });
  });
}

// 2. Load tab-specific content
function loadTabContent(tabId) {
  switch (tabId) {
    case 'dashboard':
      loadDashboardStats();
      break;
    case 'customers':
      loadCustomers();
      break;
    case 'vehicles':
      loadVehicles();
      break;
    case 'services':
      loadServices();
      break;
    case 'jobs':
      loadJobs();
      break;
    case 'payments':
      loadPayments();
      break;
  }
}

function loadAllData() {
  loadDashboardStats();
  // Pre-load lookup lists
  fetchCustomersList();
  fetchVehiclesList();
  fetchServicesList();
}

// 3. Load stats
async function loadDashboardStats() {
  try {
    const res = await fetch(`${API_URL}/dashboard/stats`);
    const data = await res.json();
    
    document.getElementById('stat-sales').textContent = `₺${parseFloat(data.totalSales || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    document.getElementById('stat-payments').textContent = `₺${parseFloat(data.totalPayments || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    
    const balance = data.netBalance || 0;
    const balanceEl = document.getElementById('stat-balance');
    balanceEl.textContent = `₺${Math.abs(balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    
    // Color code balance: Green if balanced or positive, Red/Yellow if outstanding debt (negative net balance)
    if (balance < 0) {
      balanceEl.className = 'stat-value text-danger'; // customer owes money
    } else if (balance > 0) {
      balanceEl.className = 'stat-value text-success'; // customer overpaid
    } else {
      balanceEl.className = 'stat-value';
    }
  } catch (err) {
    console.error('Stats loading error:', err);
  }
}

// 4. Customers CRUD
async function loadCustomers(searchQuery = '') {
  try {
    const url = searchQuery ? `${API_URL}/customers/search?q=${encodeURIComponent(searchQuery)}` : `${API_URL}/customers`;
    const res = await fetch(url);
    const data = await res.json();
    
    const tbody = document.getElementById('customer-table-body');
    tbody.innerHTML = '';
    
    data.forEach(cust => {
      const bakiye = parseFloat(cust.Bakiye || 0);
      let bakiyeClass = 'badge badge-success';
      let bakiyeText = `₺${bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
      
      if (bakiye < 0) {
        bakiyeClass = 'badge badge-danger';
        bakiyeText = `₺${Math.abs(bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (Borç)`;
      } else if (bakiye === 0) {
        bakiyeClass = 'badge badge-warning';
        bakiyeText = '₺0,00';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cust.ID}</td>
        <td><strong>${cust.Adi} ${cust.Soyadi}</strong></td>
        <td>${cust.Telefon}</td>
        <td>${cust.Mail || '-'}</td>
        <td>${cust.Adres || '-'}</td>
        <td><span class="${bakiyeClass}">${bakiyeText}</span></td>
        <td class="actions-col">
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="editCustomer('${cust.ID}', '${cust.Adi}', '${cust.Soyadi}', '${cust.Telefon}', '${cust.Mail}', \`${cust.Adres.replace(/'/g, "\\'")}\`)"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${cust.ID}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Customer load error:', err);
  }
}

function openCustomerModal() {
  document.getElementById('customer-id').value = '';
  document.getElementById('customer-form').reset();
  document.getElementById('customer-modal-title').textContent = 'Yeni Müşteri Ekle';
  openModal('customer-modal');
}

function editCustomer(id, ad, soyad, tel, mail, adres) {
  document.getElementById('customer-id').value = id;
  document.getElementById('customer-ad').value = ad;
  document.getElementById('customer-soyad').value = soyad;
  document.getElementById('customer-tel').value = tel;
  document.getElementById('customer-mail').value = mail === 'null' ? '' : mail;
  document.getElementById('customer-adres').value = adres === 'null' ? '' : adres;
  
  document.getElementById('customer-modal-title').textContent = 'Müşteriyi Düzenle';
  openModal('customer-modal');
}

async function deleteCustomer(id) {
  if (confirm('Bu müşteriyi ve ona bağlı tüm araçları, servis kayıtlarını silmek istediğinize emin misiniz?')) {
    try {
      const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      loadCustomers();
      loadDashboardStats();
      fetchCustomersList(); // update lookups
    } catch (err) {
      alert(`Müşteri silinirken hata oluştu: ${err.message}`);
    }
  }
}

// 5. Vehicles CRUD
async function loadVehicles(searchQuery = '') {
  try {
    const url = searchQuery ? `${API_URL}/vehicles/search?q=${encodeURIComponent(searchQuery)}` : `${API_URL}/vehicles`;
    const res = await fetch(url);
    const data = await res.json();
    
    const tbody = document.getElementById('vehicle-table-body');
    tbody.innerHTML = '';
    
    data.forEach(veh => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${veh.ID}</td>
        <td>${veh.Sahibi}</td>
        <td><span class="badge badge-success">${veh.Plaka}</span></td>
        <td>${veh.Marka}</td>
        <td>${veh.Model}</td>
        <td>${veh.Yil}</td>
        <td><code>${veh.SasiNo || '-'}</code></td>
        <td><span class="badge badge-warning">${veh.ServisSayisi} Kez</span></td>
        <td class="actions-col">
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="editVehicle('${veh.ID}', '${veh.MusteriID}', '${veh.Plaka}', '${veh.Marka}', '${veh.Model}', ${veh.Yil}, '${veh.SasiNo}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteVehicle('${veh.ID}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Vehicle load error:', err);
  }
}

function openVehicleModal() {
  document.getElementById('vehicle-id').value = '';
  document.getElementById('vehicle-form').reset();
  document.getElementById('vehicle-modal-title').textContent = 'Yeni Araç Ekle';
  
  // Populate customer select
  const select = document.getElementById('vehicle-musteri');
  select.innerHTML = '<option value="" disabled selected>Araç Sahibi Seçiniz...</option>';
  customersList.forEach(cust => {
    select.innerHTML += `<option value="${cust.ID}">${cust.Adi} ${cust.Soyadi} (${cust.Telefon})</option>`;
  });
  
  openModal('vehicle-modal');
}

function editVehicle(id, musteriId, plaka, marka, model, yil, sasiNo) {
  openVehicleModal();
  document.getElementById('vehicle-id').value = id;
  document.getElementById('vehicle-musteri').value = musteriId;
  document.getElementById('vehicle-plaka').value = plaka;
  document.getElementById('vehicle-marka').value = marka;
  document.getElementById('vehicle-model').value = model;
  document.getElementById('vehicle-yil').value = yil;
  document.getElementById('vehicle-sasi').value = sasiNo === 'null' ? '' : sasiNo;
  
  document.getElementById('vehicle-modal-title').textContent = 'Aracı Düzenle';
}

async function deleteVehicle(id) {
  if (confirm('Bu aracı ve buna bağlı tüm servis kayıtlarını silmek istediğinize emin misiniz?')) {
    try {
      const res = await fetch(`${API_URL}/vehicles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      loadVehicles();
      loadDashboardStats();
      fetchVehiclesList();
    } catch (err) {
      alert(`Araç silinirken hata oluştu: ${err.message}`);
    }
  }
}

// 6. Services CRUD
async function loadServices(searchQuery = '') {
  try {
    const url = searchQuery ? `${API_URL}/services/search?q=${encodeURIComponent(searchQuery)}` : `${API_URL}/services`;
    const res = await fetch(url);
    const data = await res.json();
    
    const tbody = document.getElementById('service-table-body');
    tbody.innerHTML = '';
    
    data.forEach(srv => {
      const stok = parseFloat(srv.Stok);
      let stokBadge = `<span class="badge badge-success">${stok} ${srv.Birim}</span>`;
      
      if (srv.Birim === 'Adet') {
        if (stok === 0) {
          stokBadge = `<span class="badge badge-danger">Tükendi</span>`;
        } else if (stok < 3) {
          stokBadge = `<span class="badge badge-warning">${stok} Adet (Kritik)</span>`;
        }
      } else {
        stokBadge = `<span class="badge badge-success">Sınırsız (Hizmet)</span>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${srv.ID}</td>
        <td><strong>${srv.Adi}</strong></td>
        <td>${srv.Kategori}</td>
        <td>₺${parseFloat(srv.Fiyat).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
        <td>${stokBadge}</td>
        <td>${srv.Birim}</td>
        <td>${srv.Detay || '-'}</td>
        <td class="actions-col">
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="editService('${srv.ID}', '${srv.Adi}', '${srv.Kategori}', ${srv.Fiyat}, ${srv.Stok}, '${srv.Birim}', \`${srv.Detay.replace(/'/g, "\\'")}\`)"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteService('${srv.ID}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Service load error:', err);
  }
}

function openServiceModal() {
  document.getElementById('service-id').value = '';
  document.getElementById('service-form').reset();
  document.getElementById('service-modal-title').textContent = 'Yeni Hizmet/Ürün Ekle';
  openModal('service-modal');
}

function editService(id, ad, kategori, fiyat, stok, birim, detay) {
  document.getElementById('service-id').value = id;
  document.getElementById('service-ad').value = ad;
  document.getElementById('service-kategori').value = kategori;
  document.getElementById('service-fiyat').value = fiyat;
  document.getElementById('service-stok').value = stok;
  document.getElementById('service-birim').value = birim;
  document.getElementById('service-detay').value = detay === 'null' ? '' : detay;
  
  document.getElementById('service-modal-title').textContent = 'Hizmeti Düzenle';
  openModal('service-modal');
}

async function deleteService(id) {
  if (confirm('Bu hizmeti silmek istediğinize emin misiniz?')) {
    try {
      const res = await fetch(`${API_URL}/services/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      loadServices();
      fetchServicesList();
    } catch (err) {
      alert(`Hizmet silinirken hata oluştu: ${err.message}`);
    }
  }
}

// 7. Service Operations (Jobs / Sales) CRUD
async function loadJobs(searchQuery = '') {
  try {
    const url = searchQuery ? `${API_URL}/jobs/search?q=${encodeURIComponent(searchQuery)}` : `${API_URL}/jobs`;
    const res = await fetch(url);
    const data = await res.json();
    
    const tbody = document.getElementById('job-table-body');
    tbody.innerHTML = '';
    
    data.forEach(job => {
      const tarihObj = new Date(job.Tarih);
      const tarihStr = tarihObj.toLocaleString('tr-TR');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${job.Islem_ID}</td>
        <td><strong>${job.Musteri_Ad_Soyad}</strong></td>
        <td><span class="badge badge-success">${job.Plaka}</span> ${job.Arac}</td>
        <td>${job.Uygulanan_Hizmet}</td>
        <td>${job.Kategori}</td>
        <td>${tarihStr}</td>
        <td><strong>₺${parseFloat(job.Tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong></td>
        <td class="actions-col">
          <div class="table-actions">
            <button class="btn btn-danger btn-sm" onclick="deleteJob('${job.Islem_ID}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Job load error:', err);
  }
}

function openJobModal() {
  document.getElementById('job-id').value = '';
  document.getElementById('job-form').reset();
  
  // Set current date-time
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('job-tarih').value = now.toISOString().slice(0, 16);
  
  // Populate vehicle select
  const vSelect = document.getElementById('job-arac');
  vSelect.innerHTML = '<option value="" disabled selected>Servis Yapılacak Aracı Seçin...</option>';
  vehiclesList.forEach(veh => {
    vSelect.innerHTML += `<option value="${veh.ID}">${veh.Plaka} - ${veh.Marka} ${veh.Model} (${veh.Sahibi})</option>`;
  });
  
  // Populate services select
  const sSelect = document.getElementById('job-hizmet');
  sSelect.innerHTML = '<option value="" disabled selected>Uygulanacak Hizmet/Ürün Seçin...</option>';
  servicesList.forEach(srv => {
    sSelect.innerHTML += `<option value="${srv.ID}">${srv.Adi} - ₺${parseFloat(srv.Fiyat).toLocaleString('tr-TR')}</option>`;
  });
  
  openModal('job-modal');
}

function updateJobPriceFromService() {
  const serviceId = document.getElementById('job-hizmet').value;
  const service = servicesList.find(s => s.ID === serviceId);
  if (service) {
    document.getElementById('job-fiyat').value = service.Fiyat;
  }
}

async function deleteJob(id) {
  if (confirm('Bu servis kaydını silmek istediğinize emin misiniz? (Yedek parça kullanıldıysa stoklar iade edilecektir.)')) {
    try {
      const res = await fetch(`${API_URL}/jobs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      loadJobs();
      loadDashboardStats();
      fetchServicesList(); // refresh service stock list
    } catch (err) {
      alert(`Servis işlemi silinirken hata oluştu: ${err.message}`);
    }
  }
}

// 8. Payments CRUD
async function loadPayments(searchQuery = '') {
  try {
    const url = searchQuery ? `${API_URL}/payments/search?q=${encodeURIComponent(searchQuery)}` : `${API_URL}/payments`;
    const res = await fetch(url);
    const data = await res.json();
    
    const tbody = document.getElementById('payment-table-body');
    tbody.innerHTML = '';
    
    data.forEach(pay => {
      const tarihObj = new Date(pay.Tarih);
      const tarihStr = tarihObj.toLocaleString('tr-TR');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${pay.Odeme_ID}</td>
        <td><strong>${pay.Musteri_Ad_Soyad}</strong></td>
        <td>${tarihStr}</td>
        <td><span class="badge badge-success">₺${parseFloat(pay.Odeme_Tutari).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span></td>
        <td><i class="fa-solid fa-wallet"></i> ${pay.Odeme_Turu}</td>
        <td>${pay.Aciklama || '-'}</td>
        <td class="actions-col">
          <div class="table-actions">
            <button class="btn btn-danger btn-sm" onclick="deletePayment('${pay.Odeme_ID}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Payment load error:', err);
  }
}

function openPaymentModal() {
  document.getElementById('payment-id').value = '';
  document.getElementById('payment-form').reset();
  
  // Set current date-time
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('payment-tarih').value = now.toISOString().slice(0, 16);
  
  // Populate customer select
  const select = document.getElementById('payment-musteri');
  select.innerHTML = '<option value="" disabled selected>Ödeme Yapan Müşteri Seçiniz...</option>';
  customersList.forEach(cust => {
    select.innerHTML += `<option value="${cust.ID}">${cust.Adi} ${cust.Soyadi} (${cust.Telefon})</option>`;
  });
  
  openModal('payment-modal');
}

async function deletePayment(id) {
  if (confirm('Bu ödeme tahsilat kaydını silmek istediğinize emin misiniz?')) {
    try {
      const res = await fetch(`${API_URL}/payments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      loadPayments();
      loadDashboardStats();
    } catch (err) {
      alert(`Ödeme silinirken hata oluştu: ${err.message}`);
    }
  }
}

// 9. Lookup fetches
async function fetchCustomersList() {
  try {
    const res = await fetch(`${API_URL}/customers`);
    customersList = await res.json();
  } catch (err) {
    console.error(err);
  }
}

async function fetchVehiclesList() {
  try {
    const res = await fetch(`${API_URL}/vehicles`);
    vehiclesList = await res.json();
  } catch (err) {
    console.error(err);
  }
}

async function fetchServicesList() {
  try {
    const res = await fetch(`${API_URL}/services`);
    servicesList = await res.json();
  } catch (err) {
    console.error(err);
  }
}

// 10. Form submissions setup
function setupFormSubmissions() {
  // Customer Form
  document.getElementById('customer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('customer-id').value;
    const ad = document.getElementById('customer-ad').value;
    const soyad = document.getElementById('customer-soyad').value;
    const tel = document.getElementById('customer-tel').value;
    const mail = document.getElementById('customer-mail').value;
    const adres = document.getElementById('customer-adres').value;
    
    const url = id ? `${API_URL}/customers/${id}` : `${API_URL}/customers`;
    const method = id ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad, soyad, tel, mail, adres })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      closeModal('customer-modal');
      loadCustomers();
      fetchCustomersList();
    } catch (err) {
      alert(`Müşteri kaydedilirken hata oluştu: ${err.message}`);
    }
  });

  // Vehicle Form
  document.getElementById('vehicle-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('vehicle-id').value;
    const musteriId = document.getElementById('vehicle-musteri').value;
    const plaka = document.getElementById('vehicle-plaka').value;
    const marka = document.getElementById('vehicle-marka').value;
    const model = document.getElementById('vehicle-model').value;
    const yil = document.getElementById('vehicle-yil').value;
    const sasiNo = document.getElementById('vehicle-sasi').value;
    
    const url = id ? `${API_URL}/vehicles/${id}` : `${API_URL}/vehicles`;
    const method = id ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musteriId, plaka, marka, model, yil, sasiNo })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      closeModal('vehicle-modal');
      loadVehicles();
      fetchVehiclesList();
    } catch (err) {
      alert(`Araç kaydedilirken hata oluştu: ${err.message}`);
    }
  });

  // Service Form
  document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('service-id').value;
    const ad = document.getElementById('service-ad').value;
    const kategori = document.getElementById('service-kategori').value;
    const fiyat = document.getElementById('service-fiyat').value;
    const stok = document.getElementById('service-stok').value;
    const birim = document.getElementById('service-birim').value;
    const detay = document.getElementById('service-detay').value;
    
    const url = id ? `${API_URL}/services/${id}` : `${API_URL}/services`;
    const method = id ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad, kategori, fiyat, stok, birim, detay })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      closeModal('service-modal');
      loadServices();
      fetchServicesList();
    } catch (err) {
      alert(`Hizmet kaydedilirken hata oluştu: ${err.message}`);
    }
  });

  // Job Form (Service Operation - Trigger demo happens here!)
  document.getElementById('job-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const aracId = document.getElementById('job-arac').value;
    const hizmetId = document.getElementById('job-hizmet').value;
    const tarih = document.getElementById('job-tarih').value;
    const fiyat = document.getElementById('job-fiyat').value;
    
    try {
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aracId, hizmetId, tarih, fiyat })
      });
      const data = await res.json();
      
      // If trigger tg_stok_kontrol throws low stock exception:
      if (data.error) {
        throw new Error(data.error);
      }
      
      closeModal('job-modal');
      loadJobs();
      loadDashboardStats();
      fetchServicesList(); // update stocks
    } catch (err) {
      // Show database trigger error to user!
      alert(`Servis işlemi uygulanamadı!\n\nVeritabanı Tetikleyici Hatası:\n${err.message}`);
    }
  });

  // Payment Form
  document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const musteriId = document.getElementById('payment-musteri').value;
    const tarih = document.getElementById('payment-tarih').value;
    const tutar = document.getElementById('payment-tutar').value;
    const tur = document.getElementById('payment-tur').value;
    const aciklama = document.getElementById('payment-aciklama').value;
    
    try {
      const res = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musteriId, tarih, tutar, tur, aciklama })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      closeModal('payment-modal');
      loadPayments();
      loadDashboardStats();
      fetchCustomersList(); // update customer balances
    } catch (err) {
      alert(`Ödeme kaydedilirken hata oluştu: ${err.message}`);
    }
  });
}

// 11. Search Setup
function setupSearchInputs() {
  // Customer Search
  document.getElementById('search-customer').addEventListener('input', debounce((e) => {
    loadCustomers(e.target.value);
  }, 300));

  // Vehicle Search
  document.getElementById('search-vehicle').addEventListener('input', debounce((e) => {
    loadVehicles(e.target.value);
  }, 300));

  // Service Search
  document.getElementById('search-service').addEventListener('input', debounce((e) => {
    loadServices(e.target.value);
  }, 300));

  // Job Search
  document.getElementById('search-job').addEventListener('input', debounce((e) => {
    loadJobs(e.target.value);
  }, 300));

  // Payment Search
  document.getElementById('search-payment').addEventListener('input', debounce((e) => {
    loadPayments(e.target.value);
  }, 300));
}

// Helper: Debounce search inputs
function debounce(func, delay) {
  let debounceTimer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}

// 12. Modal utilities
function openModal(id) {
  const overlay = document.getElementById(id);
  overlay.style.display = 'flex';
  setTimeout(() => {
    overlay.classList.add('active');
  }, 10);
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  overlay.classList.remove('active');
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 300);
}
