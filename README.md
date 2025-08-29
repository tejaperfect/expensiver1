# Expensiver - Personal & Group Expense Management

A comprehensive full-stack expense management application built with React and Node.js, featuring real-time collaboration, AI-powered insights, and integrated payment solutions.

## 🚀 Features

### Core Functionality
- **Personal Expense Tracking**: Track individual expenses with categories, tags, and receipts
- **Group Expense Management**: Create groups, split bills, and settle expenses
- **Real-time Collaboration**: Live chat and expense updates within groups
- **File Upload & Management**: Upload receipts with drag-and-drop interface
- **Advanced Analytics**: Comprehensive spending analysis and insights
- **Payment Integration**: UPI and Razorpay integration for seamless settlements

### AI-Powered Features
- **Smart Categorization**: Automatic expense categorization using AI
- **Spending Insights**: AI-generated recommendations and patterns
- **Budget Optimization**: Intelligent budget suggestions

### Payment & Settlement
- **UPI Integration**: Direct UPI payments with QR code generation
- **Razorpay Gateway**: Secure card and netbanking payments
- **Smart Settlements**: Optimized debt settlements within groups
- **Payment Tracking**: Complete payment history and receipts

### User Experience
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Real-time Updates**: Live notifications and updates
- **Mobile-First**: Optimized for mobile and desktop use
- **Dark Mode**: Theme customization options

## 🛠 Tech Stack

### Frontend
- **React 18**: Modern React with Hooks and Suspense
- **Redux Toolkit**: State management with RTK Query
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **React Hot Toast**: User notifications
- **Axios**: HTTP client with interceptors

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication and authorization
- **Socket.IO**: Real-time communication
- **Multer**: File upload handling
- **Sharp**: Image processing
- **Winston**: Logging

### External Services
- **Razorpay**: Payment gateway
- **OpenAI**: AI categorization and insights
- **Socket.IO**: Real-time features

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd expensiver
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 4. Environment Configuration

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expensiver
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# External APIs
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
OPENAI_API_KEY=your_openai_api_key

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Expensiver
VITE_RAZORPAY_KEY_ID=your_razorpay_key_here
VITE_SOCKET_URL=http://localhost:5000
```

### 5. Database Setup
```bash
# Start MongoDB
mongod

# The application will create necessary collections automatically
```

### 6. Run the Application
```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 🎯 Usage

### Demo Account
Use the demo account to test the application:
- Email: `demo@expensiver.com`
- Password: `Demo123!@#`

### Key Features Guide

#### 1. Personal Expenses
- Add expenses with amount, description, category
- Upload receipts (images/PDFs)
- Add tags for better organization
- View analytics and spending patterns

#### 2. Group Management
- Create groups for shared expenses
- Invite members via email or invite code
- Add group expenses with automatic splitting
- Settle expenses using integrated payments

#### 3. Payment Integration
- Use UPI ID for direct payments
- Generate QR codes for UPI payments
- Pay with cards via Razorpay
- Track payment history and receipts

#### 4. Analytics
- View spending trends and patterns
- Category-wise expense breakdown
- Budget vs actual spending analysis
- AI-powered insights and recommendations

## 🏗 Architecture

### Frontend Architecture
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Modal, etc.)
│   ├── expense/        # Expense-related components
│   ├── groups/         # Group management components
│   ├── payment/        # Payment integration components
│   └── layout/         # Layout components (Header, Sidebar)
├── pages/              # Page components
├── services/           # API service functions
├── store/              # Redux store and slices
│   └── slices/         # Feature-specific state slices
├── utils/              # Utility functions
└── styles/             # CSS styles
```

### Backend Architecture
```
src/
├── controllers/        # Request handlers
├── models/            # Database models
├── middleware/        # Custom middleware
├── routes/            # API routes
├── services/          # Business logic
├── utils/             # Utility functions
└── config/            # Configuration files
```

### Database Schema
- **Users**: User profiles and authentication
- **Expenses**: Individual expense records
- **Groups**: Group information and members
- **GroupExpenses**: Shared expenses within groups
- **Transactions**: Payment and settlement records
- **Categories**: Expense categories
- **Notifications**: User notifications

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Request rate limiting
- Input validation and sanitization
- Secure file upload handling
- CORS protection
- Environment variable configuration

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run test
```

### Backend Testing
```bash
cd backend
npm run test
```

### Integration Testing
The application includes built-in integration tests accessible through the developer console:
```javascript
// In browser console
import('./utils/integrationTests.js').then(tests => tests.runIntegrationTests())
```

## 📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request

### Expense Endpoints
- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/:id/upload-receipt` - Upload receipt

### Group Endpoints
- `GET /api/groups` - Get user groups
- `POST /api/groups` - Create new group
- `POST /api/groups/join` - Join group with code
- `GET /api/groups/:id/expenses` - Get group expenses

### Payment Endpoints
- `POST /api/payments/razorpay/create-order` - Create Razorpay order
- `POST /api/payments/upi/generate-qr` - Generate UPI QR code
- `POST /api/payments/razorpay/verify` - Verify payment

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
1. Check MongoDB is running
2. Verify environment variables
3. Check port 5000 is available

#### Frontend build errors
1. Clear node_modules and reinstall
2. Check Node.js version compatibility
3. Verify environment variables

#### Payment integration issues
1. Verify Razorpay credentials
2. Check network connectivity
3. Ensure HTTPS in production

#### File upload problems
1. Check file size limits
2. Verify upload permissions
3. Check available disk space

### Debugging
Enable debug mode in frontend:
```env
VITE_DEBUG_REDUX=true
VITE_DEV_MODE=true
```

Backend logging:
```env
LOG_LEVEL=debug
```

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### Environment Setup
- Configure production database
- Set up HTTPS certificates
- Configure reverse proxy (nginx)
- Set production environment variables

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💡 Future Enhancements

- Multi-currency support
- Recurring expense automation
- Bank account integration
- Advanced reporting features
- Mobile app development
- Blockchain integration for transparency

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@expensiver.com
- Documentation: https://docs.expensiver.com

---

Built with ❤️ by the Expensiver Team