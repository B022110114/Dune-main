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

        // Make sure the user profile has experience field initialized
        if (!user.profile) {
            user.profile = {
                experience: 0,
                level: 1,
                strength: 0,
                dexterity: 0,
                intelligence: 0,
                inventory: []
            };
        }

        // Convert experience and level to plain JavaScript numbers if necessary
        user.profile.experience = Number(user.profile.experience);
        user.profile.level = Number(user.profile.level);

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
        user.profile.experience += points;

        // Check for level-up logic
        const levelUpThreshold = user.profile.level * 100; // Example: 100 experience points per level
        if (user.profile.experience >= levelUpThreshold) {
            user.profile.level += 1;
            user.profile.experience -= levelUpThreshold; // Carry over remaining experience
            console.log(`User leveled up to Level ${user.profile.level}`);
        }

        // Ensure we're updating the profile in the correct structure
        const updateResult = await usersCollection.updateOne(
            { username: username },
            {
                $set: { 'profile': user.profile }  // Correctly update the profile object
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
                level: user.profile.level,
                experience: user.profile.experience,
                attributes: user.profile,
                inventory: user.profile.inventory
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
    slayRandomMonster,
    deleteUser
};