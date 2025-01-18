const { r } = require("tar");
const { existingUser, existingItem, existingMonster, existingWeapon } = require('./ExistingFunction');

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

        const user = {
            username: username,
            password: password,
            email: email,
            role: role,
            registration_date: new Date().toISOString(),
            profile: {
                level: 1,
                experience: 0,
                attributes: {
                    strength: 0,
                    dexterity: 0,
                    intelligence: 0
                }
            },
            inventory: []
        };

        await collection.insertOne(user);
        console.log("User created successfully");
    } catch (error) {
        console.error("Error creating user:", error.message);
        throw error; // You can re-throw the error if needed to handle it upstream
    }
}

async function createItem(client, item_id, name, description, type, attributes, rarity) {
    try {
        const database = client.db('TheDune');
        const collection = database.collection('items');

        // Check if the item already exists
        const itemExists = await existingItem(client, item_id);
        if (itemExists) {
            throw new Error("Item with this ID already exists");
        }

        const item = {
            item_id: item_id,
            name: name,
            description: description,
            type: type,
            attributes: attributes,
            rarity: rarity
        };

        await collection.insertOne(item);
        console.log("Item created successfully");
    } catch (error) {
        console.error("Error creating item:", error);
        throw error;
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

async function createWeapon(client, weapon_id, name, description, damage, type, attributes) {
    try {
        const database = client.db('TheDune');
        const collection = database.collection('weapons');

        // Check if the weapon already exists
        const weaponExists = await existingWeapon(client, weapon_id);
        if (weaponExists) {
            throw new Error("Weapon with this ID already exists");
        }

        const weapon = {
            weapon_id: weapon_id,
            name: name,
            description: description,
            damage: damage,
            type: type,
            attributes: attributes
        };

        await collection.insertOne(weapon);
        console.log("Weapon created successfully");
    } catch (error) {
        console.error("Error creating weapon:", error);
        throw error;
    }
}

module.exports = {
    createUser,
    createItem,
    createMonster,
    createWeapon
};