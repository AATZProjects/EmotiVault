import 'dotenv/config'; // Load environment variables first

import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//setting up database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
});

// Mock user data for initial testing
const mockUsers = [
  { username: 'admin', password: 'password123' }
];

//routes
app.get('/', (req, res) => {
  res.send('Hello Express app!');
});

app.get('/aim-status-generator', (req, res) => {
  res.render('aim-status-generator', {
    pageTitle: 'AIM Away Message Generator',
    currentPage: 'aim-status',
  });
});

app.get('/styleguide', (req, res) => {
  res.render('styleguide', {
    pageTitle: 'Style Guide',
    currentPage: 'styleguide',
  });
});

// Render login page
app.get('/login', (req, res) => {
  res.render('login', {
    pageTitle: 'Login - EmotiVault',
    currentPage: 'login',
  });
});

// Handle login submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = mockUsers.find(u => u.username === username && u.password === password);

  if (user) {
    res.send('<h1>Login Successful!</h1><p>Welcome back!</p><a href="/login">Back</a>');
  } else {
    res.status(401).send('<h1>Login Failed!</h1><p>Invalid username or password.</p><a href="/login">Try again</a>');
  }
});

// Render signup page
app.get('/signup', (req, res) => {
  res.render('signup', {
    pageTitle: 'Sign Up - EmotiVault',
    currentPage: 'signup',
  });
});

// Handle signup submission
app.post('/signup', (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send('<h1>Signup Failed!</h1><p>Passwords do not match.</p><a href="/signup">Try again</a>');
  }

  const existingUser = mockUsers.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).send('<h1>Signup Failed!</h1><p>Username already taken.</p><a href="/signup">Try again</a>');
  }

  mockUsers.push({ username, password });
  res.send(`<h1>Account Created!</h1><p>User <strong>${username}</strong> registered successfully.</p><a href="/login">Go to Login</a>`);
});

app.get('/dbTest', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT CURDATE()');
    res.send(rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Database error');
  }
}); //dbTest

app.listen(3000, () => {
  console.log('Express server running');
});
