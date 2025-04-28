const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cors = require('cors');

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(session({
  secret: 'mapala_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const db = new sqlite3.Database('./mapala.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables if not exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS logistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT,
    quantity INTEGER,
    description TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS borrowings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    borrower_name TEXT,
    quantity INTEGER,
    borrow_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(item_id) REFERENCES logistics(id)
  )`);
});

// Helper function to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Routes

// Register user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      res.json({ message: 'User registered successfully' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!user) return res.status(400).json({ message: 'Invalid username or password' });
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.userId = user.id;
      res.json({ message: 'Login successful' });
    } else {
      res.status(400).json({ message: 'Invalid username or password' });
    }
  });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// Get all logistics items (allow guest access, no authentication required)
app.get('/logistics', (req, res) => {
  // If user is logged in, full access; if guest, read-only
  db.all('SELECT * FROM logistics', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

// Create logistics item
app.post('/logistics', isAuthenticated, (req, res) => {
  const { item_name, quantity, description } = req.body;
  db.run('INSERT INTO logistics (item_name, quantity, description) VALUES (?, ?, ?)', [item_name, quantity, description], function(err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json({ id: this.lastID, item_name, quantity, description });
  });
});

// Update logistics item
app.put('/logistics/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  const { item_name, quantity, description } = req.body;
  db.run('UPDATE logistics SET item_name = ?, quantity = ?, description = ? WHERE id = ?', [item_name, quantity, description, id], function(err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Item not found' });
    res.json({ id, item_name, quantity, description });
  });
});

// Delete logistics item
app.delete('/logistics/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM logistics WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  });
});

  
// Borrow equipment endpoint
app.post('/borrow', (req, res) => {
  const { item_id, borrower_name, quantity } = req.body;
  if (!item_id || !borrower_name || !quantity) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  // Check if enough quantity available
  db.get('SELECT quantity FROM logistics WHERE id = ?', [item_id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!row) return res.status(404).json({ message: 'Item not found' });
    if (row.quantity < quantity) {
      return res.status(400).json({ message: 'Not enough quantity available' });
    }
    // Insert borrowing record
    db.run('INSERT INTO borrowings (item_id, borrower_name, quantity) VALUES (?, ?, ?)', [item_id, borrower_name, quantity], function(err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      // Update logistics quantity
      db.run('UPDATE logistics SET quantity = quantity - ? WHERE id = ?', [quantity, item_id], function(err) {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json({ message: 'Borrowing recorded successfully' });
      });
    });
  });
});

// New endpoint to get recent borrowings with item info
app.get('/borrowings', isAuthenticated, (req, res) => {
  const query = `
    SELECT b.id, b.borrower_name, b.quantity, b.borrow_date, l.item_name
    FROM borrowings b
    JOIN logistics l ON b.item_id = l.id
    ORDER BY b.borrow_date DESC
    LIMIT 10
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
