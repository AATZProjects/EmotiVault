import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));
app.use(express.json());

//setting up database connection pool
/* // todo: UNCOMMENT WHEN IMPLEMENTING DATABASE
const pool = mysql.createPool({
    host: "your_hostname",
    user: "your_username",
    password: "your_password",
    database: "your_database",
    connectionLimit: 10,
    waitForConnections: true
});
*/

// Mock user data for testing
const mockUsers = [
    { username: 'admin', password: 'password123' }
];


//Routes
//Home route
app.get('/', (req, res) => {
   res.send('Hello Express app!')
});


// Render login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle login submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = mockUsers.find(u => u.username === username && u.password === password);

    if (user) {
        res.send(`<h1>Login Successful!</h1><p>Welcome back, ${username}!</p><a href="/login">Back</a>`);
    } else {
        res.status(401).send('<h1>Login Failed!</h1><p>Invalid username or password.</p><a href="/login">Try again</a>');
    }
});

// Render signup page
app.get('/signup', (req, res) => {
    res.render('signup');
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
    res.send(`<h1>Account Created!</h1><p>User <strong>${username}</strong> successfully registered.</p><a href="/login">Go to Login</a>`);
});


/*
app.get("/dbTest", async(req, res) => {
   try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});//dbTest
*/

app.listen(3000, ()=>{
    console.log("Express server running")
})