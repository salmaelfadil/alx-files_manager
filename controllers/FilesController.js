import { v4 as uuidv4 } from 'uuid';
import Queue from 'bull/lib/queue';

const { ObjectID } = require('mongodb');
const fs = require('fs');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const fileQueue = new Queue('thumbnail generation');

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
    if (type === 'folder') {
      const insFile = await (await dbClient.filesCollection()).insertOne(
        {
          userId, name, type, isPublic, parentId,
        },
      );
      res.status(201).json({
        id: insFile.insertedId, userId, name, type, isPublic, parentId,
      });
    } else {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileId = uuidv4();
      const parentidObj = new ObjectID(parentId);
      const localPath = `${folderPath}/${fileId}`;
      const buffer = Buffer.from(data, 'base64');
      await fs.mkdir(folderPath, { recursive: true }, (error) => {
        if (error) return res.status(400).send({ error: error.message });
        return true;
      });
      await fs.writeFile(localPath, buffer, (error) => {
        if (error) return res.status(400).send({ error: error.message });
        return true;
      });
      const insFile = await (await dbClient.filesCollection()).insertOne(
        {
          userId, name, type, isPublic, parentId: parentidObj, localPath,
        },
      );
      if (type === 'image') {
        const job = `Image thumbnail [${userId}-${insFile.insertedId}]`;
        fileQueue.add({ userId, fileId: insFile.insertedId, name: job });
        res.status(201).json(
          {
            id: insFile.insertedId, userId, name, type, isPublic, parentId,
          },
        );
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    }
  }

  static async getShow(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      const idObj = new ObjectID(userId);
      const user = await (await dbClient.usersCollection()).findOne({ _id: idObj });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const fileIdObj = new ObjectID(req.params.id);
      const file = await (await dbClient.filesConnection()).findOne({ _id: fileIdObj });
      if (!file) {
        res.status(404).json({ error: 'Not found' });
      } else {
        res.status(200).json({
          id: file._id,
          userId: file.userId,
          name: file.name,
          type: file.type,
          isPublic: file.isPublic,
          parentId: file.parentId,
        });
      }
    }
    res.status(401).json({ error: 'Unauthorized' });
  }

  static async getIndex(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    let idObj;
    const parentId = req.query.parentId || 0;
    const page = req.query.page || 0;
    if (userId) {
      idObj = new ObjectID(userId);
      const user = await (await dbClient.usersCollection()).findOne({ _id: idObj });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const aggMatch = { $and: [{ parentId }] };
      let aggData = [{ $match: aggMatch }, { $skip: page * 20 }, { $limit: 20 }];
      if (parentId === 0) {
        aggData = [{ $skip: page * 20 }, { $limit: 20 }];
      }
      const files = await dbClient.collection('files').aggregate(aggData).toArray();
      const filesList = [];
      await files.forEach((item) => {
        const file = {
          id: item._id,
          userId: item.userId,
          name: item.name,
          isPublic: item.isPublic,
          parentId: item.parentId,
        };
        filesList.push(file);
      });
      return res.send(filesList);
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = FilesController;
