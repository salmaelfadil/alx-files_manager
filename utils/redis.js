import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
	constructor() {
		this.client = createClient();
		this.client.on('error', (err) => {
			console.log(err);
			this.connected = false;
		});
		this.connected = true;
	}

	isAlive() {
		return this.connected;
	}

	async get(key) {
		return promisify(this.client.get).bind(this.client)(key);
	}

	async set(key, value, dur) {
		await promisify(this.client.setex).bind(this.client)(key, dur, value);
	}
	
	async del(key) {
		await promisify(this.client.del).bind(this.client)(key);
	}
}

const redisClient = new RedisClient();
export default redisClient;
