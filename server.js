require('dotenv').config()
const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const mongoose = require('mongoose')
const Product = require("./Product")
const User = require("./User")
mongoose.connect("mongodb://localhost:27017/vending_machine")

const app = express()
app.use(express.json())

const checkToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader?.split(' ')[1]
    if(!token) return res.sendStatus(401)
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) =>{
        if(err) return res.sendStatus(403)
        req.user = await User.findOne({_id: user._id})
        next()
    })
}

// ----------------------------
// User enpoints (CRUD & login)

// register (create)
app.post('/register', async (req, res) => {
    try {
        const hashedPass = await bcrypt.hash(req.body.password, 10)
        const user = new User({ username: req.body.username, password: hashedPass })
        if(req.body.role) user.role = req.body.role
        await user.save()
        res.status(201).send('Registration Successful')
    } catch {
        res.status(500).send()
    }
})

// login (authenticate and send JWT)
app.post('/login', (req, res) => {
    User.findOne({username: req.body.username}, async (err, user)=>{
        if(err) return console.log(err)
        if(user == null) return res.status(400).send('Cannot find user')
        if(await bcrypt.compare(req.body.password, user.password)){
            const token = jwt.sign(user.toJSON(), process.env.ACCESS_TOKEN_SECRET)
            res.json({ token: token })
        } else res.send('not authorized')
    }).clone().catch(err=> console.log(err))
})

// get user details (read) -- requires authentication
app.get('/user', checkToken, (req, res) => {
    User.findOne({_id: req.user._id}, (err, user) => {
        if(err) return console.log(err)
        if(user == null) res.send('Please login')
        else res.json(user)
    })
})

// update user details (update) -- requires authentication
app.put('/user', checkToken, (req, res) => {
    const updates = {}
    if(req.body.username) updates['username'] = req.body.username
    if(req.body.password) updates['password'] = bcrypt.hash(req.body.password, 10)
    User.findOneAndUpdate({_id: req.user._id}, updates, (err, user) => {
        if(err) return console.log(err)
        if(user == null) return res.send('please login')
        res.send('Update Successful')
    })
})

// remove a user (delete) -- requires authentication
app.delete('/user', checkToken, async (req, res) => {
    await User.deleteOne({_id: req.user._id})
    res.send('User has been Deleted, please login.')
})

// -------------
// PRODUCTS CRUD

// add Product (create) -- requires authenticated seller
app.post('/product', checkToken, async (req, res) => {
    if (req.user.role != 'seller') return res.send('Unallowed: Only Sellers can add Products')
    const product = new Product(req.body)
    product.sellerId = req.user._id
    try {
        await product.save()
        res.status(201).send('Product added Successfully.')
    } catch {
        res.status(500).send()
    }
})

// view product by id (read)
app.get('/product/:id', async (req, res) => {
    const checkProduct = await Product.findOne({_id: req.params.id})
    if(product == null) return res.send('Product not found')
    res.json(product)
})

// dynamic route to update product -- requries product's seller
app.put('/product/:id', checkToken, async (req, res) => {
    const checkProduct = await Product.findOne({_id: req.params.id})
    if (checkProduct != null && req.user._id != checkProduct.sellerId ) return res.send('Unallowed: only a product\'s seller can update it')
    Product.findOneAndUpdate({_id: req.params.id}, req.body, (err, product)=> {
        if(err) return console.log(err)
        if(product == null) return res.send('Product not found')
        console.log(req.params.id, product._id);
        res.send('Product Update Successful.')
    })
})

// dynamic route to delete product -- requires product's seller
app.delete('/product/:id', checkToken, async (req, res) => {
    const checkProduct = await Product.findOne({_id: req.params.id})
    if (req.user._d != checkProduct.sellerId ) return res.send('Unallowed: this product\'s seller can delete it')
    await Product.deleteOne({_id: req.params.id})
    res.send('Product has been Deleted')
})

// ------------------
// BUYER TRANSACTIONS

// only buyers can deposit, and in 5, 10, 20, 50, or 100 cents
app.put('/deposit/:amount', checkToken, async (req,res) => {
    if(req.user.role != "buyer") return res.send('Unallowed: only buyer accounts can deposit credit')
    if(![5, 10, 20, 50, 100].includes(parseInt(req.params.amount))) 
    return res.send ('Please enter a valid amount: 5, 10, 20, 50, or 100 cents')
    let newCredit = req.user.credit + parseInt(req.params.amount)
    User.findOneAndUpdate({_id: req.user._id}, {credit: newCredit}, (err, user) => {
        if(err) return console.log(err)
        if(user == null) return res.send('User Invalid: login and try again')
        res.send('Amount deposited succesfully, your credit is now ' + newCredit)
    })
})

// only buyers can buy - product's available stock is checked and updated
app.post('/buy', checkToken, async (req, res) => {
    const product = await Product.findOne({_id: req.body.productId})
    if(product == null) return res.send('Invalid product ID')
    if(product.amountAvailable < req.body.number) return res.send(`Product only has ${req.body.number} in stock`)
    const totalAmount = product.cost * req.body.number
    const buyer = await User.findOne({_id: req.user._id})
    if(buyer.credit < totalAmount) return res.send('Not enough credit to make this purchase')
    let leftover = buyer.credit - totalAmount
    User.findOneAndUpdate({_id: buyer._id}, {credit: leftover}, async (err, user) => {
        if(err) return console.log(err)
        if(user == null) return res.send('User Invalid: login and try again')
        let newStock = product.amountAvailable - req.body.number
        await Product.findOneAndUpdate({_id: product._id}, {amountAvailable: newStock})
        res.send('Purchase successfull, your remaining credit is ' + user.credit)
    })
})

// buyers can reset their deposit/credit to zero
app.put('/reset', checkToken, (req, res) => {
    if(req.user.role != "buyer") return res.send('Unallowed: only buyer accounts clear credit')
    User.findOneAndUpdate({_id: req.user._id}, {credit: 0}, (err, user) => {
        if(err) return console.log(err)
        if(user == null) return res.send('User Invalid: login and try again')
        res.send('Your credit amount has been cleared')
    })
})

app.listen(3000)