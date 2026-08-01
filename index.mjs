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

/* 
 *  === Emoticons APIs ===    
 *  Following conventions from the docs/api.md documentation
 */

// Helper function to generate json error
function generateError(res, errorMsg) {
  let errorsub = "ERROR: ";
  if (!errorMsg.includes(errorsub)) {
    errorMsg = errorsub + errorMsg;
  }
  
  const msg = {
    error: errorMsg
  };

  res.json(msg);
}

// Helper function to generate emoticon object - MUST `AWAIT` THIS FUNCTION
async function getEmoticonObject(emoticonId) {
  emoticonId = Number(emoticonId);
  
  let [rows] = await pool.query(`SELECT * FROM emoticons WHERE emoticonId = ?`, emoticonId);

  let emoticon = rows[0];

  [rows] = await pool.query(`SELECT COUNT(emoticonId) AS emoticonFavorites FROM userFavorites WHERE emoticonId = ?`, emoticonId);
  let emoticonFavoritesValue = rows[0].emoticonFavorites;

  const emoticonObj = {
    emoticonId: emoticonId,
    emoticonName: emoticon.emoticonName,
    emoticonString: emoticon.emoticonString,
    emoticonCategory: emoticon.emoticonCategory,
    emoticonMood: emoticon.emoticonMood,
    emoticonFavorites: emoticonFavoritesValue
  };

  return emoticonObj;
}

// /api/emoticons/{emoticonId}
app.get('/api/emoticons/emoticon/:emoticonId', async (req, res) => {
  try {
    let emoticonId = Number(req.params.emoticonId);

    // === Range checks for argument ===
    if (emoticonId === null || emoticonId === "" || isNaN(emoticonId)) {
      generateError(res, "Missing or Invalid emoticonID!");
      return;
    }

    let [rows] =  await pool.query(`SELECT min(emoticonId) AS minID FROM emoticons`);
    let minID = rows[0].minID;

    [rows]  = await pool.query(`SELECT max(emoticonId) AS maxID FROM emoticons`);
    let maxID = rows[0].maxID;

    if (emoticonId < minID || emoticonId > maxID) {
      generateError(res, "Provided emoticonID is not in range!");
      return;
    }
    // === === === === === === === === =


    // Return JSON object of emoticon

    [rows] = await pool.query(`SELECT * FROM emoticons WHERE emoticonId = ?`, emoticonId);

    if (rows.length === 0) {
      generateError("No emoticon exists with ID: " + emoticonId);
      return;
    }

    res.json(await getEmoticonObject(emoticonId));

  } catch (error) {
    console.error(error);
    generateError(res, "Undefined Error.");
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
  let emoticons = [];

  // Nullish Coalesce - uses value on the right if lhs is invalid/null
  let limit = 20;   // If no limit is specified, use the default page count
  let page = 1;
  let startIndex = 0;

  // If we're given a page number, then use the limit as a page count, the default will be 20
  if (req.query.page !== undefined) {

    if (req.query.limit !== undefined) {
      limit = Number(req.query.limit);

      if (limit === null || isNaN(limit)) {
        generateError(res, "Limit is invalid.");
        return;
      }
    }

    // Only return `limit` # of elements starting from index (page - 1) * limit
    page = Number(req.query.page);
    if (page === null || isNaN(page)) {
        generateError(res, "Page is invalid.");
        return;
      }

    startIndex = (page - 1) * limit; 
  } else {
    limit = Number(req.query.limit ?? rows.length);    // Since we're not using pagination, return all elements

    if (limit === null || isNaN(limit)) {
        generateError(res, "Limit is invalid.");
        return;
      }
  }

  // Calculate page count
  let pageCount = Math.ceil(rows.length / limit);

  
  for (let i = startIndex; i < (startIndex + limit); i++) {
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
      emoticonFavorites: emoticon.emoticonFavorites
    };

    emoticons.push(emoticonObject);
  }


  res.json({"num_pages": pageCount, "emoticons": emoticons});

} catch (error) {
  console.error(error);
  generateError(res, "Undefined Error.");
}
});

/*
 *  === ^^^ EMOTICONS API ^^^ ===
*/

app.listen(3000, () => {
  console.log('Express server running');
});
