async function existingUser(client, username) {
    try {
        const database = client.db('TheDune');
        const collection = database.collection('users');

        const user = await collection.findOne({ username: username });
        return user !== null;
    } catch (error) {
        console.error("Error checking existing user:", error);
        throw error;
    }
}

async function existingMonster(client, monster_id) {
    try {
        const database = client.db('TheDune');
        const collection = database.collection('monster');

        const monster = await collection.findOne({ monster_id: monster_id });
        return monster !== null;
    } catch (error) {
        console.error("Error checking existing monster:", error);
        throw error;
    }
}

module.exports = {
    existingUser,
    existingMonster
};