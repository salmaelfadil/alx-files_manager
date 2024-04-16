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
				res.status(400).json({ 'error': 'Missing name' });
			}
			const type = req.body.type;
			const typeList = [folder, file, image];
			if (!type || !typeList.includes(type)) {
				res.status(400).json({ 'error': 'Missing type' });
			}
			if (type === file ||  type === image) {
				const data = req.body.data;
				if (!data) {
					res.status(400).json({ 'error': 'Missing data' });
				}
			}
			const parentId = req.body.parentId;
			if (parentId) {
				parentIdObj = new ObjectID(parentId);
				parentExists = await (await.dbClient.filesCollection()).findOne({ _id: parentIdObj });
				if (!parentExists) {
					res.status(400).json({ 'error': 'parent not found' });
				} else if (type(parentExists) != folder) {
					res.status(400).json({ 'error': 'Parent is not a folder' });
				}
			}

		}
	}
}
