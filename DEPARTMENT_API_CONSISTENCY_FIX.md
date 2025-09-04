# Department API Consistency Fix

## 🔍 Problem Identified
The department overview page (`/departments`) and admin departments page (`/admin/departments`) were showing **different values** for the same departments due to inconsistent calculation logic between their respective API endpoints.

## 🔧 Root Causes Fixed

### 1. Purchase Order Status Filters Mismatch
**Before:**
- Overview API: `['SENT', 'CONFIRMED', 'RECEIVED']`
- Admin API: `['APPROVED', 'ORDERED', 'RECEIVED']`

**After:**
- Both APIs now use: `['APPROVED', 'ORDERED', 'RECEIVED']`

### 2. Request Spending Calculation Methods
**Before:**
- Overview API: Used `_sum.totalAmount` (aggregation)
- Admin API: Manually calculated by iterating through items

**After:**
- Both APIs now use: `_sum.totalAmount` aggregation method

### 3. Budget Fallback Values
**Before:**
- Overview API: Used fallback budget of `50000` if no budget set
- Admin API: Used `0` if no budget set

**After:**
- Both APIs now use: `0` if no budget set (more accurate)

### 4. Request Query Inconsistency
**Before:**
- Overview API: Used OR condition for legacy department names
- Admin API: Only used `departmentId`

**After:**
- Both APIs now use: `departmentId` only (cleaner, more reliable)

## 📊 Files Modified

1. **`/src/app/api/departments/overview/route.ts`**
   - Changed PO status filter to match admin API
   - Removed budget fallback to use actual values
   - Simplified request query to use departmentId only

2. **`/src/app/api/admin/departments/route.ts`**
   - Changed from manual item calculation to aggregation
   - Added null check for budget division

## ✅ Expected Results

After these fixes:
- **Monthly Spending** values should match between both pages
- **Budget Usage percentages** should be identical
- **User counts** should remain consistent
- **Request counts** should match

## 🧪 Verification

Run the verification script to confirm consistency:
```bash
npx tsx verify-api-consistency.ts
```

The script will:
- Compare values from both API endpoints for each department
- Highlight any remaining discrepancies
- Check for data integrity issues

## 📝 Notes

- Users with proper department assignments are required for accurate calculations
- Both APIs now use the same calculation logic for all metrics
- Budget utilization will show 0% for departments without budget values (instead of arbitrary calculations)
- All PO statuses now follow the same business logic across the application