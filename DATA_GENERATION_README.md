# Comprehensive Data Generation Scripts

This directory contains powerful data generation scripts that create realistic historical data for your office supplies management system.

## 📋 What Gets Generated

### Historical Data (Last 10 Years: 2015-2025)
- **Requests**: Monthly supply requests with realistic seasonal patterns
- **Purchase Orders**: Supplier orders with proper status progression
- **Stock Movements**: Inventory in/out movements with various reasons
- **Returns**: Product returns with different conditions and reasons
- **Audit Logs**: System activity tracking
- **Demand Forecasts**: Predictive analytics data

### Current Month Data (Detailed)
- **Hourly Granularity**: Business hour patterns (8 AM - 6 PM)
- **Business Day Focus**: Higher activity on weekdays
- **Real-time Patterns**: Lunch breaks, peak hours, etc.
- **Notifications**: System alerts and updates
- **Weekly Forecasts**: Short-term demand predictions

## 🚀 Quick Start

### Option 1: Generate Everything (Recommended)
```bash
node generate-all-data.js
```
This master script will:
1. Check existing data
2. Generate base data if needed
3. Create 10+ years of historical data
4. Add detailed current month data
5. Generate specialized analytics data
6. Provide comprehensive summary

### Option 2: Individual Scripts

#### Generate Historical Data Only
```bash
node generate-historical-data.js
```

#### Generate Current Month Data Only
```bash
node generate-current-month-data.js
```

#### Generate 2025 Data (Existing Script)
```bash
node generate-2025-data.js
```

## 📊 Data Patterns & Features

### Realistic Business Patterns
- **Seasonal Variations**: Higher activity in Q1, Q3, Q4
- **Growth Trends**: 3-8% annual growth with volatility
- **Department Patterns**: Different spending patterns per department
- **Business Hours**: Activity concentrated during work hours
- **Weekend Minimal**: Reduced activity on weekends

### Historical Accuracy
- **Price Inflation**: ~2.5% annual price increases
- **Status Evolution**: Older records more likely to be completed
- **Supplier Variations**: Different pricing from suppliers
- **Quantity Realism**: Appropriate quantities per item type

### Current Month Details
- **Hourly Data**: Requests and movements throughout business days
- **Peak Times**: Morning (9-11 AM) and afternoon (2-4 PM) peaks
- **Lunch Dip**: Reduced activity during lunch hours
- **Daily Orders**: 1-2 purchase orders per business day
- **Real-time Notifications**: System alerts and updates

## 📈 Generated Statistics

After running the complete generation, you'll have:

- **~1,500-2,000 Requests** across 10+ years
- **~800-1,200 Purchase Orders** with realistic progression
- **~2,000-3,000 Stock Movements** with various reasons
- **~300-500 Returns** with different conditions
- **~500+ Notifications** for current operations
- **Comprehensive Audit Trail** for all activities
- **Monthly & Weekly Forecasts** for demand planning

## 🔧 Customization

### Modify Seasonal Patterns
Edit `getSeasonalMultiplier()` in the scripts to adjust monthly activity levels.

### Change Growth Rates
Modify `getYearlyGrowthMultiplier()` to adjust annual growth patterns.

### Adjust Business Hours
Update `getHourlyMultiplier()` to change peak activity times.

### Department Patterns
Customize `getDepartmentSpendingPattern()` for different department behaviors.

## 📋 Prerequisites

1. **Database Setup**: Ensure Prisma is configured and database is accessible
2. **Base Data**: Users, items, suppliers, and categories should exist
3. **Node.js**: Scripts require Node.js runtime
4. **Dependencies**: Prisma Client should be installed

## ⚠️ Important Notes

### Performance
- Historical data generation may take 5-15 minutes
- Current month generation is faster (1-3 minutes)
- Large datasets may require database optimization

### Data Integrity
- Scripts check for existing data to avoid duplicates
- Unique constraints are respected (order numbers, return numbers)
- Foreign key relationships are maintained

### Customization Safety
- Always backup your database before running scripts
- Test on development environment first
- Scripts include error handling and rollback capabilities

## 🐛 Troubleshooting

### Common Issues

1. **"No base data found"**
   - Run `npx prisma db seed` first
   - Ensure users, items, and suppliers exist

2. **Database connection errors**
   - Check Prisma configuration
   - Verify database is running and accessible

3. **Memory issues with large datasets**
   - Run scripts individually instead of all at once
   - Consider increasing Node.js memory limit

4. **Duplicate key errors**
   - Scripts handle most duplicates automatically
   - Check for existing data with similar patterns

### Getting Help

1. Check the console output for detailed error messages
2. Verify database schema matches Prisma models
3. Ensure all required dependencies are installed
4. Test with smaller date ranges first

## 📊 Data Verification

After generation, verify your data:

```sql
-- Check yearly distribution
SELECT
  strftime('%Y', createdAt) as year,
  COUNT(*) as requests
FROM requests
GROUP BY year
ORDER BY year;

-- Check current month activity
SELECT 
  strftime('%Y-%m-%d', createdAt) as date,
  COUNT(*) as daily_requests
FROM requests 
WHERE createdAt >= date('now', 'start of month')
GROUP BY date 
ORDER BY date;

-- Verify business patterns
SELECT
  strftime('%H', createdAt) as hour,
  COUNT(*) as activity
FROM requests
WHERE createdAt >= date('now', 'start of month')
GROUP BY hour
ORDER BY hour;
```

## 🎯 Next Steps

After data generation:

1. **Test Analytics**: Verify reporting dashboards work with historical data
2. **Performance Testing**: Check system performance with large datasets
3. **User Training**: Familiarize users with the rich historical context
4. **Backup Strategy**: Implement regular backups for the valuable dataset

---

**Happy Data Generation!** 🚀📊✨
