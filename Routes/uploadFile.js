const { Router } = require('express');
const multer = require('multer');
const AWS = require("@aws-sdk/client-s3");
const { S3Client, PutObjectCommand } = AWS;
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const path = require('path');
const router = Router();
const fs = require('fs');
const https = require('https');
const { NodeHttpHandler } = require('@aws-sdk/node-http-handler');
const { tmpdir } = require('os');
// MongoDB schema
const schema = new mongoose.Schema({
  info: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
});

const File = mongoose.model('File', schema);

const customAgent = new https.Agent({ keepAlive: true, maxSockets: 200 });

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  requestHandler: new NodeHttpHandler({ httpAgent: customAgent }),
});

const BUCKET_NAME = 'cnppromo-files';

// Multer Config
const upload = multer({ dest: tmpdir() });

// Upload file to S3 helper
async function uploadToS3(file, folder = '')
{
  const key = `${folder}/${uuidv4()}_${file.originalname}`;
  const buffer = await fs.promises.readFile(file.path);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
    })
  );

  return `https://cnppromo-files.s3.ap-south-1.amazonaws.com/${key}`;
}

// Upload Image to S3
router.post('/', upload.single('image'), async (req, res) =>
{
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send({
        success: false,
        message: 'No file uploaded',
      });
    }
    const url = await uploadToS3(file, 'images');
    res.json({
      success: true,
      message: 'Image uploaded successfully!',
      url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// Upload Audio to S3
router.post('/file', upload.single('audio'), async (req, res) =>
{
  try {
    const url = await uploadToS3(req.file, 'audio');

    await File.create({
      info: req.file,
      path: url,
      type: req.file.fieldname
    });

    res.status(200).send({ message: 'Audio uploaded successfully', url });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Upload failed', error: error.message });
  }
});

// Upload Video to S3
router.post('/video', upload.single('video'), async (req, res) =>
{
  try {
    const url = await uploadToS3(req.file, 'videos');

    await File.create({
      info: req.file,
      path: url,
      type: req.file.fieldname
    });

    res.status(200).send({ message: 'Video uploaded successfully', url });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Upload failed', error: error.message });
  }
});

module.exports = router;