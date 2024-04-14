const sha1 = require('sha1');
const dbClient = require('../utils/db');

class userController {
  static async postNew(req, res) {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      res.end();
      return;
    }
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      res.end();
      return;
    }
    const isThere = await dbClient.userExists(email);
    if (isThere) {
      res.status(400).json({ error: 'Already exist' });
      res.end();
      return;
    }
    const hashPass = sha1(password);
    const user = await dbClient.createUser(email, hashPass);
    const id = user.insertedId;
    res.status(201).json({ id, email });
    res.end();
  }
}
module.exports = userController;
