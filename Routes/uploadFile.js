const cloudinary = require('cloudinary').v2
const { Router } = require('express');
const multer = require('multer');
const path = require('path')
const router = Router()
const storage = multer.memoryStorage();
const upload = multer({ storage });
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const mongoose = require('mongoose');
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
})

const File = mongoose.model('File', schema)

const document = multer({
  limits: { fileSize: 500 * 1024 * 1024 },// 500 MB
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const destination = path.join("files/",);
      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination);
      }
      cb(null, destination);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
});
cloudinary.config({
  cloud_name: "dtmdt1sfl",
  api_key: "867773931529817",
  api_secret: "eQF-8XNf13RMfn8VB7nmeNi4z1o",
});


router.post('/', document.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    const url = `https://server.cnppromo.com/${req.file.path}`
    await File.create({
      info: req.file,
      path: url,
      type: req.file.fieldname
    })
    res.status(200).send({ message: 'File uploaded successfully', url: url });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      success: false
    })
  }
});

router.post('/file', document.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const url = `https://server.cnppromo.com/${req.file.path}`
  await File.create({
    info: req.file,
    path: url,
    type: req.file.fieldname
  })
  res.status(200).send({ message: 'File uploaded successfully', url: url });
});

router.post('/video', document.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const inputPath = req.file.path;
    const url = `https://server.cnppromo.com/${inputPath}`;

    // Save file info to the database
    await File.create({
      info: req.file,
      path: url,
      type: req.file.fieldname
    });

    // Send the response
    res.status(200).send({ message: 'File uploaded and optimized successfully', url });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
});
router.get('/all', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
    });
    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
      success: false
    })
  }
})

router.put('/delete', async (req, res) => {
  try {

    const result = await cloudinary.uploader.destroy(req.body.public_id);
    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
      success: false
    })
  }
})

module.exports = router