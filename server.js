const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const db = require('./db');
const LinkedList = require('./structures/linkedlist');
const Queue = require('./structures/queue');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data structures (kept in-memory for fast queue/list)
const patientList = new LinkedList();
const patientQueue = new Queue();

// Helper: ensure table exists
const ensureTable = () => {
  const sql = `CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    disease VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;
  db.query(sql, (err) => {
    if (err) console.error('Error ensuring table:', err.message);
  });
};
ensureTable();

// Routes
app.get('/api/patients', (req, res) => {
  db.query('SELECT id, name, age, disease FROM patients ORDER BY id DESC', (err, result) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err.message });
    res.json(result);
  });
});

app.get('/api/queue', (_req, res) => {
  if (!patientQueue || patientQueue.isEmpty()) {
    // Fallback to DB so queue isn't empty after restarts
    db.query('SELECT id, name, age, disease FROM patients ORDER BY id DESC', (err, result) => {
      if (err) return res.status(500).json({ message: 'DB error', error: err.message });
      return res.json(result || []);
    });
  } else {
    res.json(patientQueue.getAll());
  }
});

app.post('/api/add', (req, res) => {
  const { name, age, disease } = req.body || {};
  if (!name || !Number.isFinite(Number(age)) || Number(age) < 0 || !disease) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const newPatient = { name, age: Number(age), disease };

  // Insert into DB first to get id
  db.query(
    'INSERT INTO patients (name, age, disease) VALUES (?, ?, ?)',
    [newPatient.name, newPatient.age, newPatient.disease],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'DB insert error', error: err.message });
      const created = { id: result.insertId, ...newPatient };

      // Add to DS only after DB succeeds
      patientList.insert(created);
      patientQueue.enqueue(created);

      res.json({
        message: 'Patient added successfully',
        patient: created,
        queue: patientQueue.getAll(),
      });
    }
  );
});

app.delete('/api/delete/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });

  db.query('DELETE FROM patients WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: 'DB delete error', error: err.message });

    // Also remove from in-memory structures by name match
    // Fetch what was deleted to remove by id
    // Simpler approach: filter the queue and list arrays
    const filteredQueue = patientQueue.getAll().filter(p => p.id !== id);
    patientQueue.items = filteredQueue; // mutating internal for simplicity

    // LinkedList delete by name can be lossy if duplicate names; so rebuild
    const remaining = patientList.toArray().filter(p => p.id !== id);
    const rebuilt = new LinkedList();
    remaining.forEach(p => rebuilt.insert(p));
    // swap heads
    patientList.head = rebuilt.head;

    res.json({ message: 'Patient deleted successfully' });
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Robust listen with fallback when the requested port is busy
const server = http.createServer(app);
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} in use, retrying on a random port...`);
    server.listen(0);
  } else {
    console.error('Server error:', err);
  }
});
server.listen(PORT, () => {
  const address = server.address();
  console.log(`🚀 Server running on http://localhost:${address && address.port}`);
});
