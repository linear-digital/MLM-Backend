const cloudinary = require('cloudinary').v2
const { Router } = require('express');
const multer = require('multer');
const path = require('path')
const router = Router()
const storage = multer.memoryStorage();
const upload = multer({ storage });
const fs = require('fs')
const document = multer({
  limits: { fileSize: 500 * 1024 * 1024 } ,// 500 MB
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


router.post('/', upload.single('image'), async (req, res) => {
    try {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: 'Media',
          }, (error, result) => {
            if (error) {
              res.status(500).json({
                success: false,
                message: 'Error uploading image',
                error: error,
              });
            } else {
              res.json({
                success: true,
                message: 'Image uploaded successfully!',
                url: result.secure_url,
              });
            }
          });
          
          uploadStream.end(req.file?.buffer);
    } catch (error) {
        res.status(500).send({
            message: error.message,
            success: false
        })
    }   
});

router.post('/file', document.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const url = `https://mlm.genzit.xyz/${req.file.path}`

  res.status(200).send({ message: 'File uploaded successfully', url: url });
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