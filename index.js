require('dotenv').config();  // Load environment variables
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');

// Import functions
const {
  createUser,
  createItem,
  createMonster,
  createWeapon,
  createTransaction
} = require('./Functions/CreateFunction');

const {
  findUserByUsername,
  findUserById
} = require('./Functions/FindFunction');

const {
  existingUser,
  existingItem,
  existingMonster,
  existingWeapon
} = require('./Functions/ExistingFunction');

const {
  generateToken,
  ADMIN,
  USER
} = require('./Functions/TokenFunction');

const {
  monsterslain,
  deleteUser,
  reportUser
} = require('./Functions/OtherFunction');

const {
  viewLeaderboard,
  viewUserByAdmin
} = require('./Functions/ViewFunction');

// Middleware
app.use(express.json());

// MongoDB client
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

// Connect to MongoDB
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error in run function:", error);
  }
}

// Connect to DB
run().catch(console.error);

// API Routes

// User Routes
app.post('/api/users', async (req, res) => {
  const { user_id, username, password, email, role } = req.body;
  await createUser(client, user_id, username, password, email, role);
  res.status(201).send("User created");
});

app.get('/api/users/:user_id', async (req, res) => {
  const user = await findUserById(client, req.params.user_id);
  res.status(200).json(user);
});

// Item Routes
app.post('/api/items', async (req, res) => {
  const { item_id, name, description, type, attributes, rarity } = req.body;
  await createItem(client, item_id, name, description, type, attributes, rarity);
  res.status(201).send("Item created");
});

app.get('/api/items/:item_id', async (req, res) => {
  const item = await findItemById(client, req.params.item_id);
  res.status(200).json(item);
});

// Weapon Routes
app.post('/api/weapons', async (req, res) => {
  const { weapon_id, name, description, damage, type, attributes } = req.body;
  await createWeapon(client, weapon_id, name, description, damage, type, attributes);
  res.status(201).send("Weapon created");
});

app.get('/api/weapons/:weapon_id', async (req, res) => {
  const weapon = await findWeaponById(client, req.params.weapon_id);
  res.status(200).json(weapon);
});

// Monster Routes
app.post('/api/monsters', async (req, res) => {
  const { monster_id, name, attributes, location } = req.body;
  await createMonster(client, monster_id, name, attributes, location);
  res.status(201).send("Monster created");
});

app.get('/api/monsters/:monster_id', async (req, res) => {
  const monster = await findMonsterById(client, req.params.monster_id);
  res.status(200).json(monster);
});

// Transaction Routes
app.post('/api/transactions', async (req, res) => {
  const { transaction_id, user_id, item_id, transaction_type, amount, date } = req.body;
  await createTransaction(client, transaction_id, user_id, item_id, transaction_type, amount, date);
  res.status(201).send("Transaction created");
});

// Leveling Routes (Monsters Slain)
app.post('/api/users/:user_id/monsterslain/:monster_id', async (req, res) => {
  const result = await monsterslain(client, req.params.user_id, req.params.monster_id);
  res.status(200).json(result);
});

// Admin Routes
app.get('/api/users/:user_id/report', ADMIN, async (req, res) => {
  const userReport = await reportUser(client, req.params.user_id);
  res.status(200).json(userReport);
});

// Leaderboard Route
app.get('/api/leaderboard', async (req, res) => {
  const leaderboard = await viewLeaderboard(client, req.query.user_id);
  res.status(200).json(leaderboard);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = {
  client,
  express,
  app
};