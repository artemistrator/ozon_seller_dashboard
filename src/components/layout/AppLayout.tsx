import React from 'react';
import { Outlet, NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { 
  TrendingUp, 
  Package, 
  MapPin, 
  DollarSign, 
  FileText,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { FilterBar } from './FilterBar';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const navigation = [
  { name: 'Продажи', href: '/sales', icon: TrendingUp },
  { name: 'По товарам', href: '/products', icon: Package },
  { name: 'По регионам', href: '/regions', icon: MapPin },
  { name: 'Финансы', href: '/finance', icon: DollarSign },
  { name: 'Детализация', href: '/transactions', icon: FileText },
];

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Function to preserve current filter parameters when navigating
  const getNavigationUrl = (href: string) => {
    const currentParams = searchParams.toString();
    return currentParams ? `${href}?${currentParams}` : href;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-ozon-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                Ozon Analytics
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={getNavigationUrl(item.href)}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-ozon-50 dark:bg-ozon-900/50 text-ozon-700 dark:text-ozon-300 border-r-2 border-ozon-600' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`
                    mr-3 h-5 w-5 transition-colors
                    ${isActive ? 'text-ozon-600 dark:text-ozon-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}
                  `} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Dashboard v1.0.0
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title={theme === 'light' ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex-1">
              <FilterBar />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};