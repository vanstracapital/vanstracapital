const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true 
  },
  code: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    // This line tells MongoDB to delete the document 300 seconds (5 minutes) after createdAt
    expires: 300 
  }
});

module.exports = mongoose.model('Otp', otpSchema);