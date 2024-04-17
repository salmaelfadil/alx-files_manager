import { v4 as uuidv4 } from 'uuid';

const { ObjectID } = require('mongodb');
const fs = require('fs');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    const idObj = new ObjectID(userId);
    const user = await (await dbClient.usersCollection()).findOne({ _id: idObj });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, data } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Missing name' });
    }
    const typeList = ['folder', 'file', 'image'];
    if (!type || !typeList.includes(type)) {
      res.status(400).json({ error: 'Missing type' });
    }
    if ((type === 'file' || type === 'image') && !data) {
      res.status(400).json({ error: 'Missing data' });
    }
    const isPublic = req.body.isPublic || false;
    const parentId = req.body.parentId || 0;
    if (parentId) {
      const parentIdObj = new ObjectID(parentId);
      const parentExists = await (await dbClient.filesCollection()).findOne(
        { _id: parentIdObj, userId: idObj },
      );
      if (!parentExists) {
        res.status(400).json({ error: 'parent not found' });
      } else if (parentExists.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    let localPath;
    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileId = uuidv4();
      localPath = `${folderPath}/${fileId}`;
      const buffer = (data, 'base64');
      try {
        await fs.mkdir(folderPath, { recursive: true });
        await fs.writeFile(localPath, buffer);
      } catch (error) {
        console.log(error);
      }
      const fileIns = await (await dbClient.filesCollection()).insertOne({
        userId,
        name,
        type,
        isPublic,
        parentId: parentId ? new ObjectID(parentId) : null,
        localPath: type !== 'folder' ? localPath : null,
      });
      res.status(201).json({
        id: fileIns.insertedId, userId, name, type, isPublic, parentId,
      });
    }
  }
}
module.exports = FilesController;
