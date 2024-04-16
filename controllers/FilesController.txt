const dbClient = require('../utils/db');
const UserController = require('./UserController');
const fs = require('fs');

class FilesController {
	static async postUpload (req, res){
		const user = UserController.getMe(req, res);
		if (!user) {
			res.status(401).json({ 'error': 'Unauthorized' });
		} else {
			const name = req.body.name;
			if (!name) {
				res.status(400).json({ 'error': 'Missing Type' });
			}
			const type = req.body.type;

		}
	}
}
