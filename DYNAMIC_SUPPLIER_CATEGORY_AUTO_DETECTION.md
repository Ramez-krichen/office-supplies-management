# Dynamic Supplier Category Auto-Detection System

## Overview

The Dynamic Supplier Category Auto-Detection system is an intelligent categorization solution that automatically identifies and suggests relevant categories for suppliers based on multiple analysis methods. It uses AI-powered algorithms to analyze supplier profiles, item patterns, and historical purchase data to provide accurate category suggestions with confidence scores.

## Features

### 🔍 Multi-Method Detection
- **Supplier Profile Analysis**: Analyzes supplier name, website, contact information, and notes
- **Item Pattern Analysis**: Examines item names and descriptions for category patterns
- **Historical Purchase Analysis**: Reviews past purchase orders and spending patterns
- **Confidence Scoring**: Provides confidence levels for each suggestion (0-100%)

### 🚀 Enhanced Detection Algorithms
- **Pattern Matching**: Uses predefined category patterns for office supplies
- **Keyword Analysis**: Intelligent keyword matching with weighted scoring
- **Frequency Analysis**: Considers item frequency and spending patterns
- **Multi-Method Consolidation**: Combines results from multiple detection methods

### 📊 Real-Time Suggestions
- **Live Category Suggestions**: Get suggestions without updating database
- **Interactive UI Components**: User-friendly suggestion interface
- **Confidence Indicators**: Visual confidence levels for each suggestion
- **Method Attribution**: Shows which detection method generated each suggestion

## Architecture

### Core Components

#### 1. Detection Service (`src/lib/supplier-category-detection.ts`)
- **Enhanced Detection Functions**: Advanced multi-method analysis
- **Category Patterns**: Predefined patterns for office supplies
- **Suggestion Consolidation**: Intelligent merging of detection results
- **Confidence Calculation**: Mathematical confidence scoring

#### 2. API Endpoints
- **Individual Detection**: `/api/suppliers/[id]/detect-categories`
- **Bulk Detection**: `/api/suppliers/detect-categories-bulk`
- **Enhanced Supplier Listing**: `/api/suppliers` (with category metadata)

#### 3. Frontend Components
- **Supplier Category Suggestions**: Interactive React component
- **Category Confidence Badges**: Visual confidence indicators
- **Real-time Updates**: Live suggestion fetching and updates

### Database Schema

```sql
-- Supplier table with enhanced category fields
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  -- ... other supplier fields ...
  categories TEXT, -- JSON string with enhanced metadata
  categoriesDetectedAt DATETIME,
  -- Enhanced categories format:
  -- {
  --   "categories": ["Office Furniture", "Stationery"],
  --   "confidence": 0.85,
  --   "detectionMethods": ["supplier_profile_analysis", "item_pattern_analysis"],
  --   "suggestions": [...],
  --   "detectedAt": "2025-01-26T13:00:00.000Z"
  -- }
);
```

## API Documentation

### Individual Supplier Detection

#### `POST /api/suppliers/[id]/detect-categories`

Runs category detection for a specific supplier and updates the database.

**Request Body:**
```json
{
  "enhanced": true  // Optional, defaults to true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Categories detected and updated successfully",
  "categories": ["Office Furniture", "Stationery & Writing"],
  "suggestions": [
    {
      "category": "Office Furniture",
      "confidence": 0.85,
      "method": "supplier_profile_analysis",
      "reasoning": "Matched keywords: desk, chair, furniture"
    }
  ],
  "summary": "2 categories detected from 15 items (85% confidence): Office Furniture, Stationery & Writing via supplier_profile_analysis, item_pattern_analysis",
  "detectedAt": "2025-01-26T13:00:00.000Z",
  "itemCount": 15,
  "categoryCount": 2,
  "confidence": 0.85,
  "detectionMethods": ["supplier_profile_analysis", "item_pattern_analysis"],
  "enhanced": true
}
```

#### `GET /api/suppliers/[id]/detect-categories`

Retrieves current categories and fresh suggestions without updating the database.

**Query Parameters:**
- `enhanced`: boolean (default: true)

**Response:**
```json
{
  "supplierId": "supplier-123",
  "supplierName": "Office Pro Solutions",
  "currentCategories": ["Office Furniture"],
  "currentSuggestions": [...],
  "currentConfidence": 0.85,
  "currentDetectionMethods": ["supplier_profile_analysis"],
  "lastDetectedAt": "2025-01-26T12:00:00.000Z",
  "freshSuggestions": [...],
  "freshCategories": ["Office Furniture", "Stationery & Writing"],
  "freshConfidence": 0.90,
  "enhanced": true
}
```

### Bulk Detection

#### `POST /api/suppliers/detect-categories-bulk`

Runs category detection on multiple suppliers or all active suppliers.

**Request Body:**
```json
{
  "supplierIds": ["supplier-1", "supplier-2"],  // Optional, if omitted processes all
  "enhanced": true  // Optional, defaults to true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk detection completed: 25/30 suppliers updated",
  "processed": 30,
  "updated": 25,
  "errors": 5,
  "results": [
    {
      "supplierId": "supplier-1",
      "supplierName": "Office Pro",
      "categories": ["Office Furniture"],
      "confidence": 0.85,
      "detectionMethods": ["supplier_profile_analysis"],
      "itemCount": 15
    }
  ],
  "enhanced": true
}
```

#### `GET /api/suppliers/detect-categories-bulk`

Gets bulk detection status and available suppliers.

**Response:**
```json
{
  "suppliersAvailable": [
    {
      "id": "supplier-1",
      "name": "Office Pro",
      "itemCount": 15
    }
  ],
  "totalSuppliersCount": 50,
  "recentBulkOperations": [
    {
      "id": "audit-123",
      "details": "Bulk category detection completed: 25/30 suppliers updated",
      "performedBy": "admin@example.com",
      "timestamp": "2025-01-26T13:00:00.000Z"
    }
  ]
}
```

### Enhanced Supplier Listing

#### `GET /api/suppliers`

Enhanced supplier listing with category metadata.

**Query Parameters:**
- `enhanced`: boolean (default: true)
- `page`: number (pagination)
- `limit`: number (items per page)
- `search`: string (search term)

**Response:**
```json
{
  "suppliers": [
    {
      "id": "supplier-1",
      "name": "Office Pro Solutions",
      // ... standard supplier fields ...
      "categories": ["Office Furniture", "Stationery & Writing"],
      "categoryConfidence": 0.85,
      "categoryDetectionMethods": ["supplier_profile_analysis", "item_pattern_analysis"],
      "categoriesDetectedAt": "2025-01-26T13:00:00.000Z",
      "enhanced": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

## Category Patterns

The system uses predefined patterns for accurate office supply categorization:

### Office Furniture
- Keywords: desk, chair, table, cabinet, shelf, furniture, ergonomic, adjustable, swivel, executive
- Weight: 0.8-0.9

### Technology & Electronics
- Keywords: computer, laptop, monitor, printer, scanner, projector, tablet, cable, adapter, charger, wireless, bluetooth, usb, hdmi, software, license, subscription, cloud
- Weight: 0.8-0.95

### Stationery & Writing
- Keywords: pen, pencil, marker, highlighter, eraser, ruler, notebook, notepad, diary, planner, calendar, stapler, clips, binder, folder, envelope
- Weight: 0.8-0.9

### Printing & Paper
- Keywords: paper, cardstock, letterhead, envelope, label, ink, toner, cartridge, ribbon
- Weight: 0.9-0.95

### Cleaning & Maintenance
- Keywords: cleaning, sanitizer, disinfectant, wipes, soap, detergent, vacuum, mop, broom, trash, recycling
- Weight: 0.85-0.9

### Catering & Refreshments
- Keywords: coffee, tea, water, snacks, cups, plates, refrigerator, microwave, kitchen, catering
- Weight: 0.8-0.85

### Safety & Security
- Keywords: safety, security, fire, alarm, lock, camera, protective, helmet, vest, emergency
- Weight: 0.85-0.9

## Frontend Integration

### React Component Usage

```tsx
import SupplierCategorySuggestions from '@/components/supplier-category-suggestions'

// Basic usage
<SupplierCategorySuggestions
  supplierId="supplier-123"
  supplierName="Office Pro Solutions"
  currentCategories={["Office Furniture"]}
  onCategoriesUpdated={(categories) => {
    // Handle category updates
    console.log('Updated categories:', categories)
  }}
  autoRefresh={true}
/>
```

### Hook Usage

```tsx
import { useSupplierCategorySuggestions } from '@/components/supplier-category-suggestions'

function MyComponent({ supplierId }) {
  const {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    runDetection
  } = useSupplierCategorySuggestions(supplierId)

  const handleDetection = async () => {
    const result = await runDetection(true) // enhanced=true
    if (result?.success) {
      console.log('Detection successful:', result.categories)
    }
  }

  return (
    <div>
      {isLoading && <p>Loading suggestions...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={handleDetection}>Run Detection</button>
      {suggestions.map(suggestion => (
        <div key={suggestion.category}>
          <h4>{suggestion.category}</h4>
          <p>Confidence: {(suggestion.confidence * 100).toFixed(0)}%</p>
          <p>Method: {suggestion.method}</p>
          <p>Reasoning: {suggestion.reasoning}</p>
        </div>
      ))}
    </div>
  )
}
```

## Detection Methods

### 1. Supplier Profile Analysis
Analyzes supplier metadata to infer categories:
- **Name Analysis**: Extracts category hints from supplier name
- **Website Analysis**: Examines domain and URL patterns
- **Contact Analysis**: Reviews contact titles and information
- **Notes Analysis**: Processes any additional notes or descriptions

### 2. Item Pattern Analysis
Examines supplier's items for category patterns:
- **Name Pattern Matching**: Matches item names against category keywords
- **Description Analysis**: Analyzes item descriptions for category hints
- **Category Frequency**: Considers existing item categorization
- **Pattern Weighting**: Applies confidence weights based on match quality

### 3. Historical Purchase Analysis
Reviews purchase history for category insights:
- **Spending Patterns**: Analyzes spending distribution across categories
- **Purchase Frequency**: Considers how often categories are purchased
- **Order Volume**: Weighs categories by purchase volume
- **Temporal Analysis**: Considers recent vs. historical patterns

## Confidence Scoring

The system calculates confidence scores (0.0-1.0) based on:

### Base Confidence
- Pattern match quality (0.5-0.95)
- Keyword match ratio
- Method reliability weight

### Confidence Boosts
- **Multi-Method Detection**: +0.2 for categories detected by multiple methods
- **High Spending Categories**: +0.1 for categories with significant spending
- **Recent Activity**: +0.05 for recently active categories

### Confidence Levels
- **High (0.8-1.0)**: Strong indicators, high reliability
- **Medium (0.6-0.79)**: Moderate indicators, good reliability  
- **Low (0.0-0.59)**: Weak indicators, requires review

## Usage Examples

### Basic Detection
```javascript
// Run enhanced detection for a supplier
const detection = await detectAndUpdateSupplierCategoriesEnhanced('supplier-123')
console.log(`Detected ${detection.categories.length} categories with ${(detection.confidence * 100).toFixed(0)}% confidence`)
```

### Bulk Processing
```javascript
// Process all active suppliers
const results = await detectAndUpdateAllSupplierCategoriesEnhanced()
console.log(`Updated ${results.updated}/${results.processed} suppliers`)
```

### API Integration
```javascript
// Fetch suggestions via API
const response = await fetch('/api/suppliers/supplier-123/detect-categories?enhanced=true')
const data = await response.json()
console.log('Fresh suggestions:', data.freshSuggestions)
```

## Best Practices

### When to Use Enhanced Detection
- **New Suppliers**: Always use enhanced detection for better initial categorization
- **Suppliers with Many Items**: Enhanced detection provides better pattern analysis
- **Suppliers with Purchase History**: Historical analysis improves accuracy
- **Regular Maintenance**: Run enhanced detection periodically for updates

### Performance Considerations
- **Batch Processing**: Use bulk detection for processing multiple suppliers
- **Caching**: Cache suggestions for frequently accessed suppliers
- **Background Processing**: Run detection in background for better UX
- **Rate Limiting**: Implement rate limiting for API endpoints

### Integration Tips
- **UI Feedback**: Always provide loading states and confidence indicators
- **Error Handling**: Implement proper error handling and fallbacks
- **User Control**: Allow users to accept/reject suggestions
- **Audit Trail**: Maintain logs of detection activities

## Troubleshooting

### Common Issues

#### Low Confidence Scores
- **Cause**: Insufficient data or unclear patterns
- **Solution**: Add more supplier information, ensure item descriptions are detailed

#### No Suggestions Generated
- **Cause**: No items found or all detection methods failed
- **Solution**: Verify supplier has active items, check for data quality issues

#### API Errors
- **Cause**: Database issues, permission problems, or invalid data
- **Solution**: Check logs, verify user permissions, validate input data

### Performance Issues
- **Slow Detection**: Optimize database queries, implement caching
- **Memory Usage**: Process suppliers in batches, implement pagination
- **API Timeouts**: Increase timeout limits, implement async processing

## Future Enhancements

### Planned Features
- **Machine Learning Integration**: Train models on historical data
- **Custom Pattern Definitions**: Allow users to define custom category patterns
- **Multi-Language Support**: Support non-English supplier names and descriptions
- **Industry-Specific Patterns**: Add patterns for different industry verticals
- **Automated Retraining**: Automatically update patterns based on user feedback

### Potential Integrations
- **External Data Sources**: Integrate with supplier databases and catalogs
- **Image Analysis**: Analyze product images for category hints
- **Natural Language Processing**: Advanced text analysis for better pattern matching
- **Supplier APIs**: Direct integration with supplier systems for real-time data

## Conclusion

The Dynamic Supplier Category Auto-Detection system provides intelligent, multi-method category detection with high accuracy and confidence scoring. It enhances supplier management by automatically categorizing suppliers and providing actionable insights through an intuitive interface.

The system is designed for scalability, maintainability, and extensibility, making it easy to add new detection methods and integrate with existing workflows.