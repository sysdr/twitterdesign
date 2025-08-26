const express = require('express');
const multer = require('multer');
const { 
    uploadMedia, 
    getMediaById, 
    getUserMedia, 
    deleteMedia,
    getUploadUrl,
    processMedia,
    getMediaStatus
} = require('../controllers/mediaController');
const { validateUpload, validateMediaId } = require('../validators/mediaValidator');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            ...process.env.SUPPORTED_IMAGE_TYPES.split(','),
            ...process.env.SUPPORTED_VIDEO_TYPES.split(',')
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    }
});

// Routes
router.post('/upload-url', validateUpload, getUploadUrl);
router.post('/upload', upload.single('media'), validateUpload, uploadMedia);
router.post('/:id/process', validateMediaId, processMedia);
router.get('/:id', validateMediaId, getMediaById);
router.get('/:id/status', validateMediaId, getMediaStatus);
router.get('/user/:userId', getUserMedia);
router.delete('/:id', validateMediaId, deleteMedia);

module.exports = router;
