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
const mockUsers = [{ username: 'admin', password: 'password123' }];

/*
=============================================
  Routes
=============================================
*/
app.get('/', (req, res) => {
  res.send('Hello Express app!');
});

app.get('/login', (req, res) => {
  res.render('login', {
    pageTitle: 'Login - EmotiVault',
    currentPage: 'login',
  });
});

app.get('/signup', (req, res) => {
  res.render('signup', {
    pageTitle: 'Sign Up - EmotiVault',
    currentPage: 'signup',
  });
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

/*
=============================================
  Login/Signup
=============================================
*/
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = mockUsers.find(
    (u) => u.username === username && u.password === password,
  );

  if (user) {
    res.send(
      '<h1>Login Successful!</h1><p>Welcome back!</p><a href="/login">Back</a>',
    );
  } else {
    res
      .status(401)
      .send(
        '<h1>Login Failed!</h1><p>Invalid username or password.</p><a href="/login">Try again</a>',
      );
  }
});

// Handle signup submission
app.post('/signup', (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res
      .status(400)
      .send(
        '<h1>Signup Failed!</h1><p>Passwords do not match.</p><a href="/signup">Try again</a>',
      );
  }

  const existingUser = mockUsers.find((u) => u.username === username);
  if (existingUser) {
    return res
      .status(400)
      .send(
        '<h1>Signup Failed!</h1><p>Username already taken.</p><a href="/signup">Try again</a>',
      );
  }

  mockUsers.push({ username, password });
  res.send(
    `<h1>Account Created!</h1><p>User <strong>${username}</strong> registered successfully.</p><a href="/login">Go to Login</a>`,
  );
});

/*
=============================================
  LYRICS API
=============================================
*/
app.post('/api/lyrics', async (req, res) => {
  const { artist, title } = req.body;

  const cleanedArtist = typeof artist === 'string' ? artist.trim() : '';

  const cleanedTitle = typeof title === 'string' ? title.trim() : '';

  if (!cleanedArtist || !cleanedTitle) {
    return res.status(400).json({
      error: 'Artist and song title are required.',
    });
  }

  try {
    const searchParams = new URLSearchParams({
      artist_name: cleanedArtist,
      track_name: cleanedTitle,
    });

    const lyricsUrl = `https://lrclib.net/api/search?${searchParams.toString()}`;

    const response = await fetch(lyricsUrl, {
      headers: {
        'User-Agent': 'EmotiVault/1.0',
        Accept: 'application/json',
      },
    });

    const results = await response.json();

    // Check for no results
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(404).json({
        error:
          'No lyrics were found for that song. Check your spelling and try again',
      });
    }

    // We want results that contains plain lyrics.
    const lyricResult = results.find(
      (result) =>
        typeof result.plainLyrics === 'string' &&
        result.plainLyrics.trim().length > 0,
    );

    if (!lyricResult) {
      return res.status(404).json({
        error: 'The song was found, but plain lyrics were unavailable.',
      });
    }

    return res.json({
      artist: lyricResult.artistName || cleanedArtist,
      title: lyricResult.trackName || cleanedTitle,
      album: lyricResult.albumName || '',
      duration: lyricResult.duration || null,
      lyrics: lyricResult.plainLyrics,
    });
  } catch (error) {
    console.error('Request failed:', error);
  }
});

/*
=============================================
  DB Test
=============================================
*/

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
