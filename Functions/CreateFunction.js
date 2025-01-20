const { r } = require("tar");
const { existingUser, existingItem, existingMonster, existingWeapon } = require('./ExistingFunction');
const bcrypt = require('bcrypt');

async function createUser(client, username, password, email, role = "user") {
    try {
        // Check for missing inputs
        if (!username) {
            throw new Error("Username is required. Please provide a username.");
        }
        if (!password) {
            throw new Error("Password is required. Please provide a password.");
        }
        if (!email) {
            throw new Error("Email is required. Please provide an email address.");
        }

        const database = client.db('TheDune');
        const collection = database.collection('users');

        // Check if the user already exists
        const userExists = await existingUser(client, username);
        if (userExists) {
            throw new Error("User already exists");
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10); // Generate a salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

        console.log("Hashed password:", hashedPassword);

        const user = {
            username: username,
            password: hashedPassword, // Store the hashed password
            email: email,
            role: role,
            registration_date: new Date().toISOString(),
            // Initialize experience and level fields
            experience: 0, // Set initial experience to 0
            level: 1 // Set initial level to 1
        };

        await collection.insertOne(user);
        console.log("User created successfully");
    } catch (error) {
        console.error("Error creating user:", error.message);
        throw error; // Re-throw the error to be handled by the calling function
    }
}

async function createMonster(client, monster_id, name, attributes, location) {
    try {
        const database = client.db('TheDune');
        const collection = database.collection('monster');

        // Check if the monster already exists
        const monsterExists = await existingMonster(client, monster_id);
        if (monsterExists) {
            throw new Error("Monster with this ID already exists");
        }

        const monster = {
            monster_id: monster_id,
            name: name,
            attributes: attributes,
            location: location
        };

        await collection.insertOne(monster);
        console.log("Monster created successfully");
    } catch (error) {
        console.error("Error creating monster:", error);
        throw error;
    }
}

module.exports = {
    createUser,
    createMonster
};