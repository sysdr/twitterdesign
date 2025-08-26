# Twitter Media CDN System - Lesson 9

A production-ready media handling and CDN system for the Twitter clone project.

## Features

- 📤 **Media Upload**: Direct S3 upload with progress tracking
- 🖼️ **Image Processing**: Automatic thumbnail generation in multiple sizes
- 🎬 **Video Processing**: Video thumbnail extraction and metadata
- 🌐 **CDN Integration**: Global content delivery with edge caching
- 📊 **Real-time Monitoring**: Upload progress and processing status
- 🔄 **Background Processing**: Asynchronous media processing pipeline
- 🗄️ **Metadata Storage**: MongoDB for media metadata and relationships
- ⚡ **Caching Layer**: Redis for performance optimization

## Architecture

### Backend Services
- **Media Service**: Express.js API for upload and metadata management
- **Processing Pipeline**: Background workers for thumbnail generation
- **CDN Integration**: CloudFront/Nginx for global distribution
- **Storage**: S3-compatible storage with LocalStack for development

### Frontend Components
- **Upload Interface**: Drag-and-drop with progress tracking
- **Media Gallery**: Grid view with lazy loading
- **Dashboard**: Real-time stats and system monitoring
- **CDN-Optimized Delivery**: Adaptive quality based on connection

## Quick Start

```bash
# Start the entire system
./start.sh

# Run tests
cd backend && npm test
cd frontend && npm test

# Run demo
./demo.sh

# Stop system
./stop.sh
```

## System URLs

- 📊 **Dashboard**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:5000
- 🌐 **CDN Simulator**: http://localhost:8080
- 🗄️ **MongoDB**: localhost:27017
- 🎯 **Redis**: localhost:6379
- ☁️ **LocalStack**: http://localhost:4566

## API Endpoints

### Upload
- `POST /api/media/upload-url` - Get signed upload URL
- `POST /api/media/upload` - Direct file upload
- `GET /api/media/:id/status` - Check processing status

### Retrieval
- `GET /api/media/:id` - Get media details
- `GET /api/media/user/:userId` - Get user's media
- `DELETE /api/media/:id` - Delete media

### Health
- `GET /api/health` - System health check

## Environment Variables

### Backend (.env)
- `AWS_S3_BUCKET` - S3 bucket name
- `AWS_CLOUDFRONT_DOMAIN` - CDN domain
- `MONGODB_URI` - Database connection
- `REDIS_URL` - Cache connection
- `MAX_FILE_SIZE` - Upload size limit
- `THUMBNAIL_SIZES` - Generated thumbnail sizes

### Frontend (.env)
- `REACT_APP_API_BASE_URL` - Backend API URL
- `REACT_APP_CDN_BASE_URL` - CDN base URL
- `REACT_APP_MAX_FILE_SIZE` - Client-side size limit

## Technology Stack

### Backend
- **Express.js** - Web framework
- **Sharp** - Image processing
- **FFmpeg** - Video processing
- **AWS SDK** - S3 integration
- **MongoDB** - Metadata storage
- **Redis** - Caching and queues

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Dropzone** - File upload UI
- **Axios** - HTTP client

### Infrastructure
- **Docker Compose** - Service orchestration
- **LocalStack** - AWS simulation
- **Nginx** - CDN simulation
- **MongoDB** - Database
- **Redis** - Cache and message queue

## Development

### File Structure
```
lesson9-media-cdn/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Business logic
│   │   ├── services/       # Processing services
│   │   ├── models/         # Database models
│   │   └── config/         # Configuration
│   └── tests/              # API tests
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── services/       # API clients
│   │   └── hooks/          # Custom hooks
│   └── public/             # Static assets
├── docker/                 # Docker configuration
├── tests/                  # Integration tests
└── scripts/                # Utility scripts
```

### Adding New Features

1. **New Media Type**: Add processor in `mediaProcessor.js`
2. **New Thumbnail Size**: Update `THUMBNAIL_SIZES` environment variable
3. **New API Endpoint**: Add route in `backend/src/routes/`
4. **New UI Component**: Add to `frontend/src/components/`

## Testing

### Unit Tests
```bash
cd backend && npm test
cd frontend && npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
# Test upload performance
ab -n 100 -c 10 http://localhost:5000/api/health

# Test CDN performance
ab -n 1000 -c 50 http://localhost:8080/media/test-image.jpg
```

## Production Deployment

### AWS Configuration
1. Replace LocalStack with real AWS services
2. Configure CloudFront distribution
3. Set up S3 bucket with CORS
4. Configure Auto Scaling for processing workers

### Security Considerations
- Enable S3 bucket encryption
- Configure IAM roles with minimal permissions
- Implement content scanning for uploaded files
- Enable CloudFront signed URLs for private content

### Monitoring
- CloudWatch for AWS metrics
- Application Performance Monitoring (APM)
- Custom dashboards for media processing metrics
- Alerting for failed uploads and processing errors

## Troubleshooting

### Common Issues

**Upload Fails**
- Check S3 bucket permissions
- Verify file size limits
- Check network connectivity to LocalStack

**Processing Stuck**
- Check Redis connection
- Verify Sharp/FFmpeg installation
- Check disk space for temporary files

**CDN Not Working**
- Verify Nginx configuration
- Check file permissions in CDN volume
- Ensure media files are accessible

### Debug Commands
```bash
# Check service health
curl http://localhost:5000/api/health

# Check S3 bucket contents (LocalStack)
aws --endpoint-url=http://localhost:4566 s3 ls s3://twitter-media-bucket

# Check Redis keys
redis-cli -p 6379 keys "*"

# Check MongoDB collections
mongo twitter_media --eval "db.media.find().pretty()"
```

## Performance Optimization

### Backend Optimizations
- Implement connection pooling for databases
- Use streaming for large file uploads
- Enable gzip compression
- Implement proper caching headers

### Frontend Optimizations
- Lazy load images in gallery
- Implement virtual scrolling for large lists
- Use WebP format when supported
- Implement progressive image loading

### CDN Optimizations
- Configure proper cache headers
- Implement image optimization on-the-fly
- Use HTTP/2 for better performance
- Enable Brotli compression

## Next Steps

This media system integrates with:
- **Lesson 8**: Search service indexes media metadata
- **Lesson 10**: Monitoring tracks media processing metrics
- **Future Lessons**: Analytics on media engagement

The system is designed to scale to Twitter-level traffic with proper cloud infrastructure and monitoring.
