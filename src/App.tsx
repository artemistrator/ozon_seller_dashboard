import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { SalesPage } from './pages/SalesPage';
import { ProductsPage } from './pages/ProductsPage';
import { RegionsPage } from './pages/RegionsPage';
import { FinancePage } from './pages/FinancePage';
import { TransactionsPage } from './pages/TransactionsPage';

// Component to handle redirect with preserved search params
const RedirectToSales: React.FC = () => {
  const location = useLocation();
  return <Navigate to={`/sales${location.search}`} replace />;
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && 'status' in error && typeof (error as any).status === 'number' && (error as any).status >= 400 && (error as any).status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<RedirectToSales />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="regions" element={<RegionsPage />} />
                <Route path="finance" element={<FinancePage />} />
                <Route path="transactions" element={<TransactionsPage />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;