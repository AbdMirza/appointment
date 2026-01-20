const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../../config/env');
const users = require('../users/userModel'); // ✅ Correct path

exports.login = (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    res.json({ token });
};
