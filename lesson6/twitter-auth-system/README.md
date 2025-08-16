# Twitter Authentication System

A comprehensive authentication system built with Node.js, TypeScript, React, and PostgreSQL, featuring JWT tokens, rate limiting, and analytics.

## 🚀 Features

- **User Authentication**: Registration, login, logout with JWT tokens
- **Security**: Rate limiting, input validation, secure password hashing
- **Analytics**: User login tracking and metrics
- **Modern Stack**: TypeScript, React, Tailwind CSS, Vite
- **Database**: PostgreSQL with Redis for caching
- **Testing**: Comprehensive test suite with Jest

## 🏗️ Architecture

```
├── backend/          # Node.js + TypeScript API
├── frontend/         # React + TypeScript UI
├── database/         # Database initialization scripts
├── tests/            # Integration tests
└── docs/             # Documentation
```

## 🛠️ Tech Stack

### Backend
- Node.js + TypeScript
- Express.js framework
- PostgreSQL database
- Redis for caching
- JWT authentication
- Rate limiting middleware
- Input validation

### Frontend
- React 18 + TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- Zustand for state management
- React Router for navigation

## 📋 Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd twitter-auth-system
   ```

2. **Start the system**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/api/health

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Database Setup

The system uses Docker Compose for database services:

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: twitter_auth
      POSTGRES_USER: twitter_user
      POSTGRES_PASSWORD: twitter_pass
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## 🧪 Testing

Run the test suite:

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# All tests
npm test
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Analytics Endpoints

- `GET /api/analytics/user/:userId` - Get user analytics
- `GET /api/analytics/overview` - Get system overview

## 🔒 Security Features

- JWT token-based authentication
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure password hashing with bcrypt
- CORS configuration
- Environment variable configuration

## 📊 Monitoring

- Health check endpoint
- User login analytics
- Rate limiting metrics
- Database connection monitoring

## 🚀 Deployment

### Production Considerations

1. Set secure environment variables
2. Use HTTPS in production
3. Configure proper CORS origins
4. Set up database backups
5. Monitor application logs
6. Use production-grade Redis and PostgreSQL

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.


