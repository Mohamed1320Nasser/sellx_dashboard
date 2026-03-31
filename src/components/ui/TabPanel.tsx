import React, { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface TabPanelProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="flex space-x-4 space-x-reverse px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all
                  ${
                    isActive
                      ? 'border-primary-600 text-primary-700 bg-primary-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`
                      px-2 py-0.5 text-xs rounded-full font-semibold
                      ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }
                    `}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6 bg-gray-50">
        {children}
      </div>
    </div>
  );
};

interface TabContentProps {
  id: string;
  activeTab: string;
  children: ReactNode;
}

export const TabContent: React.FC<TabContentProps> = ({
  id,
  activeTab,
  children,
}) => {
  if (id !== activeTab) return null;

  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  );
};
