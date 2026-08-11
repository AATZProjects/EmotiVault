import 'dotenv/config'; // Load environment variables first

import express from 'express';
import mysql from 'mysql2/promise';

import session from 'express-session'; // Saving user sessions

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

// For Saving User Sessions
app.set('trust proxy', 1);
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days (total maxAge is measured in milliseconds)
      secure: process.env.NODE_ENV === 'production', // false on localhost, true on production - will require HTTPS when the webpage is published
    },
  }),
);

//for Express to get values using POST method
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Initialize Passport and session authentication
app.use(passport.initialize());
app.use(passport.session());

// Make session variables accessible in all EJS view templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

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
  Passport & Google OAuth Configuration
=============================================
*/
// Serialize user object into session ID
passport.serializeUser((user, done) => {
  done(null, user.userId);
});

// Deserialize user object from session ID
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE userId = ?', [
      id,
    ]);
    done(null, rows[0]);
  } catch (err) {
    done(err, null);
  }
});

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const username = profile.displayName;
        const email =
          profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        const avatarUrl =
          profile.photos && profile.photos[0] ? profile.photos[0].value : '';

        // Insert or update user credentials in MySQL database
        const sql = `
        INSERT INTO users (googleId, username, email, avatarUrl)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE username = VALUES(username), avatarUrl = VALUES(avatarUrl)
      `;
        await pool.query(sql, [googleId, username, email, avatarUrl]);

        // Fetch newly inserted/updated user record
        const [rows] = await pool.query(
          'SELECT * FROM users WHERE googleId = ?',
          [googleId],
        );
        return done(null, rows[0]);
      } catch (error) {
        console.error('Google OAuth DB Error:', error);
        return done(error, null);
      }
    },
  ),
);

/*
=============================================
  Routes
=============================================
*/
// Home page
app.get(['/', '/home'], async (req, res) => {
  // DEBUG: Check if user is logged in
  if (req.session.authenticated) {
    console.log(
      'SESSION AUTHENTICATED AS USER: ' +
        req.session.name +
        ' | ID: ' +
        req.sessionID,
    );
  } else {
    console.log('No user session saved');
  }

  try {
    // 1. Calculate the current day of the year (1 - 366) for daily rotation
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    // 2. Fetch total count of emoticons
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM emoticons',
    );
    const totalEmoticons = countRows[0]?.total || 1;

    // 3. Modulo operator for seamless daily wrapping
    const offsetIndex = dayOfYear % totalEmoticons;

    // 4. Query daily emoticon using offset
    const dailySql = `
      SELECT e.emoticonId, e.emoticonName, e.emoticonString, e.emoticonCategory, e.emoticonMood, COUNT(f.emoticonId) AS emoticonFavorites
      FROM emoticons e
      LEFT JOIN userFavorites f ON f.emoticonId = e.emoticonId
      GROUP BY e.emoticonId
      ORDER BY e.emoticonId ASC
      LIMIT 1 OFFSET ?
    `;
    const [dailyRows] = await pool.query(dailySql, [offsetIndex]);

    // 5. Fetch real-time aggregate database stats
    const statsSql = `
      SELECT 
        COUNT(*) AS totalEmoticons, 
        COUNT(DISTINCT emoticonCategory) AS totalCategories, 
        COUNT(DISTINCT emoticonMood) AS totalMoods 
      FROM emoticons
    `;
    const [statsRows] = await pool.query(statsSql);

    // 6. Generate random face and nostalgia score
    const nostalgiaList = [
      'd(^_^)b',
      '(¬_¬)',
      '(*/ω＼*)',
      '(┬_┬)',
      'c( O.o )b',
      '(*^▽^*)',
      '¯\\_(ツ)_/¯',
      '(>_<)',
      '(;¬_¬)',
      'o(TヘTo)',
    ];
    const randomFace =
      nostalgiaList[Math.floor(Math.random() * nostalgiaList.length)];
    const randomLevel = Math.floor(Math.random() * 16) + 85; // Random integer between 85% and 100%

    // 7. Render homepage view
    res.render('home', {
      pageTitle: 'Home - EmotiVault',
      currentPage: 'home',
      dailyEmoticon: dailyRows[0] || null,
      stats: statsRows[0] || {
        totalEmoticons: 0,
        totalCategories: 6,
        totalMoods: 12,
      },
      nostalgiaFace: randomFace,
      nostalgiaLevel: randomLevel,
    });
  } catch (error) {
    console.error('Home page database error:', error);
    res.status(500).send('Database connection error.');
  }
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

app.get('/favorites', isAuthenticated, async (req, res) => {
  // Get the number of liked emoticons
  let sql = `SELECT COUNT(userId) AS likes FROM userFavorites WHERE userId = ?`;
  let [rows] = await pool.query(sql, req.session.userId);
  
  res.render('favorites', {
    pageTitle: 'Favorites',
    currentPage: 'favorites',
    likes: (rows[0].likes ?? 0),
  });
});

app.get('/styleguide', (req, res) => {
  res.render('styleguide', {
    pageTitle: 'Style Guide',
    currentPage: 'styleguide',
  });
});

/*========================================
  ADMIN ROUTES
  ========================================
*/

app.get('/admin/emoticons', isAdmin, async (req, res) => {
  try {
    const limit = 20;

    let page = Number(req.query.page) || 1;

    if (page < 1) {
      page = 1;
    }

    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM emoticons',
    );

    const totalEmoticons = countRows[0].total;
    const totalPages = Math.ceil(totalEmoticons / limit);

    if (page > totalPages && totalPages > 0) {
      page = totalPages;
    }

    const offset = (page - 1) * limit;

    const [emoticons] = await pool.query(
      `
        SELECT
          emoticonId,
          emoticonName,
          emoticonString,
          emoticonCategory,
          emoticonMood
        FROM emoticons
        ORDER BY emoticonId ASC
        LIMIT ? OFFSET ?
      `,
      [limit, offset],
    );

    return res.render('admin-emoticons', {
      pageTitle: 'Manage Emoticons',
      currentPage: 'admin',
      emoticons,
      totalEmoticons,
      currentPageNumber: page,
      totalPages,
    });
  } catch (error) {
    console.error('Admin emoticon page error:', error);

    return res.status(500).send('Unable to load emoticons.');
  }
});

app.get('/admin/emoticons/:emoticonId/edit', isAdmin, async (req, res) => {
  const emoticonId = Number(req.params.emoticonId);

  try {
    const [rows] = await pool.query(
      `
        SELECT
          emoticonId,
          emoticonName,
          emoticonString,
          emoticonCategory,
          emoticonMood
        FROM emoticons
        WHERE emoticonId = ?
      `,
      [emoticonId],
    );

    if (rows.length === 0) {
      return res.status(404).send('Emoticon not found.');
    }

    return res.render('admin-edit-emoticon', {
      pageTitle: 'Edit Emoticon',
      currentPage: 'admin',
      emoticon: rows[0],
    });
  } catch (error) {
    console.error('Admin edit emoticon error:', error);

    return res.status(500).send('Unable to load emoticon.');
  }
});

app.post('/admin/emoticons/:emoticonId/edit', isAdmin, async (req, res) => {
  const emoticonId = Number(req.params.emoticonId);

  const { emoticonName, emoticonString, emoticonCategory, emoticonMood } =
    req.body;

  if (!Number.isInteger(emoticonId) || emoticonId < 1) {
    return res.status(400).send('Invalid emoticon ID.');
  }

  if (
    !emoticonName?.trim() ||
    !emoticonString?.trim() ||
    !emoticonCategory?.trim() ||
    !emoticonMood?.trim()
  ) {
    return res.status(400).send('All fields are required.');
  }

  const allowedCategories = [
    'Classic',
    'Upright',
    'Unicode',
    'Kaomoji',
    'Misc',
    '2Channel',
  ];

  const allowedMoods = [
    'Happy',
    'Sad',
    'Angry',
    'Love',
    'Surprised',
    'Confused',
    'Embarrassed',
    'Playful',
    'Neutral',
    'Sleepy',
    'Cool',
    'Respect',
  ];

  if (!allowedCategories.includes(emoticonCategory)) {
    return res.status(400).send('Invalid category.');
  }

  if (!allowedMoods.includes(emoticonMood)) {
    return res.status(400).send('Invalid mood.');
  }

  try {
    const [result] = await pool.query(
      `
        UPDATE emoticons
        SET
          emoticonName = ?,
          emoticonString = ?,
          emoticonCategory = ?,
          emoticonMood = ?
        WHERE emoticonId = ?
      `,
      [
        emoticonName.trim(),
        emoticonString.trim(),
        emoticonCategory,
        emoticonMood,
        emoticonId,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).send('Emoticon not found.');
    }

    return res.redirect('/admin/emoticons');
  } catch (error) {
    console.error('Admin update emoticon error:', error);

    return res.status(500).send('Unable to update emoticon.');
  }
});

/*========================================
  OAuth & Authentication Routes
  ========================================
*/
// Initiate Google OAuth login
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

// Google OAuth callback endpoint
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Sync session variables for backward compatibility
    req.session.authenticated = true;
    req.session.name = req.user.username;
    req.session.userId = req.user.userId;
    

    res.redirect('/');
  },
);

// User logout endpoint
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.redirect('/login');
    });
  });
});

app.get('/api/username-available', async (req, res) => {
  const username =
    typeof req.query.username === 'string' ? req.query.username.trim() : '';

  if (!username) {
    return res.status(400).json({
      available: false,
      message: 'Username is required.',
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT userId FROM users WHERE username = ?',
      [username],
    );

    return res.json({
      available: rows.length === 0,
    });
  } catch (error) {
    console.error('Username availability error:', error);

    return res.status(500).json({
      available: false,
      message: 'Unable to check username availability.',
    });
  }
});

/*========================================
  Browse Emoticons
  ========================================
*/
app.get('/browse', async (req, res) => {
  let page = Number(req.query.page) || 1;
  let limit = 20;
  let offset = (page - 1) * limit;

  let sql = `SELECT e.emoticonId, e.emoticonString, e.emoticonCategory, e.emoticonMood, COUNT(f.userId) AS favorites
             FROM emoticons e
             LEFT JOIN userFavorites f ON e.emoticonId = f.emoticonId
             GROUP BY e.emoticonId
             ORDER BY e.emoticonId
             LIMIT ? OFFSET ?`;

  const params = [limit, offset];
  const [emoticons] = await pool.query(sql, params);
  res.render('emoticons', { emoticons, currentPage: page });
});

/*
=============================================
  Login/Signup
=============================================
*/
// Handle login submission using MySQL
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password],
    );

    if (rows.length > 0) {
      const user = rows[0];
      req.session.authenticated = true;
      req.session.name = user.username;
      req.session.userId = user.userId;
      req.session.isAdmin = user.isAdmin;

      return res.json({ success: true, redirectUrl: '/' });
    } else {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid username or password.' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Database error during login.' });
  }
});

// Handle signup submission using MySQL
app.post('/signup', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: 'Passwords do not match.' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Username is already taken.' });
    }

    await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [
      username,
      password,
    ]);
    return res.json({
      success: true,
      message: 'Account created successfully! You can now log in.',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Database error during signup.' });
  }
});

// Middleware verification function in case user isn't logged in
function isAuthenticated(req, res, next) {
  // If the user is not yet authenticated (logged in), redirect them to the login page
  if (!req.session.authenticated) {
    res.redirect('/login');
  } else {
    next();
  }
}

// Middleware to restrict routes to administrators
function isAdmin(req, res, next) {
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }

  if (!req.session.isAdmin) {
    return res.status(403).send('Access denied.');
  }

  next();
}

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
  RANDOM EMOTICON API
=============================================
*/

const allowedEmoticonMoods = [
  'happy',
  'sad',
  'angry',
  'love',
  'surprised',
  'confused',
  'embarrassed',
  'playful',
  'neutral',
  'sleepy',
  'cool',
  'respect',
];

app.get('/api/emoticons/random', async (req, res) => {
  const mood =
    typeof req.query.mood === 'string'
      ? req.query.mood.trim().toLowerCase()
      : '';

  if (!mood) {
    return res.status(400).json({
      error: 'ERROR: Mood can not be empty.',
    });
  }

  if (!allowedEmoticonMoods.includes(mood)) {
    return res.status(400).json({
      error: 'ERROR: Mood is not valid.',
    });
  }

  try {
    const sql = `
      SELECT
        emoticonId,
        emoticonName,
        emoticonString,
        emoticonCategory,
        emoticonMood
      FROM emoticons
      WHERE LOWER(emoticonMood) = ?
      ORDER BY RAND()
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [mood]);

    if (rows.length === 0) {
      return res.status(404).json({
        error: `ERROR: No emoticons were found for the mood "${mood}".`,
      });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Random emoticon database error:', error);

    return res.status(500).json({
      error: 'ERROR: Unable to retrieve a random emoticon.',
    });
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

/*
=============================================
  User Favorites APIs
=============================================
*/

app.get('/api/userFavorites', async (req, res) => {
  try {
    let [rows] = await pool.query(`
    SELECT e.emoticonId, e.emoticonName, e.emoticonString, e.emoticonCategory, e.emoticonMood, DATE_FORMAT(f.likedDate, '%m/%d/%Y') AS likedDate
    FROM emoticons e
    INNER JOIN userFavorites f ON f.emoticonId = e.emoticonId
    WHERE f.userId = ?
    GROUP BY emoticonId
    ORDER BY likedDate DESC;
    `, [req.session.userId]);

    apiPaginate(rows, req, res);
  } catch (error) {
    console.error(error);
    generateError(res, 'Undefined Error.');
  }
});

app.get('/api/removeFavorite/:emoticonId', async (req, res) => {
  try {
    let emoticonId = req.params.emoticonId;
    let sql = `DELETE FROM userFavorites WHERE userId = ? AND emoticonId = ? LIMIT 1`;
    let params = [req.session.userId, emoticonId];
    let [rows] = await pool.query(sql, params);

    sql = `SELECT COUNT(userId) AS likes FROM userFavorites WHERE userId = ?`;
    let [likes_rows] = await pool.query(sql, req.session.userId);

    res.json({"message": "Successfully removed row!", "num_likes": likes_rows[0].likes});
  } catch (error) {
    console.error(error);
    generateError(res, 'Undefined Error when removing Emoticon.');
  }
});

/*
=============================================
   Emoticons APIs
   Following conventions from the docs/api.md documentation
=============================================
*/

// Helper function to generate json error
function generateError(res, errorMsg) {
  let errorsub = 'ERROR: ';
  if (!errorMsg.includes(errorsub)) {
    errorMsg = errorsub + errorMsg;
  }

  const msg = {
    error: errorMsg,
  };

  res.json(msg);
}

// Helper function to generate emoticon object - MUST `AWAIT` THIS FUNCTION
async function getEmoticonObject(emoticonId) {
  emoticonId = Number(emoticonId);

  let [rows] = await pool.query(
    `SELECT * FROM emoticons WHERE emoticonId = ?`,
    emoticonId,
  );

  let emoticon = rows[0];

  [rows] = await pool.query(
    `SELECT COUNT(emoticonId) AS emoticonFavorites FROM userFavorites WHERE emoticonId = ?`,
    emoticonId,
  );
  let emoticonFavoritesValue = rows[0].emoticonFavorites;

  const emoticonObj = {
    emoticonId: emoticonId,
    emoticonName: emoticon.emoticonName,
    emoticonString: emoticon.emoticonString,
    emoticonCategory: emoticon.emoticonCategory,
    emoticonMood: emoticon.emoticonMood,
    emoticonFavorites: emoticonFavoritesValue,
  };

  return emoticonObj;
}

// /api/emoticon/{emoticonId}
app.get('/api/emoticon/:emoticonId', async (req, res) => {
  try {
    let emoticonId = Number(req.params.emoticonId);

    // === Range checks for argument ===
    if (emoticonId === null || emoticonId === '' || isNaN(emoticonId)) {
      generateError(res, 'Missing or Invalid emoticonID!');
      return;
    }

    let [rows] = await pool.query(
      `SELECT min(emoticonId) AS minID FROM emoticons`,
    );
    let minID = rows[0].minID;

    [rows] = await pool.query(`SELECT max(emoticonId) AS maxID FROM emoticons`);
    let maxID = rows[0].maxID;

    if (emoticonId < minID || emoticonId > maxID) {
      generateError(res, 'Provided emoticonID is not in range!');
      return;
    }

    // Return JSON object of emoticon

    [rows] = await pool.query(
      `SELECT * FROM emoticons WHERE emoticonId = ?`,
      emoticonId,
    );

    if (rows.length === 0) {
      generateError('No emoticon exists with ID: ' + emoticonId);
      return;
    }

    res.json(await getEmoticonObject(emoticonId));
  } catch (error) {
    console.error(error);
    generateError(res, 'Undefined Error.');
  }
});

// /api/emoticons/all
app.get('/api/emoticons/all', async (req, res) => {
  try {
    // Get a list of ALL emoticons, ordered by emoticon ID
    let [rows] = await pool.query(`
    SELECT e.emoticonId, emoticonName, emoticonString, emoticonCategory, emoticonMood, COUNT(f.emoticonId) AS emoticonFavorites
    FROM emoticons e
    LEFT JOIN userFavorites f ON f.emoticonId = e.emoticonId
    GROUP BY emoticonId
    ORDER BY emoticonId ASC;
    `);

    apiPaginate(rows, req, res);
  } catch (error) {
    console.error(error);
    generateError(res, 'Undefined Error.');
  }
});

// /api/emoticons/filter
app.get('/api/emoticons/filter', async (req, res) => {
  try {
    // Query Selection based on parameters
    let sortBy = req.query.sortBy;
    let sqlSortString = '';

    // =sortBy Filter
    switch (sortBy) {
      case 'category':
        sqlSortString = 'emoticonCategory, emoticonId ASC';
        break;
      case 'mood':
        sqlSortString = 'emoticonMood, emoticonId ASC';
        break;
      case 'popular':
        sqlSortString = 'emoticonFavorites DESC, emoticonId ASC';
        break;
      case 'leastPopular':
        sqlSortString = 'emoticonFavorites ASC, emoticonId ASC';
        break;
      default:
        sqlSortString = 'emoticonId ASC';
        break;
    }

    // WHERE Builder
    let whereString = '';

    // Category Filter
    let category = req.query.category;
    switch (category) {
      case 'classic':
        whereString += `(emoticonCategory = "Classic") AND `;
        break;
      case 'upright':
        whereString += `(emoticonCategory = "Upright") AND `;
        break;
      case 'unicode':
        whereString += `(emoticonCategory = "Unicode") AND `;
        break;
      case 'kaomoji':
        whereString += `(emoticonCategory = "Kaomoji") AND `;
        break;
      case 'misc':
        whereString += `(emoticonCategory = "Misc") AND `;
        break;
      case '2channel':
        whereString += `(emoticonCategory = "2Channel") AND `;
        break;
    }

    // Mood Filter
    let mood = req.query.mood;

    switch (mood) {
      case 'happy':
        whereString += `(emoticonMood = "Happy") AND `;
        break;
      case 'sad':
        whereString += `(emoticonMood = "Sad") AND `;
        break;
      case 'angry':
        whereString += `(emoticonMood = "Angry") AND `;
        break;
      case 'love':
        whereString += `(emoticonMood = "Love") AND `;
        break;
      case 'surprised':
        whereString += `(emoticonMood = "Surprised") AND `;
        break;
      case 'confused':
        whereString += `(emoticonMood = "Confused") AND `;
        break;
      case 'embarrassed':
        whereString += `(emoticonMood = "Embarrased") AND `;
        break;
      case 'playful':
        whereString += `(emoticonMood = "Playful") AND `;
        break;
      case 'neutral':
        whereString += `(emoticonMood = "Neutral") AND `;
        break;
      case 'sleepy':
        whereString += `(emoticonMood = "Sleepy") AND `;
        break;
      case 'cool':
        whereString += `(emoticonMood = "Cool") AND `;
        break;
      case 'respect':
        whereString += `(emoticonMood = "Respect") AND `;
        break;
    }

    // Search filter
    let search = req.query.search;
    let sql = '';
    let rows;

    if (
      typeof search !== 'undefined' &&
      search !== null &&
      search.length >= 1
    ) {
      search = `%${search}%`;

      sql = `
      SELECT e.emoticonId, emoticonName, emoticonString, emoticonCategory, emoticonMood, COUNT(f.emoticonId) AS emoticonFavorites
      FROM emoticons e
      LEFT JOIN userFavorites f ON f.emoticonId = e.emoticonId
      WHERE ${whereString} (emoticonName LIKE ? OR emoticonCategory LIKE ? OR emoticonMood LIKE ?)
      GROUP BY emoticonId
      ORDER BY ${sqlSortString}`;

      [rows] = await pool.query(sql, [search, search, search]);
    } else {
      // No search filter
      // Set WHERE to true as an extra condition. It guarantees at least "WHERE TRUE" in case no other filters are applied
      whereString += 'TRUE';

      sql = `
      SELECT e.emoticonId, emoticonName, emoticonString, emoticonCategory, emoticonMood, COUNT(f.emoticonId) AS emoticonFavorites
      FROM emoticons e
      LEFT JOIN userFavorites f ON f.emoticonId = e.emoticonId
      WHERE ${whereString}
      GROUP BY emoticonId
      ORDER BY ${sqlSortString}`;

      // Get a list of ALL emoticons, ordered by emoticon ID
      [rows] = await pool.query(sql);
    }

    apiPaginate(rows, req, res);
  } catch (error) {
    console.error(error);
    generateError(res, 'Undefined Error.');
  }
});

// This helper function takes an SQL-returned amount of rows, the request, and response values of the API to render out only the needed amount of information
function apiPaginate(rows, req, res) {
  let emoticons = [];

  // Nullish Coalesce - uses value on the right if lhs is invalid/null
  let limit = 20; // If no limit is specified, use the default page count
  let page = 1;
  let startIndex = 0;

  // If we're given a page number, then use the limit as a page count, the default will be 20
  if (req.query.page !== undefined) {
    if (req.query.limit !== undefined) {
      limit = Number(req.query.limit);

      if (limit === null || isNaN(limit)) {
        generateError(res, 'Limit is invalid.');
        return;
      }
    }

    // Only return `limit` # of elements starting from index (page - 1) * limit
    page = Number(req.query.page);
    if (page === null || isNaN(page)) {
      generateError(res, 'Page is invalid.');
      return;
    }

    startIndex = (page - 1) * limit;
  } else {
    limit = Number(req.query.limit ?? rows.length); // Since we're not using pagination, return all elements

    if (limit === null || isNaN(limit)) {
      generateError(res, 'Limit is invalid.');
      return;
    }
  }

  // Calculate page count
  let pageCount = Math.ceil(rows.length / limit);

  for (let i = startIndex; i < startIndex + limit; i++) {
    if (i >= rows.length) {
      break;
    }

    let emoticon = rows[i];

    const emoticonObject = {
      emoticonId: emoticon.emoticonId,
      emoticonName: emoticon.emoticonName,
      emoticonString: emoticon.emoticonString,
      emoticonCategory: emoticon.emoticonCategory,
      emoticonMood: emoticon.emoticonMood,
      emoticonFavorites: emoticon.emoticonFavorites,
      likedDate: emoticon.likedDate ?? 'N/A',
    };

    emoticons.push(emoticonObject);
  }

  res.json({ num_pages: pageCount, emoticons: emoticons });
}

/*
 *  === ^^^ EMOTICONS API ^^^ ===
 */

app.listen(3000, () => {
  console.log('Express server running');
});
