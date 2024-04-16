const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const URL = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(URL, { useUnifiedTopology: true });
    this.client.connect().then(() => {
      this.db = this.client.db(`${database}`);
    }).catch((error) => {
      console.log(error);
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.client.db(this.database).collection('users').countDocuments();
  }

  async nbFiles() {
    return this.client.db(this.database).collection('files').countDocuments();
  }

  async usersCollection() {
    return this.client.db(this.database).collection('users');
  }

  async filesCollection() {
    return this.client.db(this.database).collection('files');
  }

  async createUser(email, password) {
    await this.client.connect();
    const users = await this.usersCollection();
    const user = users.insertOne({ email, password });
    return user;
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
