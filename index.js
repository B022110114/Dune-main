require('dotenv').config();  // Load environment variables
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Import functions
const {
  createUser,
  createMonster,
} = require('./Functions/CreateFunction');

const {
  findUserByUsername,
} = require('./Functions/FindFunction');

const {
  existingUser,
  existingMonster,
} = require('./Functions/ExistingFunction');

const {
  generateToken,
  ADMIN,
  USER
} = require('./Functions/TokenFunction');

const {
  loginUser,
  slayRandomMonster,
  deleteUser,
} = require('./Functions/OtherFunction');

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

app.post('/login', async (req, res) => {
  try {
      const { username, password } = req.body;
      const userData = await loginUser(client, username, password);
      res.status(200).json({ message: "Login successful", user: userData });
  } catch (error) {
      res.status(400).send(error.message); 
  }
});

// Route to generate token
app.post('/generate-token', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send('Username and password are required.');
    }

    // Check if the user exists and is an admin
    const user = await findUserByUsername(client, username);

    if (!user) {
      return res.status(404).send('User not found.');
    }

    // Compare the password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send('Invalid password.');
    }

    // Check if the user has an admin role
    if (user.role !== 'admin') {
      return res.status(403).send('Access denied: Only admins can generate a token.');
    }

    // If the user is an admin, generate the token
    const token = await generateToken(user);

    res.status(200).json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).send('Error generating token');
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

app.get('/admin-only', ADMIN, (req, res) => {
  res.send("Welcome, admin!");
});

/**
* --- Monsters CRUD ---
*/

// Create Monster
// Create Monster Route (Protected by token)
app.post('/createMonster', USER, async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// Update Monster Route (Protected by token)
app.put('/updateMonster/:monster_id', USER, async (req, res) => {
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

// Delete Monster Route (Protected by token)
app.delete('/deleteMonster/:monster_id', USER, async (req, res) => {
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

app.post('/slay-random-monster', async (req, res) => {
  try {
      const { username } = req.body;

      if (!username) {
          return res.status(400).json({ error: 'Username is required' });
      }

      const result = await slayRandomMonster(client, username);
      res.status(200).json(result);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Server start
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});