# 🛍️ Ozon FBS Analytics Dashboard

**Professional analytics dashboard for Ozon FBS sellers with comprehensive financial analysis, cost management, and real-time insights.**

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-green) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue) ![Supabase](https://img.shields.io/badge/Database-Supabase-green)

## ✨ Key Features

### 📊 Financial Analytics
- **Real-time financial tracking** with automatic transaction categorization
- **Advanced profitability analysis** including cost of goods sold (COGS)
- **Interactive financial structure** with pie charts and breakdowns
- **Net profit visualization** with optional 6% tax calculations
- **Category-based expense analysis** (Sales, Commissions, Advertising, Delivery, etc.)
- **Financial operations** based on actual transaction dates

### 📈 Sales Analytics
- **Daily sales performance** tracking with trend analysis
- **GMV vs Revenue** detailed comparison and metrics
- **Regional performance** breakdown with geographic insights
- **Order completion** rates and fulfillment analytics
- **Average order value** tracking and optimization

### 🏷️ Product Management
- **SKU-level performance** analysis with profitability rankings
- **Dynamic cost price management** with real-time editing interface
- **Automated profit margin** calculations and monitoring
- **Product profitability** insights and recommendations
- **Cost analysis** integration across all metrics

### 🌍 Regional Analytics
- **Geographic performance** breakdown by delivery regions
- **Regional profitability** analysis and comparisons
- **Order distribution** patterns across different areas
- **Regional growth** trends and insights

### 🔍 Transaction Details
- **Transaction-level** detailed view and filtering
- **Financial operation** categorization and analysis
- **Historical transaction** tracking and search
- **Detailed financial** breakdowns by operation type

## 🛠️ Tech Stack

**Frontend**:
- ⚛️ **React 18** with TypeScript for type safety
- ⚡ **Vite** for lightning-fast development
- 🎨 **TailwindCSS** for modern, responsive styling
- 📊 **Recharts** for beautiful data visualizations
- 🎭 **Lucide Icons** for consistent iconography

**State & Data Management**:
- 🔄 **TanStack Query** for server state management
- 🐻 **Zustand** for client state management
- 🌐 **React Router v6** for navigation

**Backend & Database**:
- 🗄️ **Supabase** (PostgreSQL) for robust data storage
- 🔐 **Row Level Security** for data protection
- ⚡ **Real-time subscriptions** for live updates
- 🔧 **Custom RPC functions** for complex analytics

## 🚀 Quick Deploy

### Option 1: Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fartemistrator%2Fozon_seller_dashboard&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY)

1. Click the deploy button above
2. Connect your GitHub account
3. Set environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
4. Deploy!

### Option 2: Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/artemistrator/ozon_seller_dashboard)

1. Click the deploy button above
2. Connect your GitHub account  
3. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Set environment variables in Netlify dashboard
5. Deploy!

## 🏗️ Local Development

### Prerequisites
- **Node.js 18+** and npm
- **Supabase account** (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/artemistrator/ozon_seller_dashboard.git
cd ozon_seller_dashboard

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

## 🗄️ Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (2-3 minutes)
3. Go to **Settings > API** to get your credentials

### 2. Run Database Scripts
Execute these SQL scripts in your Supabase SQL Editor **in order**:

```sql
-- 1. Create tables (required)
-- Run: database/01_create_tables.sql

-- 2. Create views (required)
-- Run: database/02_create_views.sql

-- 3. Create functions (required)
-- Run: database/03_create_functions.sql
```

### 3. Environment Configuration

Update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 📊 Database Schema Overview

### Core Tables
- **`postings_fbs`** - Ozon FBS posting data with comprehensive metrics
- **`finance_transactions`** - Detailed financial transaction records
- **`product_costs`** - Product cost price management and tracking

### Analytical Views
- **`vw_daily_sales`** - Daily sales performance aggregation
- **`vw_products_performance`** - Product-level analytics with profitability
- **`vw_regions_performance`** - Regional performance breakdown
- **`vw_finance_breakdown`** - Financial categorization and analysis
- **`vw_cost_analysis`** - Cost analysis and margin calculations

### RPC Functions
- **`get_sales_metrics_by_date_type_correct`** - Advanced sales analytics
- **`get_finance_summary`** - Comprehensive financial summary
- **`get_products_performance`** - Product performance with pagination
- **`get_regions_performance`** - Regional analytics with sorting

## 💡 Key Formulas

### Financial Calculations

**Profitability**:
```typescript
Profitability = (Total Income - Total Expenses - Cost of Goods Sold) / Total Income × 100
```

**Net Profit**:
```typescript
Net Profit = Total Income - Total Expenses - Cost of Goods Sold
Net Profit (after 6% tax) = Net Profit × 0.94
```

**Margin Analysis**:
```typescript
Margin = (Selling Price - Cost Price) / Selling Price × 100
```

## 🎯 Feature Highlights

### 🔄 Real-time Cost Management
- Edit product cost prices directly in the interface
- Automatic profit recalculation across all analytics
- Historical cost tracking with timestamps

### 📅 Flexible Date Filtering
- **Delivery Date** - When customer received the order
- **Shipment Date** - When order was shipped from warehouse
- **Order Date** - When order was initially created
- **Financial Operations** - Based on actual transaction dates

### 📱 Responsive Design
- 🖥️ **Desktop** (1920px+) - Full analytics dashboard
- 💻 **Laptop** (1024px+) - Optimized layout
- 📱 **Tablet** (768px+) - Touch-friendly interface
- 📱 **Mobile** (375px+) - Mobile-optimized views

### 🌙 Theme Support
- **Light/Dark mode** with system preference detection
- **Consistent styling** across all components
- **Accessibility focused** with proper contrast ratios

## 🚀 Production Deployment

### Build Optimization

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

### Environment Variables for Production

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |

### Performance Features
- 🔄 **React Query caching** for optimal data fetching
- 📦 **Code splitting** with lazy loading
- 🗜️ **Bundle optimization** with Vite
- 📊 **Efficient re-renders** with optimized dependencies

## 🔧 Maintenance & Updates

### Database Maintenance
- **Regular backups** through Supabase dashboard
- **Index optimization** for large datasets
- **Query performance** monitoring

### Application Updates
- **Dependency updates** with `npm update`
- **Security patches** through automated alerts
- **Feature additions** through GitHub releases

## 🆘 Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run lint
```

**Database Connection Issues**:
- Verify Supabase URL and key in `.env`
- Check if database scripts ran successfully
- Ensure RPC functions are properly created

**Performance Issues**:
- Monitor Supabase dashboard for usage
- Check browser developer tools for errors
- Optimize database queries if needed

## 📚 Data Import Guide

To use the dashboard with your Ozon data:

1. **Export data** from Ozon Seller Portal
2. **Transform data** to match the database schema
3. **Import data** using Supabase dashboard or API
4. **Verify data** through the dashboard analytics

*Detailed data import guide available in the `/docs` folder.*

## 🤝 Contributing

We welcome contributions! Please:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🌟 Support

- 🐛 **Bug reports**: [Create an issue](https://github.com/artemistrator/ozon_seller_dashboard/issues)
- 💡 **Feature requests**: [Discussions](https://github.com/artemistrator/ozon_seller_dashboard/discussions)
- 📖 **Documentation**: Check `/docs` folder
- 💬 **Community support**: GitHub Discussions

---

**⭐ If this project helps you, please give it a star on GitHub!**

**Built with ❤️ for Ozon FBS sellers to maximize their business insights and profitability.**