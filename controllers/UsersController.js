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

  static async getMe(req, res) {
    const token = await req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      try {
        const user = await dbClient.usersCollection().findOne({ _id: new ObjectID(userId.toString()) });
        res.status(200).json({ id: userId, email: user.email });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
module.exports = userController;
