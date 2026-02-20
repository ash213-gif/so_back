const User = require('../Schema/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();


exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.signup = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        const newUser = await user.save();
        const token = jwt.sign({ email: newUser.email, id: newUser._id }, process.env.token , { expiresIn: '12h' });
        res.status(201).json({ result: newUser, token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) return res.status(404).json({ message: "User doesn't exist." });

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials." });

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, process.env.token, { expiresIn: '1h' });
        const userObj = existingUser.toObject ? existingUser.toObject() : existingUser;
        if (userObj.password) delete userObj.password;
        res.status(200).json({ message: 'Login Successful', result: userObj, token });
        
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong.' });
    }
};
