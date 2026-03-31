import React from 'react';
import { useSessionAuthStore } from '../stores/sessionAuthStore';
import { Button, Card } from '../components/ui';
import { LogIn, LogOut, User, Shield } from 'lucide-react';

// Demo page showing session-based authentication
const SessionDemo: React.FC = () => {
  const { isAuthenticated, logout, getCurrentUser } = useSessionAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const currentUser = getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Session-Based Authentication Demo
          </h1>
          <p className="text-lg text-gray-600">
            This demonstrates the eduloom-style authentication flow using sessionStorage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentication Status */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Authentication Status</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Token:</span>
                <span className="font-mono text-sm">
                  {isAuthenticated ? 'Present' : 'None'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Storage:</span>
                <span className="font-medium text-blue-600">sessionStorage</span>
              </div>
            </div>
          </Card>

          {/* User Information */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <User className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
            </div>
            
            {isAuthenticated && currentUser ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{currentUser.fullname || currentUser.name || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{currentUser.email || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium">{currentUser.role || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No user information available</p>
                <p className="text-sm text-gray-400 mt-2">
                  Please login to see user details
                </p>
              </div>
            )}
          </Card>

          {/* Session Storage Info */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Session Storage</h2>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">token:</span>
                <span className="font-mono">
                  {sessionStorage.getItem('token') ? '✓ Stored' : '✗ Empty'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">isAuthed:</span>
                <span className="font-mono">
                  {sessionStorage.getItem('isAuthed') || '✗ Empty'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">user:</span>
                <span className="font-mono">
                  {sessionStorage.getItem('user') ? '✓ Stored' : '✗ Empty'}
                </span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <LogOut className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Actions</h2>
            </div>
            
            <div className="space-y-3">
              {isAuthenticated ? (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full text-red-600 border-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Button
                  onClick={() => window.location.href = '/login'}
                  variant="primary"
                  className="w-full"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Go to Login
                </Button>
              )}
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
          </Card>
        </div>

        {/* Features List */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Session-Based Authentication Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">✅ Implemented Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• sessionStorage token storage (like eduloom)</li>
                <li>• Automatic route protection</li>
                <li>• Session expiry handling</li>
                <li>• API request authentication</li>
                <li>• Clean logout functionality</li>
                <li>• User information persistence</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">🔧 How to Use:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Visit <code className="bg-gray-100 px-1 rounded">/login</code> to login</li>
                <li>• Access all protected routes after login</li>
                <li>• Session expires when browser closes</li>
                <li>• Automatic redirect on 403 errors</li>
                <li>• Token included in all API requests</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SessionDemo;
