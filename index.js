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

/**
 * --- Users CRUD ---
 */

// Create User
app.post('/createUser', async (req, res) => {
  try {
      const { username, password, email } = req.body;
      await createUser(client, username, password, email);
      res.status(201).send("User created successfully");
  } catch (error) {
      res.status(400).send(error.message); 
  }
});

// Read User
app.get('/getUser/:username', async (req, res) => {
  try {
      const username = req.params.username; // Use the correct variable for the parameter
      const database = client.db('TheDune');
      const collection = database.collection('users');
      const user = await collection.findOne({ username }); // Query by username

      if (!user) {
          return res.status(404).send("User not found");
      }
      res.status(200).json(user);
  } catch (error) {
      res.status(500).send(error.message);
  }
});

// Update User
app.put('/updateUser/:username', async (req, res) => {
  try {
      const username = req.params.username; // Get the username from the URL params
      const { password, email } = req.body; // Get the updated values from the request body
      
      const database = client.db('TheDune');
      const collection = database.collection('users');
      
      // Find the existing user
      const user = await collection.findOne({ username: username });

      // Check if user exists
      if (!user) {
          return res.status(404).send("User not found");
      }

      // Track if any field has been updated
      let updateData = {};
      
      // Only update if the password or email are different
      if (password && password !== user.password) {
          updateData.password = password; // Only update password if different
      }

      if (email && email !== user.email) {
          updateData.email = email; // Only update email if different
      }

      // If no actual changes were made, respond with an appropriate message
      if (Object.keys(updateData).length === 0) {
          return res.status(400).send("No changes detected");
      }

      // Perform the update if any changes are detected
      const updateResult = await collection.updateOne(
          { username: username }, // Find user by username
          { $set: updateData } // Update the fields that have changed
      );

      // Check if any document was actually updated
      if (updateResult.matchedCount === 0) {
          return res.status(404).send("User not found");
      }

      res.status(200).send("User updated successfully");

  } catch (error) {
      res.status(500).send(error.message);
  }
});

// Delete User
app.delete('/deleteUser/:username', async (req, res) => {
  try {
      const username = req.params.username; // Use the correct parameter from the request
      console.log("Username to delete:", username); // Debugging log
      
      const database = client.db('TheDune');
      const collection = database.collection('users');
      
      // Attempt to delete the user with the given username
      const deleteResult = await collection.deleteOne({ username: username });
      
      // Check if a document was deleted
      if (deleteResult.deletedCount === 0) {
          return res.status(404).send("User not found");
      }

      res.status(200).send("User deleted successfully");
  } catch (error) {
      console.error("Error deleting user:", error); // Log error for debugging
      res.status(500).send(error.message);
  }
});

/**
* --- Items CRUD ---
*/

// Create Item
app.post('/createItem', async (req, res) => {
  try {
      const { item_id, name, description, type, attributes, rarity } = req.body;

      // Log the request body to debug
      console.log("Request Body:", req.body);

      // Validate input to prevent empty inserts
      if (!item_id || !name || !description || !type || !rarity || !attributes) {
          return res.status(400).json({ error: "All fields are required" });
      }

      // Call createItem function with validated inputs
      await createItem(client, item_id, name, description, type, attributes, rarity);
      res.status(201).json({ message: "Item created successfully" });

  } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Read Item
app.get('/getItem/:item_id', async (req, res) => {
  try {
      const itemId = req.params.item_id;
      const database = client.db('TheDune');
      const collection = database.collection('items');
      const item = await collection.findOne({ item_id: itemId });

      if (!item) {
          return res.status(404).send("Item not found");
      }

      res.status(200).json(item);
  } catch (error) {
      res.status(500).send(error.message);
  }
});

// Update Item
app.put('/updateItem/:item_id', async (req, res) => {
  try {
      const itemId = req.params.item_id;
      const { name, description, type, attributes, rarity } = req.body;

      const database = client.db('TheDune');
      const collection = database.collection('items');

      const updateResult = await collection.updateOne(
          { item_id: itemId },
          { $set: { name, description, type, attributes, rarity } }
      );

      if (updateResult.matchedCount === 0) {
          return res.status(404).send("Item not found");
      }

      res.status(200).send("Item updated successfully");
  } catch (error) {
      res.status(500).send(error.message);
  }
});

// Delete Item
app.delete('/deleteItem/:item_id', async (req, res) => {
  try {
      const itemId = req.params.item_id;
      
      const database = client.db('TheDune');
      const collection = database.collection('items');
      
      const deleteResult = await collection.deleteOne({ item_id: itemId });
      
      if (deleteResult.deletedCount === 0) {
          return res.status(404).send("Item not found");
      }

      res.status(200).send("Item deleted successfully");
  } catch (error) {
      res.status(500).send(error.message);
  }
});

/**
* --- Monsters CRUD ---
*/

// Create Monster
app.post('/createMonster', async (req, res) => {
  try {
      const { monster_id, name, attributes, location } = req.body;

      // Log the request body to debug
      console.log("Request Body:", req.body);

      // Validate input to prevent empty inserts
      if (!monster_id || !name || !attributes || !location) {
          return res.status(400).json({ error: "All fields are required" });
      }

      // Call createMonster function with validated inputs
      await createMonster(client, monster_id, name, attributes, location);
      res.status(201).json({ message: "Monster created successfully" });

  } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Read Monster
app.get('/getMonster/:monster_id', async (req, res) => {
  try {
      const monsterId = req.params.monster_id;
      const database = client.db('TheDune');
      const collection = database.collection('monster');
      const monster = await collection.findOne({ monster_id: monsterId });

      if (!monster) {
          return res.status(404).send("Monster not found");
      }

      res.status(200).json(monster);
  } catch (error) {
      res.status(500).send(error.message);
  }
});

// Update Monster
app.put('/updateMonster/:monster_id', async (req, res) => {
  try {
      const monsterId = req.params.monster_id;
      const { name, attributes, location } = req.body;

      const database = client.db('TheDune');
      const collection = database.collection('monster');

      const updateResult = await collection.updateOne(
          { monster_id: monsterId },
          { $set: { name, attributes, location } }
      );

      if (updateResult.matchedCount === 0) {
          return res.status(404).send("Monster not found");
      }

      res.status(200).send("Monster updated successfully");
  } catch (error) {
      res.status(500).send(error.message);
  }
});

// Delete Monster
app.delete('/deleteMonster/:monster_id', async (req, res) => {
  try {
      const monsterId = req.params.monster_id;
      
      const database = client.db('TheDune');
      const collection = database.collection('monster');
      
      const deleteResult = await collection.deleteOne({ monster_id: monsterId });
      
      if (deleteResult.deletedCount === 0) {
          return res.status(404).send("Monster not found");
      }

      res.status(200).send("Monster deleted successfully");
  } catch (error) {
      res.status(500).send(error.message);
  }
});

/**
* --- Weapons CRUD ---
*/

// Create Weapon
app.post('/createWeapon', async (req, res) => {
  try {
      const { weapon_id, name, description, damage, type, attributes } = req.body;
      await createWeapon(client, weapon_id, name, description, damage, type, attributes);
      res.status(201).send("Weapon created successfully");
  } catch (error) {
      res.status(400).send(error.message); 
  }
});

// Read Weapon
app.get('/getWeapon/:weapon_id', async (req, res) => {
  try {
      const weaponId = req.params.weapon_id;
      const database = client.db('TheDune');
      const collection = database.collection('weapons');
      const weapon = await collection.findOne({ weapon_id: weaponId });

      if (!weapon) {
          return res.status(404).send("Weapon not found");
      }

      res.status(200).json(weapon);
  } catch (error) {
      res.status(500).send(error.message);
  }
});

// Update Weapon
app.put('/updateWeapon/:weapon_id', async (req, res) => {
  try {
      const weaponId = req.params.weapon_id;
      const { name, description, damage, type, attributes } = req.body;

      const database = client.db('TheDune');
      const collection = database.collection('weapons');

      const updateResult = await collection.updateOne(
          { weapon_id: weaponId },
          { $set: { name, description, damage, type, attributes } }
      );

      if (updateResult.matchedCount === 0) {
          return res.status(404).send("Weapon not found");
      }

      res.status(200).send("Weapon updated successfully");
  } catch (error) {
      res.status(500).send(error.message);
  }
});

// Delete Weapon
app.delete('/deleteWeapon/:weapon_id', async (req, res) => {
  try {
      const weaponId = req.params.weapon_id;
      
      const database = client.db('TheDune');
      const collection = database.collection('weapons');
      
      const deleteResult = await collection.deleteOne({ weapon_id: weaponId });
      
      if (deleteResult.deletedCount === 0) {
          return res.status(404).send("Weapon not found");
      }

      res.status(200).send("Weapon deleted successfully");
  } catch (error) {
      res.status(500).send(error.message);
  }
});

// Server start
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});