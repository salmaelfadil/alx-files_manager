import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on('error', (err) => {
      console.log(err);
      this.connected = false;
    });

    this.client.on('connect', () => {
      // console.log('Connected to Redis');
      this.connected = true;
    });

    this.client.on('ready', () => {
      // console.log('Redis client is ready');
      this.connected = true;
    });
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    // await this.client.connect();
    return promisify(this.client.get).bind(this.client)(key);
  }

  async set(key, value, dur) {
    // await this.client.connect();
    await promisify(this.client.SETEX).bind(this.client)(key, dur, value);
  }

  async del(key) {
    await promisify(this.client.del).bind(this.client)(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
