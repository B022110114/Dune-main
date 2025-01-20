const bcrypt = require('bcrypt');

async function loginUser(client, username, password) {
    try {
        // Check for missing inputs
        if (!username) {
            throw new Error("Username is required. Please provide a username.");
        }
        if (!password) {
            throw new Error("Password is required. Please provide a password.");
        }

        const database = client.db('TheDune');
        const collection = database.collection('users');

        // Find the user by username
        const user = await collection.findOne({ username: username });
        if (!user) {
            throw new Error("User not found. Please check your username.");
        }

        // Compare the hashed password with the entered password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Incorrect password. Please try again.");
        }

        // If login is successful, return user data (you can also create a session or token here)
        console.log("Login successful");
        return { username: user.username, email: user.email, role: user.role, profile: user.profile };

    } catch (error) {
        console.error("Error logging in:", error.message);
        throw error; // Re-throw the error to be handled by the calling function
    }
}

async function slayRandomMonster(client, username) {
    try {
        const database = client.db('TheDune');
        const usersCollection = database.collection('users');
        const monstersCollection = database.collection('monster');

        // Fetch the user
        const user = await usersCollection.findOne({ username: username });

        if (!user) {
            throw new Error('User not found');
        }

        // Ensure experience and level are initialized if not set
        user.experience = user.experience || 0; // Default to 0 if experience is not set
        user.level = user.level || 1; // Default to level 1 if level is not set

        // Fetch all monsters and select one randomly
        const monsters = await monstersCollection.find({}).toArray();
        if (monsters.length === 0) {
            throw new Error('No monsters available');
        }

        const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];

        // Define points by monster rarity
        const rarityPoints = {
            common: 10,
            rare: 25,
            epic: 50,
            legendary: 100,
        };

        const rarity = randomMonster.attributes.rarity || 'common'; // Default to 'common' if rarity not specified
        const points = rarityPoints[rarity] || 10; // Default to 'common' points if no rarity match

        // Add points to user's experience
        user.experience += points;

        // Check for level-up logic
        const levelUpThreshold = user.level * 100; // Example: 100 experience points per level
        if (user.experience >= levelUpThreshold) {
            user.level += 1;  // Increment the level
            console.log(`User leveled up to Level ${user.level}`);
        }

        // Update the user profile with the new experience and level (no attributes or inventory)
        const updateResult = await usersCollection.updateOne(
            { username: username },
            {
                $set: { 
                    experience: user.experience,
                    level: user.level
                }
            }
        );

        // Check if the document was actually updated
        if (updateResult.matchedCount === 0) {
            throw new Error('User profile update failed');
        }

        // Return success message with updated user data
        return {
            message: `${user.username} defeated ${randomMonster.name}!`,
            user: {
                level: user.level,
                experience: user.experience
            }
        };
    } catch (error) {
        console.error("Error in slayRandomMonster:", error);
        throw error;
    }
}

async function deleteUser(client, username) {
    try {
        const database = client.db('TheDune');
        const collection = database.collection('users');

        await collection.deleteOne({ username: username });
        console.log("User deleted successfully");
    } catch (error) {
        console.error("Error deleting user:", error);
    }
}

module.exports = {
    loginUser,
    slayRandomMonster,
    deleteUser
};