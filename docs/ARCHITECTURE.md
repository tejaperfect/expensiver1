# Expensiver - Project Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Auth System │ │ Dashboard   │ │ Real-time Chat          │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Personal    │ │ Group       │ │ AI Assistant            │ │
│  │ Finance     │ │ Management  │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                         ┌──────▼──────┐
                         │  API Gateway │
                         └──────┬──────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Node.js)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Auth API    │ │ User API    │ │ WebSocket Server        │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Expense API │ │ Group API   │ │ AI Integration          │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Payment API │ │ Analytics   │ │ Notification Service    │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                         ┌──────▼──────┐
                         │   MongoDB   │
                         └─────────────┘
```

## Frontend Architecture

### Component Structure
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Common components (Button, Modal, etc.)
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard components
│   ├── expense/         # Expense management components
│   ├── group/           # Group management components
│   ├── chat/            # Chat and messaging components
│   └── ai/              # AI assistant components
├── pages/               # Route-level page components
├── hooks/               # Custom React hooks
├── store/               # Redux store configuration
├── services/            # API service functions
├── utils/               # Utility functions
├── styles/              # Global styles and themes
└── assets/              # Static assets
```

### State Management (Redux Toolkit)
```
store/
├── slices/
│   ├── authSlice.js     # Authentication state
│   ├── userSlice.js     # User profile state
│   ├── expenseSlice.js  # Personal expenses state
│   ├── groupSlice.js    # Group management state
│   ├── chatSlice.js     # Chat and messaging state
│   └── uiSlice.js       # UI state (modals, loading, etc.)
└── store.js             # Store configuration
```

## Backend Architecture

### API Structure
```
routes/
├── auth.js              # Authentication endpoints
├── users.js             # User management endpoints
├── expenses.js          # Personal expense endpoints
├── groups.js            # Group management endpoints
├── payments.js          # Payment processing endpoints
├── analytics.js         # Analytics and reporting endpoints
└── ai.js                # AI assistant endpoints
```

### Middleware
- **Authentication**: JWT token validation
- **Authorization**: Role-based access control
- **Validation**: Request data validation
- **Error Handling**: Centralized error management
- **Rate Limiting**: API rate limiting
- **Logging**: Request/response logging

### Database Schema Design

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String, // Hashed
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    phone: String
  },
  preferences: {
    currency: String,
    notifications: Object,
    theme: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Expenses Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  groupId: ObjectId, // Optional - for group expenses
  amount: Number,
  category: String,
  description: String,
  date: Date,
  type: String, // 'personal' | 'group'
  receipt: String, // Image URL
  tags: [String],
  splitDetails: {
    splitType: String, // 'equal' | 'custom' | 'percentage'
    participants: [{
      userId: ObjectId,
      amount: Number
    }]
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Groups Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  avatar: String,
  members: [{
    userId: ObjectId,
    role: String, // 'admin' | 'member'
    joinedAt: Date
  }],
  wallet: {
    balance: Number,
    currency: String
  },
  settings: {
    allowNewMembers: Boolean,
    requireApproval: Boolean,
    splitMethod: String
  },
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Messages Collection
```javascript
{
  _id: ObjectId,
  groupId: ObjectId,
  senderId: ObjectId,
  content: String,
  type: String, // 'text' | 'expense' | 'payment' | 'system'
  metadata: Object, // Additional data for special message types
  reactions: [{
    userId: ObjectId,
    emoji: String
  }],
  timestamp: Date
}
```

#### Payments Collection
```javascript
{
  _id: ObjectId,
  fromUserId: ObjectId,
  toUserId: ObjectId,
  groupId: ObjectId, // Optional
  expenseId: ObjectId, // Optional
  amount: Number,
  currency: String,
  status: String, // 'pending' | 'completed' | 'failed'
  paymentMethod: String,
  transactionId: String,
  razorpayData: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Architecture

### Authentication Flow
1. User registration/login
2. JWT token generation
3. Token-based API authentication
4. Refresh token mechanism
5. Secure logout process

### Data Protection
- Password hashing with bcrypt
- JWT token encryption
- API rate limiting
- Input validation and sanitization
- XSS and CSRF protection

## Real-time Features

### WebSocket Implementation
- Socket.IO for real-time communication
- Room-based messaging for groups
- Live expense updates
- Real-time notifications
- Online/offline status tracking

## AI Integration

### OpenAI API Usage
- Expense categorization
- Spending pattern analysis
- Budget recommendations
- Natural language queries
- Report generation

### Analytics Engine
- Custom expense analytics
- Trend analysis
- Predictive insights
- Performance metrics
- Custom reporting

## Performance Optimization

### Frontend
- Code splitting and lazy loading
- Component memoization
- Virtual scrolling for large lists
- Image optimization
- Service worker for caching

### Backend
- Database indexing
- Query optimization
- Caching strategies
- Connection pooling
- Response compression

## Deployment Architecture

### Development Environment
- Local MongoDB instance
- Hot reload for frontend/backend
- Environment-specific configurations

### Production Environment
- MongoDB Atlas or cloud database
- Load balancing
- SSL/TLS encryption
- CDN for static assets
- Monitoring and logging

## API Design Principles

### RESTful API Standards
- Consistent naming conventions
- HTTP status codes
- Pagination for large datasets
- Filtering and sorting capabilities
- Comprehensive error responses

### Response Format
```javascript
{
  success: Boolean,
  data: Object | Array,
  message: String,
  pagination: {
    page: Number,
    limit: Number,
    total: Number,
    totalPages: Number
  }
}
```

This architecture ensures scalability, maintainability, and performance while providing a solid foundation for the Expensiver platform.