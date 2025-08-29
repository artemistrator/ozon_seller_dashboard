# Ozon FBS Analytics Dashboard

## 🎯 **Overview**

A comprehensive, modular web dashboard for Ozon FBS (Fulfilled By Seller) sales analytics. The dashboard provides real-time insights into sales performance, financial metrics, product analytics, regional performance, and detailed transaction tracking.

## ✨ **Features**

### 📊 **Sales Analytics**
- Interactive daily sales charts with GMV/Orders/Units views
- 8 key performance metrics with period-over-period comparison
- Real-time trend indicators and percentage changes
- Moscow timezone handling for accurate date calculations

### 🛍️ **Product Performance**
- Comprehensive product table with pagination and search
- Performance metrics by SKU with profit calculations
- Advanced filtering and sorting capabilities
- Revenue and unit analysis per product

### 🌍 **Regional Analysis**
- Top-performing regions ranked by revenue
- Regional metrics comparison with sorting
- Geographic performance insights
- Region-wise GMV and order analysis

### 💰 **Financial Breakdown**
- Interactive pie chart showing financial category distribution
- Detailed expense tracking (commissions, delivery, ads, services)
- Net profit calculations and profitability analysis
- Category-wise financial insights

### 📑 **Transaction Details**
- Comprehensive transaction table with advanced search
- Category filtering and multi-column sorting
- Detailed operation tracking with service/item breakdown
- Posting number search and warehouse information

## 🛠️ **Technology Stack**

- **Frontend**: Vite + React + TypeScript + TailwindCSS
- **State Management**: React Query + URL-synchronized filters
- **Charts**: Recharts library
- **Database**: Supabase (PostgreSQL) with custom views and RPC functions
- **Styling**: Custom component system with responsive design
- **Routing**: React Router with nested layouts

## 🏗️ **Architecture**

### **Database Layer**
- **5 Custom Views** for optimized data retrieval:
  - `vw_daily_sales` - Aggregated daily sales metrics
  - `vw_products_performance` - Product analytics
  - `vw_regions_performance` - Regional performance
  - `vw_finance_breakdown` - Financial categorization
  - `vw_transaction_details` - Detailed transaction data

- **2 RPC Functions** for complex queries:
  - `get_sales_metrics()` - Filtered sales aggregations
  - `get_finance_summary()` - Financial breakdown by category

### **Frontend Architecture**
- **Modular Component System** with reusable UI components
- **Feature-based Organization** with separate hooks for each domain
- **URL State Synchronization** for shareable filter states
- **Responsive Design** with mobile-first approach

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Supabase account with project setup

### **Installation**

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Access the dashboard**:
   Open `http://localhost:5173` in your browser

## 📋 **Database Setup**

The dashboard requires specific database views and RPC functions. These are automatically created when you first run the application, but you can also create them manually using the migration files in the project.

### **Required Tables**
- `postings_fbs` - FBS order postings
- `finance_transactions` - Financial operations
- `finance_transaction_services` - Service details
- `finance_transaction_items` - Item details

## 🎨 **Key Features Explained**

### **Smart Date Handling**
- All dates are normalized to Moscow timezone (`Europe/Moscow`)
- Default 7-day period on initial load
- Automatic period-over-period comparison
- Flexible date range selection

### **Advanced Filtering**
- **Global Filters**: Date range, SKU, Region (URL-synchronized)
- **Table-specific**: Search, pagination, sorting, category filters
- **Cross-tab Consistency**: Filters apply across all dashboard sections

### **Performance Optimizations**
- **Server-side Pagination** for large datasets
- **Query Caching** with React Query (5-minute stale time)
- **Optimized Database Views** for faster data retrieval
- **Lazy Loading** and code splitting ready

### **Russian Localization**
- Currency formatting in RUB
- Number formatting with Russian locale (`ru-RU`)
- Cyrillic interface with proper typography
- Date formatting in Russian format

## 📊 **Metrics & KPIs**

### **Sales Metrics**
- **GMV** (Gross Merchandise Value)
- **Revenue** (Seller payout)
- **Net Profit** (Revenue minus all costs)
- **Orders** & **Units** sold
- **Average Order Value**
- **Cancellation Rate**
- **In-Delivery Volume**

### **Financial Categories**
- **Sales**: Product revenue (positive)
- **Commissions**: Platform fees (negative)
- **Delivery**: Shipping costs (negative)
- **Returns**: Return delivery costs (negative)
- **Ads**: Advertising expenses (negative)
- **Services**: Additional services (negative)

## 🔧 **Customization**

### **Adding New Tabs**
1. Create new page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update sidebar navigation in `src/components/layout/AppLayout.tsx`
4. Create corresponding data hooks in `src/hooks/`

### **Extending Metrics**
1. Update database views with new calculated fields
2. Modify TypeScript interfaces in hook files
3. Add new metric cards to relevant pages
4. Update formatting utilities if needed

## 🔍 **Troubleshooting**

### **Common Issues**

1. **\"No data\" showing**:
   - Check Supabase connection and credentials
   - Verify database tables contain data for selected period
   - Check browser console for API errors

2. **Slow loading**:
   - Verify database indexes on date columns
   - Check if views are properly created
   - Consider reducing date range for large datasets

3. **Filter not working**:
   - Clear browser cache and local storage
   - Check URL parameters for corruption
   - Verify filter values match database format

### **Development Tools**
- **React Query DevTools**: Add for debugging data fetching
- **Supabase Dashboard**: Monitor database performance
- **Browser DevTools**: Check network requests and console errors

## 📈 **Future Enhancements**

### **Planned Features**
- **Export Functionality**: CSV/Excel export for all tables
- **Advanced Analytics**: Cohort analysis, forecasting
- **Real-time Updates**: WebSocket integration for live data
- **Mobile App**: React Native version
- **Multi-tenant**: Support for multiple seller accounts

### **Performance Improvements**
- **Materialized Views**: For heavy aggregations
- **CDN Integration**: For static assets
- **Progressive Web App**: Offline capabilities
- **GraphQL**: More efficient data fetching

## 🤝 **Contributing**

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 **Support**

For support and questions:
- Check the troubleshooting section above
- Review database schema and data requirements
- Ensure all dependencies are properly installed
- Verify Supabase configuration and permissions

---

**Built with ❤️ for Ozon sellers to optimize their FBS performance**