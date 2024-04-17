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
    let idObj;
    if (userId) {
      idObj = new ObjectID(userId);
      const user = await (await dbClient.usersCollection()).findOne({ _id: idObj });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
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
    let parentIdObj;
    if (parentId) {
      parentIdObj = new ObjectID(parentId);
      const parentExists = await (await dbClient.filesCollection()).findOne(
        { _id: parentIdObj, userId: idObj },
      );
      if (!parentExists) {
        res.status(400).json({ error: 'Parent not found' });
      }
      if (parentExists.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    let localPath;
    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileId = uuidv4();
      localPath = `${folderPath}/${fileId}`;
      const buffer = Buffer.from(data, 'base64');

      await fs.mkdir(folderPath, { recursive: true }, (error) => {
        if (error) return res.status(400).send({ error: error.message });
        return true;
      });
      await fs.writeFile(localPath, buffer, (error) => {
        if (error) return res.status(400).send({ error: error.message });
        return true;
      });
      const fileIns = await (await dbClient.filesCollection()).insertOne({
        userId,
        name,
        type,
        isPublic,
        parentId,
        localPath,
      });
      res.status(201).json({
        id: fileIns.insertedId, userId, name, type, isPublic, parentId,
      });
    } else {
      const fileIns = await (await dbClient.filesCollection()).insertOne({
        userId,
        name,
        type,
        isPublic,
        parentId: parentId ? new ObjectID(parentId) : null,
      });
      res.status(201).json({
        id: fileIns.insertedId, userId, name, type, isPublic, parentId,
      });
    }
  }
}
module.exports = FilesController;
