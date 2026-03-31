# SellX Frontend

## 🚀 Project Overview

SellX is a comprehensive business management system built with React, TypeScript, and modern web technologies. It provides a complete solution for managing inventory, sales, purchases, customers, suppliers, and business analytics.

## ✨ Features

### 🏢 **Multi-Company Management**

- Company registration and approval workflows
- Role-based access control (System Admin, Company Admin, Manager, Cashier)
- User management with hierarchical permissions

### 📦 **Inventory Management**

- Product catalog with categories
- Stock tracking and alerts
- Stock movement history
- Supplier and client management

### 💰 **Transaction Management**

- Point of Sale (POS) system
- Purchase order management
- Payment processing and tracking
- Receipt generation

### 📊 **Analytics & Reporting**

- Real-time dashboard with business metrics
- Sales trends and performance analytics
- Financial reports
- Customizable charts and graphs

### 👥 **Human Resources**

- Employee absence tracking
- Salary and payroll management
- User role assignments

### 🌐 **Internationalization**

- Full Arabic language support
- Right-to-left (RTL) layout
- Professional Arabic typography

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Backend API server running

## 🚀 Quick Start

1. **Clone and install dependencies**:
   \`\`\`bash
   cd SellX_frontend
   npm install
   \`\`\`

2. **Configure environment**:
   \`\`\`bash
   cp .env.example .env

   # Edit .env with your API URL

   \`\`\`

3. **Start development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Build for production**:
   \`\`\`bash
   npm run build
   \`\`\`

## 📁 Project Structure

\`\`\`
src/
├── components/ # Reusable UI components
│ ├── ui/ # Basic UI elements
│ ├── forms/ # Form components
│ ├── tables/ # Data tables
│ ├── charts/ # Chart components
│ └── layout/ # Layout components
├── pages/ # Page components
├── services/ # API service layers
├── hooks/ # Custom React hooks
│ └── api/ # API-specific hooks
├── stores/ # Zustand state stores
├── types/ # TypeScript type definitions
├── utils/ # Utility functions
├── config/ # Configuration files
└── constants/ # Application constants
\`\`\`

## 🔐 Authentication & Roles

### User Roles Hierarchy:

1. **System Admin** - Full system access
2. **Company Admin** - Company-wide management
3. **Manager** - Inventory and operations
4. **Cashier** - Sales and basic operations

### Permission System:

- Route-level protection
- Component-level access control
- Feature-based permissions

## 📱 Responsive Design

- Mobile-first approach
- Touch-friendly interfaces
- Progressive Web App (PWA) ready
- Optimized for tablets and smartphones

## 🌍 Arabic RTL Support

- Complete right-to-left layout
- Arabic typography and fonts
- Culturally appropriate UI patterns
- Date and number formatting

## 🔧 API Integration

### Base Configuration:

- Axios interceptors for authentication
- Automatic token management
- Error handling and user feedback
- Request/response transformation

### React Query Integration:

- Caching and synchronization
- Optimistic updates
- Background refetching
- Pagination support

## 🧪 Testing

\`\`\`bash

# Run tests

npm test

# Run tests with coverage

npm run test:coverage

# Run E2E tests

npm run test:e2e
\`\`\`

## 📦 Deployment

### Production Build:

\`\`\`bash
npm run build
npm run preview
\`\`\`

### Environment Variables:

- \`VITE_API_BASE_URL\`: Backend API URL
- \`VITE_APP_NAME\`: Application name
- \`VITE_APP_VERSION\`: Application version

### Deployment Platforms:

- Netlify
- Vercel
- AWS S3 + CloudFront
- Traditional web servers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions:

- Email: support@sellx.com
- Documentation: [docs.sellx.com](https://docs.sellx.com)

---

**SellX** - Modern Business Management Solution
