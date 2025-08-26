const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true,
        unique: true
    },
    fileType: {
        type: String,
        required: true,
        enum: ['image', 'video']
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    dimensions: {
        width: Number,
        height: Number
    },
    duration: Number, // For videos
    s3Key: {
        type: String,
        required: true
    },
    s3Bucket: {
        type: String,
        required: true
    },
    thumbnails: [{
        size: String, // e.g., "150x150"
        s3Key: String,
        url: String
    }],
    cdnUrl: String,
    status: {
        type: String,
        enum: ['uploading', 'processing', 'ready', 'failed'],
        default: 'uploading'
    },
    processingProgress: {
        type: Number,
        default: 0
    },
    metadata: {
        exif: mongoose.Schema.Types.Mixed,
        processingInfo: mongoose.Schema.Types.Mixed
    },
    uploadedBy: {
        type: String, // User ID reference
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
MediaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for efficient queries
MediaSchema.index({ uploadedBy: 1, createdAt: -1 });
MediaSchema.index({ status: 1 });
MediaSchema.index({ fileType: 1 });

module.exports = mongoose.model('Media', MediaSchema);
