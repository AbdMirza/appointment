const bcrypt = require('bcryptjs');

module.exports = [
    { id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 8), role: 'admin' },
    { id: 2, username: 'staff', password: bcrypt.hashSync('staff123', 8), role: 'staff' },
    { id: 3, username: 'customer', password: bcrypt.hashSync('cust123', 8), role: 'customer' }
];
