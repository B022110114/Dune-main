async function monsterslain(client, user_id, monster_id) {
    try {
        const database = client.db('TheDune');
        const usersCollection = database.collection('users');
        const monstersCollection = database.collection('monster');

        // Fetch the user and monster details
        const user = await usersCollection.findOne({ user_id: user_id });
        const monster = await monstersCollection.findOne({ monster_id: monster_id });

        if (!user) {
            throw new Error('User not found');
        }
        if (!monster) {
            throw new Error('Monster not found');
        }

        // Define points by monster rarity
        const rarityPoints = {
            common: 10,
            rare: 25,
            epic: 50,
            legendary: 100,
        };

        const rarity = monster.attributes.rarity || 'common'; // Default to 'common' if rarity not specified
        const points = rarityPoints[rarity] || 10; // Default to 'common' points if no rarity match

        // Add points to user's experience
        user.profile.experience += points;

        // Check for level-up logic (optional)
        const levelUpThreshold = user.profile.level * 100; // Example: 100 experience points per level
        if (user.profile.experience >= levelUpThreshold) {
            user.profile.level += 1;
            user.profile.experience -= levelUpThreshold; // Carry over remaining experience
            console.log(`User leveled up to Level ${user.profile.level}`);
        }

        // Update user in the database
        await usersCollection.updateOne(
            { user_id: user_id },
            { $set: { profile: user.profile } }
        );

        return {
            message: `${user.username} slayed ${monster.name} and earned ${points} experience points!`,
            new_experience: user.profile.experience,
            level: user.profile.level,
        };
    } catch (error) {
        console.error("Error in monsterslain:", error);
        throw error;
    }
}

module.exports = {
    monsterslain,
    deleteUser,
    reportUser
};

async function deleteUser(client, user_id) {
    try {
        const database = client.db('TheDune');
        const collection = database.collection('users');

        await collection.deleteOne({ user_id: user_id });
        console.log("User deleted successfully");
    } catch (error) {
        console.error("Error deleting user:", error);
    }
}

async function reportUser(client, user_id) {
    try {
        const database = client.db('TheDune');
        const collection = database.collection('users');

        const user = await collection.findOne({ user_id: user_id });
        if (user) {
            return {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                profile: user.profile
            };
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error("Error reporting user:", error);
    }
}

module.exports = {
    monsterslain,
    deleteUser,
    reportUser
};