const { MongoClient } = require('mongodb');

class DBClient {
	constructor() {
		const host = process.env.DB_HOST || 'localhost';
		const port = process.env.DB_PORT || 27017;
		const database = process.env.DB_DATABASE || 'files_manager';
		const URL = `mongodb://${host}:${port}/${database}`;

		this.client = new MongoClient(URL);
		this.client.connect().catch((error) => console.log(error.message));
	}
	isAlive() {
		return this.client.isConnected();
	}

	async nbUsers() {
		return this.client.db().collection('users').countDocuments();
	}

	async nbFiles() {
		return this.client.db().collection('files').countDocuments();
	}
}
const dbClient = new DBClient();
module.exports = dbClient;
