const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const { ObjectID } = require('mongodb');
const dbClient = require('./utils/db');

const fileQueue = new Bull('thumbnail generation');

const createImageThumbnail = async (path, options) => {
  try {
    const thumb = await imageThumbnail(path, options);
    const thumbPath = `${path}_${options.width}`;
    await fs.writeFileSync(thumbPath, thumb);
  } catch (error) {
    console.log(error);
  }
};

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }
  const userObjId = new ObjectID(userId);
  const fileObjId = new ObjectID(fileId);
  const file = await (await dbClient.filesCollection()).findOne(
    { _id: fileObjId, userId: userObjId },
  );
  if (!file) {
    throw new Error('File not found');
  }
  createImageThumbnail(file.localPath, { width: 500 });
  createImageThumbnail(file.localPath, { width: 250 });
  createImageThumbnail(file.localPath, { width: 100 });
});
module.exports = fileQueue;
