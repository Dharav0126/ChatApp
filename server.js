const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const Contact = require('./models/Contact');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set up Handlebars view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect('mongodb+srv://trial:TeamChitChat@javascriptframeworks.8vcwa.mongodb.net/chatapp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Routes
app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

app.get('/chat', (req, res) => {
    const { contact } = req.query;
    res.render('chat', { contact });
});

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }
        const user = new User({ username, password });
        await user.save();
        res.status(200).send('User registered');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(400).send('Invalid credentials');
        }
        res.status(200).send('Login successful');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.post('/add-contact', async (req, res) => {
    const { username, contactUsername } = req.body;
    try {
        const user = await User.findOne({ username });
        const contactUser = await User.findOne({ username: contactUsername });
        if (!user || !contactUser) {
            return res.status(400).send('User not found');
        }
        const contact = new Contact({ username: contactUsername, userId: user._id });
        await contact.save();
        user.contacts.push(contact);
        await user.save();
        res.status(200).send('Contact added');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.get('/contacts/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username }).populate('contacts');
        if (!user) {
            return res.status(400).send('User not found');
        }
        res.status(200).json(user.contacts);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

const users = {};

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('join', (username) => {
        socket.username = username;
        users[username] = socket;
    });

    socket.on('private message', ({ to, message }) => {
        if (users[to]) {
            users[to].emit('private message', { from: socket.username, message });
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        delete users[socket.username];
    });
});

server.listen(3001, () => {
    console.log('listening on *:3001');
});