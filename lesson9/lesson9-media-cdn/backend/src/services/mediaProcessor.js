const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const Media = require('../models/Media');
const { getS3Client } = require('../config/aws');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

class MediaProcessor {
    constructor() {
        this.processingQueue = [];
        this.isProcessing = false;
        this.thumbnailSizes = process.env.THUMBNAIL_SIZES.split(',');
    }

    async processMedia(mediaId) {
        this.processingQueue.push(mediaId);
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.processingQueue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const mediaId = this.processingQueue.shift();

        try {
            const media = await Media.findById(mediaId);
            if (!media) {
                console.error(`Media ${mediaId} not found`);
                return this.processQueue();
            }

            console.log(`🔄 Processing media: ${media.fileName}`);
            
            // Download from S3
            const s3Client = getS3Client();
            const s3Object = await s3Client.getObject({
                Bucket: media.s3Bucket,
                Key: media.s3Key
            }).promise();

            // Create temp file
            const tempDir = '/tmp';
            const tempFile = path.join(tempDir, `${uuidv4()}-${media.fileName}`);
            await fs.writeFile(tempFile, s3Object.Body);

            // Process based on file type
            if (media.fileType === 'image') {
                await this.processImage(media, tempFile);
            } else if (media.fileType === 'video') {
                await this.processVideo(media, tempFile);
            }

            // Clean up temp file
            await fs.unlink(tempFile);

            // Update status
            media.status = 'ready';
            media.processingProgress = 100;
            await media.save();

            console.log(`✅ Finished processing: ${media.fileName}`);

        } catch (error) {
            console.error(`❌ Error processing media ${mediaId}:`, error);
            
            // Update status to failed
            try {
                await Media.findByIdAndUpdate(mediaId, {
                    status: 'failed',
                    processingProgress: 0
                });
            } catch (updateError) {
                console.error('Error updating failed status:', updateError);
            }
        }

        // Continue processing queue
        setTimeout(() => this.processQueue(), 100);
    }

    async processImage(media, tempFile) {
        console.log(`📸 Processing image: ${media.fileName}`);
        
        // Get image metadata
        const metadata = await sharp(tempFile).metadata();
        media.dimensions = {
            width: metadata.width,
            height: metadata.height
        };

        // Update progress
        media.processingProgress = 20;
        await media.save();

        // Generate thumbnails
        const thumbnails = [];
        for (let i = 0; i < this.thumbnailSizes.length; i++) {
            const size = this.thumbnailSizes[i];
            const [width, height] = size.split('x').map(Number);
            
            console.log(`🖼️  Creating thumbnail: ${size}`);
            
            // Generate thumbnail
            const thumbBuffer = await sharp(tempFile)
                .resize(width, height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 85 })
                .toBuffer();

            // Upload thumbnail to S3
            const thumbKey = `thumbnails/${media.uploadedBy}/${Date.now()}/${size}-${media.fileName}`;
            const s3Client = getS3Client();
            
            await s3Client.upload({
                Bucket: media.s3Bucket,
                Key: thumbKey,
                Body: thumbBuffer,
                ContentType: 'image/jpeg',
                Metadata: {
                    originalMediaId: media._id.toString(),
                    thumbnailSize: size
                }
            }).promise();

            thumbnails.push({
                size,
                s3Key: thumbKey
            });

            // Update progress
            media.processingProgress = 20 + ((i + 1) / this.thumbnailSizes.length) * 80;
            await media.save();
        }

        media.thumbnails = thumbnails;
        await media.save();
    }

    async processVideo(media, tempFile) {
        console.log(`🎬 Processing video: ${media.fileName}`);

        // Get video metadata
        const metadata = await this.getVideoMetadata(tempFile);
        media.dimensions = {
            width: metadata.width,
            height: metadata.height
        };
        media.duration = metadata.duration;

        // Update progress
        media.processingProgress = 30;
        await media.save();

        // Generate video thumbnail from first frame
        const thumbnails = [];
        for (let i = 0; i < this.thumbnailSizes.length; i++) {
            const size = this.thumbnailSizes[i];
            const [width, height] = size.split('x').map(Number);
            
            console.log(`🎞️  Creating video thumbnail: ${size}`);
            
            const thumbFile = `/tmp/${uuidv4()}-thumb-${size}.jpg`;
            
            await new Promise((resolve, reject) => {
                ffmpeg(tempFile)
                    .screenshots({
                        timestamps: ['00:00:01'],
                        filename: path.basename(thumbFile),
                        folder: path.dirname(thumbFile),
                        size: `${width}x${height}`
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });

            // Upload thumbnail to S3
            const thumbBuffer = await fs.readFile(thumbFile);
            const thumbKey = `thumbnails/${media.uploadedBy}/${Date.now()}/${size}-${media.fileName}.jpg`;
            const s3Client = getS3Client();
            
            await s3Client.upload({
                Bucket: media.s3Bucket,
                Key: thumbKey,
                Body: thumbBuffer,
                ContentType: 'image/jpeg',
                Metadata: {
                    originalMediaId: media._id.toString(),
                    thumbnailSize: size
                }
            }).promise();

            thumbnails.push({
                size,
                s3Key: thumbKey
            });

            // Clean up temp thumbnail
            await fs.unlink(thumbFile);

            // Update progress
            media.processingProgress = 30 + ((i + 1) / this.thumbnailSizes.length) * 70;
            await media.save();
        }

        media.thumbnails = thumbnails;
        await media.save();
    }

    async getVideoMetadata(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) return reject(err);
                
                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                if (!videoStream) return reject(new Error('No video stream found'));
                
                resolve({
                    width: videoStream.width,
                    height: videoStream.height,
                    duration: parseFloat(metadata.format.duration)
                });
            });
        });
    }
}

module.exports = new MediaProcessor();
