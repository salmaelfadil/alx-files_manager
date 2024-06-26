const sha1 = require('sha1');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
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
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      const userObjId = new ObjectID(userId);
      const users = await dbClient.usersCollection();
      const user = await users.findOne({ _id: userObjId });
      if (user) {
        res.status(200).json({ id: userId, email: user.email });
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
module.exports = UsersController;
