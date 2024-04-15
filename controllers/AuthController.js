const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect(req, res) {
    if (!req.headers.authorization) {
      res.status(401);
      res.send('Missing Authorization');
    } else {
      const cred = req.header('Authorization').split(' ')[1];
      const decodedCred = Buffer.from(cred, 'base64').toString('ascii');
      const email = decodedCred.split(':')[0];
      const hashPass = sha1(decodedCred.split(':')[1]);
      const user = await (await dbClient.usersCollection()).findOne({ email });
      if (!user) {
        res.status(401);
        res.send('Unauthorized');
      } else if (user.password === hashPass) {
        const token = uuidv4();
        await redisClient.set(`auth_${token}`, user._id.toString('utf-8'), 60 * 60 * 24);
        res.status(200).json({ token });
      }
    }
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    await redisClient.del(`auth_${token}`);
    return res.status(204);
  }
}
module.exports = AuthController;
