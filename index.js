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
  createTransaction,
  createWeapon
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

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to The Dune Game');
});

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
run().catch(console.dir);

// Routes for Create Functions
app.post('/createUser', async (req, res) => {
  try {
    const { user_id, username, password, email } = req.body;
    await createUser(client, user_id, username, password, email);
    res.status(201).send("User created successfully");
  } catch (error) {
    res.status(500).send("Error creating user");
  }
});

app.post('/createItem', async (req, res) => {
  try {
    const { item_id, name, description, type, attributes, rarity } = req.body;
    await createItem(client, item_id, name, description, type, attributes, rarity);
    res.status(201).send("Item created successfully");
  } catch (error) {
    res.status(500).send("Error creating item");
  }
});

app.post('/createMonster', async (req, res) => {
  try {
    const { monster_id, name, attributes, location } = req.body;
    await createMonster(client, monster_id, name, attributes, location);
    res.status(201).send("Monster created successfully");
  } catch (error) {
    res.status(500).send("Error creating monster");
  }
});

app.post('/createTransaction', async (req, res) => {
  try {
    const { transaction_id, user_id, item_id, transaction_type, amount, date } = req.body;
    await createTransaction(client, transaction_id, user_id, item_id, transaction_type, amount, date);
    res.status(201).send("Transaction created successfully");
  } catch (error) {
    res.status(500).send("Error creating transaction");
  }
});

app.post('/createWeapon', async (req, res) => {
  try {
    const { weapon_id, name, description, damage, type, attributes } = req.body;
    await createWeapon(client, weapon_id, name, description, damage, type, attributes);
    res.status(201).send("Weapon created successfully");
  } catch (error) {
    res.status(500).send("Error creating weapon");
  }
});

// Routes for Find Functions
app.get('/findUserByUsername', async (req, res) => {
  try {
    const { username } = req.query;
    const user = await findUserByUsername(client, username);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).send("Error finding user by username");
  }
});

app.get('/findUserById', async (req, res) => {
  try {
    const { user_id } = req.query;
    const user = await findUserById(client, user_id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).send("Error finding user by ID");
  }
});

// Routes for Existing Functions
app.get('/existingUser', async (req, res) => {
  try {
    const { user_id } = req.query;
    const exists = await existingUser(client, user_id);
    res.status(200).json({ exists });
  } catch (error) {
    res.status(500).send("Error checking existing user");
  }
});

app.get('/existingItem', async (req, res) => {
  try {
    const { item_id } = req.query;
    const exists = await existingItem(client, item_id);
    res.status(200).json({ exists });
  } catch (error) {
    res.status(500).send("Error checking existing item");
  }
});

app.get('/existingMonster', async (req, res) => {
  try {
    const { monster_id } = req.query;
    const exists = await existingMonster(client, monster_id);
    res.status(200).json({ exists });
  } catch (error) {
    res.status(500).send("Error checking existing monster");
  }
});

app.get('/existingWeapon', async (req, res) => {
  try {
    const { weapon_id } = req.query;
    const exists = await existingWeapon(client, weapon_id);
    res.status(200).json({ exists });
  } catch (error) {
    res.status(500).send("Error checking existing weapon");
  }
});

// Routes for Other Functions
app.delete('/deleteUser', async (req, res) => {
  try {
    const { user_id } = req.body;
    await deleteUser(client, user_id);
    res.status(200).send("User deleted successfully");
  } catch (error) {
    res.status(500).send("Error deleting user");
  }
});

app.get('/randomMonster', async (req, res) => {
  try {
      const database = client.db('TheDune');
      const monstersCollection = database.collection('monster');

      const monsters = await monstersCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
      res.status(200).json(monsters[0]);
  } catch (error) {
      res.status(500).json({ error: "Error fetching random monster" });
  }
});

app.post('/slayMonster', async (req, res) => {
  try {
      const { user_id, monster_id } = req.body;

      // Call the monsterslain function
      const result = await monsterslain(client, user_id, monster_id);

      res.status(200).json(result);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.get('/reportUser', async (req, res) => {
  try {
    const { user_id } = req.query;
    const report = await reportUser(client, user_id);
    res.status(200).json(report);
  } catch (error) {
    res.status(500).send("Error reporting user");
  }
});

// Routes for View Functions
app.get('/viewLeaderboard', async (req, res) => {
  try {
    const leaderboard = await viewLeaderboard(client);
    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).send("Error viewing leaderboard");
  }
});

app.get('/viewUserByAdmin', async (req, res) => {
  try {
    const { user_id } = req.query;
    const user = await viewUserByAdmin(client, user_id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).send("Error viewing user by admin");
  }
});

app.post('/generateToken', async (req, res) => {
  try {
      const { user_id, role } = req.body;

      // Assuming you have a user validation function
      const user = { user_id, role }; // You should fetch the user from DB here based on user_id if needed

      // Call the generateToken function
      const token = await generateToken(user);
      res.status(200).json({ token });
  } catch (error) {
      res.status(500).json({ message: "Error generating token", error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});