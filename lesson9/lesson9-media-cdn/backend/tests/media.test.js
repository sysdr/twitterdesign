const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/server');

describe('Media API', () => {
  test('GET /api/health should return status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('POST /api/media/upload-url should generate upload URL', async () => {
    const response = await request(app)
      .post('/api/media/upload-url')
      .send({
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        userId: 'test-user'
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('uploadUrl');
    expect(response.body).toHaveProperty('s3Key');
    expect(response.body).toHaveProperty('fileName');
  });

  test('POST /api/media/upload should handle file upload', async () => {
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    const testImageBuffer = Buffer.from('fake-image-data');
    fs.writeFileSync(testImagePath, testImageBuffer);

    const response = await request(app)
      .post('/api/media/upload')
      .field('userId', 'test-user')
      .attach('media', testImagePath)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('status', 'processing');

    // Clean up
    fs.unlinkSync(testImagePath);
  });
});
