import React from 'react';
// import { PermissionGuard, PermissionButton, PermissionLink } from '../components/common';
import { PermissionGuard } from '../components/common/PermissionGuard';
import { PermissionButton } from '../components/common/PermissionButton';
import { PermissionLink } from '../components/common/PermissionLink';
import { Button } from '../components/ui';

/**
 * Example component showing how to use permission-based UI components
 */
export const PermissionExample: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Permission System Examples</h1>
      
      {/* Example 1: Hide/Show entire sections */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">1. Hide/Show Sections</h2>
        
        <PermissionGuard permission="canViewAnalytics">
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h3 className="font-medium text-blue-900">Analytics Section</h3>
            <p className="text-blue-700">This section is only visible to users with analytics permissions.</p>
          </div>
        </PermissionGuard>

        <PermissionGuard permission="canViewUsers">
          <div className="bg-green-50 p-4 rounded border border-green-200 mt-4">
            <h3 className="font-medium text-green-900">User Management Section</h3>
            <p className="text-green-700">This section is only visible to users with user management permissions.</p>
          </div>
        </PermissionGuard>
      </div>

      {/* Example 2: Permission-based buttons */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">2. Permission-based Buttons</h2>
        
        <div className="space-x-4">
          <PermissionButton
            permission="canCreateProducts"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Product
          </PermissionButton>

          <PermissionButton
            permission="canEditProducts"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Edit Product
          </PermissionButton>

          <PermissionButton
            permission="canDeleteProducts"
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Delete Product
          </PermissionButton>
        </div>

        {/* Button with fallback when permission denied */}
        <div className="mt-4">
          <PermissionButton
            permission="canCreateUsers"
            hideWhenDisabled={false}
            disabledFallback={
              <Button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed">
                Create User (No Permission)
              </Button>
            }
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Create User
          </PermissionButton>
        </div>
      </div>

      {/* Example 3: Permission-based links */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">3. Permission-based Links</h2>
        
        <div className="space-x-4">
          <PermissionLink
            to="/analytics"
            permission="canViewAnalytics"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Analytics
          </PermissionLink>

          <PermissionLink
            to="/users"
            permission="canViewUsers"
            className="text-green-600 hover:text-green-800 underline"
          >
            Manage Users
          </PermissionLink>

          <PermissionLink
            to="/salaries"
            permission="canViewSalaries"
            className="text-purple-600 hover:text-purple-800 underline"
          >
            View Salaries
          </PermissionLink>
        </div>
      </div>

      {/* Example 4: Multiple permissions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">4. Multiple Permissions</h2>
        
        {/* Requires ANY of the permissions */}
        <PermissionGuard permissions={['canViewSales', 'canViewPurchases']}>
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <h3 className="font-medium text-yellow-900">Sales or Purchases Access</h3>
            <p className="text-yellow-700">This section is visible if user can view sales OR purchases.</p>
          </div>
        </PermissionGuard>

        {/* Requires ALL permissions */}
        <PermissionGuard 
          permissions={['canCreateUsers', 'canEditUsers', 'canDeleteUsers']} 
          requireAll={true}
        >
          <div className="bg-red-50 p-4 rounded border border-red-200 mt-4">
            <h3 className="font-medium text-red-900">Full User Management</h3>
            <p className="text-red-700">This section is only visible if user has ALL user management permissions.</p>
          </div>
        </PermissionGuard>
      </div>

      {/* Example 5: Complex permission logic */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">5. Complex Permission Logic</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inventory Management */}
          <PermissionGuard permissions={['canViewProducts', 'canViewCategories', 'canViewSuppliers']}>
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <h3 className="font-medium text-blue-900">Inventory Management</h3>
              <p className="text-blue-700 text-sm">Access to products, categories, or suppliers</p>
            </div>
          </PermissionGuard>

          {/* Financial Operations */}
          <PermissionGuard permissions={['canViewFinancialReports', 'canViewAnalytics']}>
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <h3 className="font-medium text-green-900">Financial Operations</h3>
              <p className="text-green-700 text-sm">Access to financial reports or analytics</p>
            </div>
          </PermissionGuard>

          {/* HR Operations */}
          <PermissionGuard permissions={['canViewAbsences', 'canViewSalaries']}>
            <div className="bg-purple-50 p-4 rounded border border-purple-200">
              <h3 className="font-medium text-purple-900">HR Operations</h3>
              <p className="text-purple-700 text-sm">Access to absences or salaries</p>
            </div>
          </PermissionGuard>

          {/* Admin Operations */}
          <PermissionGuard permissions={['canManageUserRoles', 'canDeleteUsers']}>
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <h3 className="font-medium text-red-900">Admin Operations</h3>
              <p className="text-red-700 text-sm">Full administrative access</p>
            </div>
          </PermissionGuard>
        </div>
      </div>
    </div>
  );
};

export default PermissionExample;
