const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    amountAvailable: { type: Number, default: 0 },
    cost: Number,
    productName: String,
    sellerId: mongoose.SchemaTypes.ObjectId,
})

module.exports = mongoose.model("Product", productSchema)

