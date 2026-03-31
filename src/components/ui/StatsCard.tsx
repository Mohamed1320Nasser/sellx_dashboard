import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: LucideIcon;
  color?: "primary" | "secondary" | "accent" | "success" | "warning" | "danger";
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = "primary",
  loading = false,
}) => {
  const colorClasses = {
    primary: "text-primary-600 bg-primary-100",
    secondary: "text-secondary-600 bg-secondary-100",
    accent: "text-accent-600 bg-accent-100",
    success: "text-green-600 bg-green-100",
    warning: "text-yellow-600 bg-yellow-100",
    danger: "text-red-600 bg-red-100",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex flex-col space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="flex flex-col space-y-1">
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:shadow-gray-200/50 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        {/* Left side - Content */}
        <div className="flex flex-col space-y-2 flex-1">
          {/* Title with proper alignment */}
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          
          {/* Value */}
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 leading-none">{value}</p>
          
          {/* Change indicator with proper spacing */}
          {change && (
            <div className="flex flex-col space-y-1">
              <span
                className={`text-sm font-semibold ${
                  change.type === "increase"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {change.type === "increase" ? "+" : ""}
                {change.value}%
              </span>
              <span className="text-xs text-gray-500">من الأسبوع الماضي</span>
            </div>
          )}
        </div>
        
        {/* Right side - Icon with perfect alignment */}
        <div className={`p-3 rounded-xl ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 lg:w-7 lg:h-7" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
