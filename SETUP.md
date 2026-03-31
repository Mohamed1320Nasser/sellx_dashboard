# SellX Frontend Setup Guide

## 🚀 Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+ (currently using 18.20.4 - upgrade recommended)
- npm or yarn package manager

### Installation

1. Navigate to the frontend directory:

   ```bash
   cd SellX_frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=SellX
VITE_APP_VERSION=1.0.0
```

### ESLint Configuration

ESLint is configured to be permissive with the following rules disabled:

- `@typescript-eslint/no-explicit-any` - Allows use of `any` type
- `@typescript-eslint/no-unused-vars` - Only warns about unused variables
- Console statements - Allowed with eslint-disable comments

### TypeScript Configuration

TypeScript is configured with relaxed settings:

- `strict: false` - Disabled strict mode
- `noUnusedLocals: false` - Allows unused local variables
- `noUnusedParameters: false` - Allows unused parameters

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── ui/             # Base UI components
│   ├── forms/          # Form components
│   ├── tables/         # Table components
│   ├── charts/         # Chart components
│   └── layout/         # Layout components
├── pages/              # Page components
├── hooks/              # Custom hooks
│   └── api/           # API-related hooks
├── stores/             # Zustand stores
├── services/           # API services
├── utils/              # Utility functions
├── types/              # TypeScript types
└── constants/          # Application constants
```

## 🎨 UI Framework

- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Lucide React** - Icon library
- **Framer Motion** - Animation library

## 🔐 Authentication

The app uses JWT-based authentication with role-based access control:

- System Admin
- Company Admin
- Manager
- Cashier

## 🌐 Arabic RTL Support

The application is fully configured for Arabic right-to-left layout:

- Direction: RTL
- Font: Noto Sans Arabic
- Proper text alignment and spacing

## 🔍 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🐛 Troubleshooting

### Common Issues

1. **Node.js Version Warning**
   - Upgrade to Node.js 20.19+ or 22.12+ for optimal performance
   - Current version 18.20.4 works but shows warnings

2. **ESLint Errors**
   - Configuration is set to be permissive
   - Use `// eslint-disable-next-line` for specific rule overrides

3. **TypeScript Errors**
   - Strict mode is disabled for easier development
   - `any` type is allowed throughout the project

## 📋 Next Steps

1. Set up environment variables
2. Configure API endpoints to match your backend
3. Test authentication flow
4. Begin implementing business modules

The application is ready for development with all foundational components in place!
