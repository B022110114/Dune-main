async function findUserByUsername(client, username) {
    try {
        const database = client.db('TheDune');
        const collection = database.collection('users');

        const user = await collection.findOne({ username: username });
        return user;
    } catch (error) {
        console.error("Error finding user by username:", error);
    }
}


module.exports = {
    findUserByUsername
};