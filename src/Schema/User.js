const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    Otp: { type: String  },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isverify:{ type: Boolean, default: false },
    isBlocked:{ type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    amount: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', userSchema);

