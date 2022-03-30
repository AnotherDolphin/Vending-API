const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    credit: { type: Number, default: 0 },
    role: { type: String, default: 'buyer' },
})

module.exports = mongoose.model("User", userSchema)