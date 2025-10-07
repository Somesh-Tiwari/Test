const API_URL = 'http://localhost:3000/api';

const form = document.getElementById('patientForm');
const queueList = document.getElementById('queueList');
const tableBody = document.querySelector('#patientTable tbody');
const searchInput = document.getElementById('searchInput');
const toastContainer = document.getElementById('toastContainer');
const offlineBanner = document.getElementById('offlineBanner');
const themeToggle = document.getElementById('themeToggle');
const refreshBtn = document.getElementById('refreshBtn');
const totalPatientsCounter = document.getElementById('totalPatientsCounter');
const queueCounter = document.getElementById('queueCounter');
const lastUpdated = document.getElementById('lastUpdated');
const queueEmpty = document.getElementById('queueEmpty');
const tableEmpty = document.getElementById('tableEmpty');

let allPatients = [];
let queueData = [];

function showToast(message, type = 'info', timeout = 2500) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span><button class="btn ghost" aria-label="Dismiss">✕</button>`;
  const remove = () => toast.remove();
  toast.querySelector('button').addEventListener('click', remove);
  toastContainer.appendChild(toast);
  setTimeout(remove, timeout);
}

function updateLastUpdated() {
  const now = new Date();
  lastUpdated.textContent = now.toLocaleString();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('hms_theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function initTheme() {
  const stored = localStorage.getItem('hms_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored || (prefersDark ? 'dark' : 'light'));
}

async function loadPatients() {
  try {
    const res = await fetch(`${API_URL}/patients`);
    if (!res.ok) throw new Error('Failed to load patients');
    const data = await res.json();
    allPatients = Array.isArray(data) ? data : [];
    renderPatients(allPatients);
    totalPatientsCounter.textContent = allPatients.length.toString();
    tableEmpty.hidden = allPatients.length !== 0;
    updateLastUpdated();
    offlineBanner.hidden = true;
  } catch (err) {
    tableBody.innerHTML = '';
    tableEmpty.hidden = false;
    offlineBanner.hidden = false;
  }
}

async function loadQueue() {
  try {
    const res = await fetch(`${API_URL}/queue`);
    if (!res.ok) throw new Error('Failed to load queue');
    const data = await res.json();
    queueData = Array.isArray(data) ? data : [];
    renderQueue(queueData);
    queueCounter.textContent = queueData.length.toString();
    queueEmpty.hidden = queueData.length !== 0;
    offlineBanner.hidden = true;
  } catch (err) {
    queueList.innerHTML = '';
    queueEmpty.hidden = false;
    offlineBanner.hidden = false;
  }
}

function renderPatients(list) {
  const query = (searchInput.value || '').trim().toLowerCase();
  const filtered = !query
    ? list
    : list.filter(p => `${p.name}`.toLowerCase().includes(query) || `${p.disease}`.toLowerCase().includes(query));

  tableBody.innerHTML = '';
  for (const p of filtered) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.age}</td>
      <td>${p.disease}</td>
      <td><button class="btn danger" data-id="${p.id}">🗑️</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deletePatient(p.id));
    tableBody.appendChild(tr);
  }
}

function renderQueue(list) {
  queueList.innerHTML = '';
  for (const q of list) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <div><strong>${q.name}</strong> <span class="meta">(${q.age})</span></div>
        <div class="meta">${q.disease}</div>
      </div>
    `;
    queueList.appendChild(li);
  }
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('pname').value.trim();
    const age = Number(document.getElementById('age').value);
    const disease = document.getElementById('disease').value.trim();

    if (!name || !Number.isFinite(age) || age < 0 || !disease) {
      showToast('Please provide valid patient details.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, disease })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to add patient');
      showToast(data.message || 'Patient added', 'success');

      // Refresh UI
      await Promise.all([loadPatients(), loadQueue()]);
      form.reset();
    } catch (err) {
      showToast(err.message || 'Network error', 'error');
    }
  });
}

async function deletePatient(id) {
  if (!confirm(`Delete patient ID ${id}?`)) return;
  try {
    const res = await fetch(`${API_URL}/delete/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    showToast('Patient deleted', 'success');
    await Promise.all([loadPatients(), loadQueue()]);
  } catch (err) {
    showToast(err.message || 'Network error', 'error');
  }
}

// Search
if (searchInput) {
  searchInput.addEventListener('input', () => renderPatients(allPatients));
}

// Theme
initTheme();

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener('click', async () => {
    await Promise.all([loadPatients(), loadQueue()]);
    showToast('Data refreshed', 'info');
  });
}

// Initial data load
Promise.all([loadPatients(), loadQueue()]);
