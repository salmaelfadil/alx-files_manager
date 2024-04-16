import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const cred = req.header('Authorization').split(' ')[1];
    const decodedCred = Buffer.from(cred, 'base64').toString('ascii');
    const email = decodedCred.split(':')[0];
    const hashPass = sha1(decodedCred.split(':')[1]);
    const user = await (await dbClient.usersCollection()).findOne({ email, password: hashPass });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      const token = uuidv4();
      const userId = user._id.toString();
      // console.log('User ID:', userId);
      await redisClient.set(`auth_${token}`, userId, 60 * 60 * 24);
      res.status(200).json({ token });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (id) {
      await redisClient.del(key);
      res.status(204).json({});
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
module.exports = AuthController;
