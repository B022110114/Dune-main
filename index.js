require('dotenv').config();  // Load environment variables
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const loginAttempts = {};
const helmet = require('helmet');

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
app.use(helmet());  // Use helmet to set secure HTTP headers

// Rate Limiting Middleware: Allow max 3 requests per 5 minute per IP
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to The Dune Game');
});

// MongoDB client
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
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

// Password Policy (minimum 8 characters, one uppercase, one lowercase, one number, one special character)
const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Create User
app.post('/createUser', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Validate required fields
    if (!username || !password || !email) {
      return res.status(400).send("All fields (username, password, email) are required.");
    }

    // Check password policy
    if (!passwordPolicy.test(password)) {
      return res.status(400).send("Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
    }

    await createUser(client, username, password, email);
    res.status(201).send("User created successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Login User
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

    const user = await findUserByUsername(client, username);

    if (!user) {
      return res.status(404).send('User not found.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send('Invalid password.');
    }

    if (user.role !== 'admin') {
      return res.status(403).send('Access denied: Only admins can generate a token.');
    }

    const token = await generateToken(user);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).send('Error generating token');
  }
});

// Read User
app.get('/getUser/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const database = client.db('TheDune');
    const collection = database.collection('users');
    const user = await collection.findOne({ username });

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
    const username = req.params.username;
    const { password, email } = req.body;

    const database = client.db('TheDune');
    const collection = database.collection('users');

    const user = await collection.findOne({ username });

    if (!user) {
      return res.status(404).send("User not found");
    }

    let updateData = {};

    if (password && password !== user.password) {
      updateData.password = bcrypt.hashSync(password, 10);
    }

    if (email && email !== user.email) {
      updateData.email = email;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).send("No changes detected");
    }

    const updateResult = await collection.updateOne(
      { username: username },
      { $set: updateData }
    );

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
    const username = req.params.username;
    const database = client.db('TheDune');
    const collection = database.collection('users');

    const deleteResult = await collection.deleteOne({ username });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).send("User not found");
    }

    res.status(200).send("User deleted successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
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