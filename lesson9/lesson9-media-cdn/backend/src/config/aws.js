const AWS = require('aws-sdk');

let s3Client;

const initializeAWS = () => {
    // Configure AWS SDK
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

    // Use LocalStack for development
    if (process.env.NODE_ENV === 'development') {
        s3Client = new AWS.S3({
            endpoint: process.env.AWS_ENDPOINT_URL,
            s3ForcePathStyle: true
        });
    } else {
        s3Client = new AWS.S3();
    }

    console.log('✅ AWS SDK initialized');
    
    // Create bucket if it doesn't exist
    createBucketIfNotExists();
};

const createBucketIfNotExists = async () => {
    try {
        await s3Client.headBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();
        console.log(`✅ S3 bucket ${process.env.AWS_S3_BUCKET} exists`);
    } catch (error) {
        if (error.statusCode === 404) {
            try {
                await s3Client.createBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();
                console.log(`✅ S3 bucket ${process.env.AWS_S3_BUCKET} created`);
            } catch (createError) {
                console.error('❌ Failed to create S3 bucket:', createError);
            }
        } else {
            console.error('❌ Error checking S3 bucket:', error);
        }
    }
};

const getS3Client = () => s3Client;

module.exports = { initializeAWS, getS3Client };
