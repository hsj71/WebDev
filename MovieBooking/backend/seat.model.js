const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  number: String,
  status: {
    type: String,
    enum: ['available', 'booked'],
    default: 'available',
  },
});

module.exports = mongoose.model('Seat', seatSchema);
