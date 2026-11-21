const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const datasetController = require('../controllers/datasetController');
const authenticateToken = require('../utils/authMiddleware');
const { MAX_FILE_SIZE_BYTES } = require('../utils/validator');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// All dataset routes require authentication
router.use(authenticateToken);

router.get('/', datasetController.getDatasets);
router.post('/', upload.single('file'), datasetController.uploadDataset);
router.get('/:id', datasetController.getDatasetById);
router.get('/:id/results', datasetController.getDatasetResults);
router.post('/:id/ask', datasetController.askDataset);

module.exports = router;

