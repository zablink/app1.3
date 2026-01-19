import { TrendingUp, TrendingDown } from 'lucide-react';

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: any;
  children: React.ReactNode;
}

export function TabButton({ active, onClick, icon: Icon, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
        active
          ? 'bg-orange-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  change?: string;
  trend?: 'up' | 'down';
  icon: any;
  color: string;
}

export function MetricCard({ title, value, change, trend, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {change}
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

// Status Row Component
interface StatusRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: any;
  iconColor: string;
}

export function StatusRow({ label, value, total, color, icon: Icon, iconColor }: StatusRowProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Activity Card Component
interface ActivityCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: any;
  color: string;
}

export function ActivityCard({ title, value, subtitle, icon: Icon, color }: ActivityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-4">
        <div className={`p-4 ${color} rounded-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  description: string;
}

export function StatsCard({ title, value, icon: Icon, color, description }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 ${color} rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

// Progress Bar Component
interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

export function ProgressBar({ label, value, total, color }: ProgressBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {value} / {total} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: any;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-gray-500">
      <Icon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">{title}</p>
      <p className="text-sm mt-1">{description}</p>
    </div>
  );
}

// Section Card Component
interface SectionCardProps {
  title: string;
  icon?: any;
  iconColor?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionCard({ title, icon: Icon, iconColor, children, action }: SectionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 ${iconColor || 'text-gray-600'}`} />}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}
