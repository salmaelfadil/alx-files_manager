const sha1 = require('sha1');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class userController {
  static async postNew(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Missing email' });
        return;
      }
      const { password } = req.body;
      if (!password) {
        res.status(400).json({ error: 'Missing password' });
        return;
      }
      const user = await (await dbClient.usersCollection()).findOne({ email });
      if (user) {
        res.status(400).json({ error: 'Already exist' });
        return;
      }
      const hashPass = sha1(password);
      const newUser = await dbClient.createUser(email, hashPass);
      const id = newUser.insertedId;
      res.status(201).json({ id, email });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      console.error('User ID not found in Redis');
      return response.status(401).json({ error: 'Unauthorized' });
    }
    const idObject = new ObjectID(userId);
    try {
      const user = await dbClient.usersCollection().findOne({ _id: idObject });
      if (!user) {
        console.error('User not found in MongoDB');
        return response.status(401).json({ error: 'Unauthorized' });
      }
      console.log('User found:', user);
      return response.status(200).json({ id: userId, email: user.email });
    } catch (error) {
      console.error('Error retrieving user from MongoDB:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }
}
module.exports = userController;
