# Vending Machine API

Product trading REST API where sellers can add and update their products and users can deposit and purchase in stock products.

### Built using
- Node js on **Express**
- **MongoDB** with Mongoose schemas
- Encryption with **bcrypt**
- Token authentication with **JWT**
- Data formatted as **application/json**

### Features
- User registration as buyer or seller
- Password encryption
- Auth Token issued on Login
- Sellers can add and update their products
- Buyers can deposit and purhase products
- Product availability and buyer's credit checked before confirming order
- Auto update buyer's credit and product stock after order

## Endpoints

### User operations:

**POST** `/register` to create a user

**POST** `/login` for user login - returns token

**GET** `/user` [requires token] to view account details

**PUT** `/user` [requires token] to update account details 

**DELETE** `/user` [requires token] to get account details

### Product operations:

**POST** `/product` [token + seller role] create a new product

**GET** `/product/:id` view a product by id

**PUT** `/product/:id` [token + seller of this product] update a product

**DELETE** `/product/:id` [token + seller of this product]  delete a product

### Transaction Operations:

**PUT** `/deposit:amount` [token + buyer role] add credit - only 5|10|20|50|100 cents will be accepted

**POST** `/buy` [token + buyer role] make a transaction - update in user credit and product stock

**PUT** `/reset` [token + buyer role] resets buyer's credit to zero

### EDGE CASES
Issues, concerns, and features that can be added further in development
 - There are still no admin priviledges and only account holders can make update/delete their respective accounts
 - No logout endpoint is implemented
 - Tokens don't have an expire duration yet which is not ideal for a transactinal app
 - A user can't have both 'buyer' and 'seller' as a role, which would be more efficient instead of having to create two accounts for one trader who wants to play both roles


## USAGE

Requires local [MongoDB](https://stackoverflow.com/a/37548118/17797947) server and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) environment

- Clone this repo to a local directory
- add a new `vending_machine` database in mongoDB
- intall npm dependecies with `npm i dotenv bcrypt express jsonwebtoken mongoose`
- run `node server.js` to start the app
- start making requests using any REST client app or VSCode extension
  - working request examples can be fount in request_examples.rest file