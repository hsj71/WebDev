const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const Seat = require('./models/seat.model');
const User = require('./models/user.model');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = 'secret123';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/moviebooking', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// JWT middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(403).json({ message: 'Invalid token' });
  }
}

// ========== AUTH ROUTES ==========

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: 'User exists' });

  const user = await User.create({ username, password });
  res.json({ message: 'Registered successfully', userId: user._id });
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id }, SECRET);
  res.json({ token });
});

// ========== SEAT ROUTES ==========

// Add seats
app.post('/add-seats', async (req, res) => {
  const { count } = req.body;
  const seats = [];

  for (let i = 1; i <= count; i++) {
    seats.push({ number: `S${i}`, status: 'available' });
  }

  await Seat.insertMany(seats);
  res.json({ message: 'Seats added' });
});

// Get all seats
app.get('/seats', async (req, res) => {
  const seats = await Seat.find();
  res.json(seats);
});

// Book seats (protected)
app.post('/book-seats', verifyToken, async (req, res) => {
  const { seatIds } = req.body;
  const results = [];

  for (let id of seatIds) {
    const seat = await Seat.findOne({ _id: id, status: 'available' });
    if (seat) {
      seat.status = 'booked';
      await seat.save();
      results.push({ id, status: 'booked' });
    } else {
      results.push({ id, status: 'unavailable' });
    }
  }

  res.json({ results });
});

// Start server
app.listen(5000, () => console.log('Backend running on http://localhost:5000'));
