const { v4: uuidv4 } = require('uuid');
const path = require('path');
const mime = require('mime-types');
const Media = require('../models/Media');
const { getS3Client } = require('../config/aws');
const mediaProcessor = require('../services/mediaProcessor');
const cdnService = require('../services/cdnService');

// Get signed upload URL for direct S3 upload
const getUploadUrl = async (req, res) => {
    try {
        const { fileName, fileType, userId } = req.body;
        
        const fileExtension = path.extname(fileName);
        const uniqueFileName = `${uuidv4()}${fileExtension}`;
        const s3Key = `uploads/${userId}/${Date.now()}/${uniqueFileName}`;
        
        const s3Client = getS3Client();
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key,
            ContentType: fileType,
            Expires: 300 // 5 minutes
        };
        
        const uploadUrl = s3Client.getSignedUrl('putObject', params);
        
        res.json({
            uploadUrl,
            s3Key,
            fileName: uniqueFileName
        });
    } catch (error) {
        console.error('Error generating upload URL:', error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
};

// Handle media upload
const uploadMedia = async (req, res) => {
    try {
        const { userId } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        
        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const uniqueFileName = `${uuidv4()}${fileExtension}`;
        const s3Key = `uploads/${userId}/${Date.now()}/${uniqueFileName}`;
        
        // Upload to S3
        const s3Client = getS3Client();
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: {
                originalName: file.originalname,
                uploadedBy: userId
            }
        };
        
        const s3Response = await s3Client.upload(uploadParams).promise();
        
        // Determine file type
        const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        
        // Create media record
        const media = new Media({
            originalName: file.originalname,
            fileName: uniqueFileName,
            fileType,
            mimeType: file.mimetype,
            size: file.size,
            s3Key,
            s3Bucket: process.env.AWS_S3_BUCKET,
            uploadedBy: userId,
            status: 'processing'
        });
        
        await media.save();
        
        // Start background processing
        mediaProcessor.processMedia(media._id);
        
        res.status(201).json({
            id: media._id,
            fileName: uniqueFileName,
            status: 'processing',
            message: 'Upload successful, processing started'
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
};

// Get media by ID
const getMediaById = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }
        
        // Generate CDN URLs if ready
        if (media.status === 'ready') {
            media.cdnUrl = cdnService.getCdnUrl(media.s3Key);
            media.thumbnails = media.thumbnails.map(thumb => ({
                ...thumb,
                url: cdnService.getCdnUrl(thumb.s3Key)
            }));
        }
        
        res.json(media);
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ error: 'Failed to fetch media' });
    }
};

// Get user's media
const getUserMedia = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20, type } = req.query;
        
        const filter = { uploadedBy: userId };
        if (type && ['image', 'video'].includes(type)) {
            filter.fileType = type;
        }
        
        const media = await Media.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        // Add CDN URLs
        const mediaWithUrls = media.map(item => {
            if (item.status === 'ready') {
                item.cdnUrl = cdnService.getCdnUrl(item.s3Key);
                item.thumbnails = item.thumbnails.map(thumb => ({
                    ...thumb,
                    url: cdnService.getCdnUrl(thumb.s3Key)
                }));
            }
            return item;
        });
        
        res.json(mediaWithUrls);
    } catch (error) {
        console.error('Error fetching user media:', error);
        res.status(500).json({ error: 'Failed to fetch user media' });
    }
};

// Process media
const processMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }
        
        if (media.status !== 'uploading') {
            return res.status(400).json({ error: 'Media cannot be processed in current state' });
        }
        
        // Start processing
        mediaProcessor.processMedia(media._id);
        
        res.json({ message: 'Processing started' });
    } catch (error) {
        console.error('Error starting media processing:', error);
        res.status(500).json({ error: 'Failed to start processing' });
    }
};

// Get media processing status
const getMediaStatus = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }
        
        res.json({
            id: media._id,
            status: media.status,
            progress: media.processingProgress,
            thumbnails: media.thumbnails.length
        });
    } catch (error) {
        console.error('Error fetching media status:', error);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
};

// Delete media
const deleteMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }
        
        const s3Client = getS3Client();
        
        // Delete from S3
        await s3Client.deleteObject({
            Bucket: media.s3Bucket,
            Key: media.s3Key
        }).promise();
        
        // Delete thumbnails
        for (const thumb of media.thumbnails) {
            await s3Client.deleteObject({
                Bucket: media.s3Bucket,
                Key: thumb.s3Key
            }).promise();
        }
        
        // Delete from database
        await Media.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        console.error('Error deleting media:', error);
        res.status(500).json({ error: 'Failed to delete media' });
    }
};

module.exports = {
    getUploadUrl,
    uploadMedia,
    getMediaById,
    getUserMedia,
    processMedia,
    getMediaStatus,
    deleteMedia
};
