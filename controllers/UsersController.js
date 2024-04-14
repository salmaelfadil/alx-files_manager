const sha1 = require('sha1');
const dbClient = require('../utils/db');

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
}
module.exports = userController;
