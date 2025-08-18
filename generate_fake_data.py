#!/usr/bin/env python3
"""
Fake Data Generator for Office Supplies Management System

This script generates realistic fake data for:
- Suppliers
- Inventory Items
- Purchase Orders
- Reports data

Using Faker.js equivalent data patterns for consistency.
"""

import json
import random
from datetime import datetime, timedelta
from faker import Faker
import uuid
import os

# Initialize Faker
fake = Faker()

# Office supplies categories and items
OFFICE_CATEGORIES = {
    'Writing Supplies': [
        'Ballpoint Pens', 'Gel Pens', 'Pencils', 'Markers', 'Highlighters',
        'Permanent Markers', 'Whiteboard Markers', 'Colored Pencils', 'Mechanical Pencils',
        'Fountain Pens', 'Erasers', 'Correction Fluid', 'Correction Tape'
    ],
    'Paper Products': [
        'Copy Paper', 'Printer Paper', 'Cardstock', 'Construction Paper',
        'Sticky Notes', 'Index Cards', 'Notebooks', 'Legal Pads',
        'Envelopes', 'Labels', 'File Folders', 'Manila Folders'
    ],
    'Office Equipment': [
        'Staplers', 'Hole Punchers', 'Paper Clips', 'Binders',
        'Calculators', 'Scissors', 'Tape Dispensers', 'Desk Organizers',
        'Paper Shredders', 'Laminators', 'Label Makers', 'Binding Machines'
    ],
    'Technology': [
        'USB Drives', 'Computer Mice', 'Keyboards', 'Monitor Stands',
        'Webcams', 'Headphones', 'Speakers', 'Cables', 'Power Strips',
        'Laptop Stands', 'Tablet Holders', 'Phone Chargers'
    ],
    'Storage & Organization': [
        'Storage Boxes', 'Filing Cabinets', 'Desk Drawers', 'Shelving Units',
        'Magazine Holders', 'Document Trays', 'Storage Bins', 'Hanging Files',
        'Accordion Files', 'Expanding Files', 'Storage Carts', 'Bookcases'
    ],
    'Cleaning Supplies': [
        'Disinfectant Wipes', 'Paper Towels', 'Trash Bags', 'Hand Sanitizer',
        'Glass Cleaner', 'All-Purpose Cleaner', 'Vacuum Cleaners', 'Mops',
        'Brooms', 'Dustpans', 'Cleaning Cloths', 'Air Fresheners'
    ],
    'Break Room Supplies': [
        'Coffee', 'Tea', 'Sugar', 'Creamer', 'Disposable Cups',
        'Paper Plates', 'Plastic Utensils', 'Napkins', 'Water Bottles',
        'Snacks', 'Microwave', 'Coffee Maker', 'Refrigerator'
    ]
}

SUPPLIER_COMPANIES = [
    'Office Depot', 'Staples', 'Best Buy Business', 'Amazon Business',
    'Costco Business', 'Walmart Business', 'Quill', 'OfficeMax',
    'W.B. Mason', 'Global Industrial', 'Grainger', 'Uline',
    'Viking Direct', 'Office Supplies Plus', 'BulkOfficeSupply',
    'Corporate Express', 'SupplyWorks', 'Office Zone', 'Discount Office Items',
    'Business Depot', 'Office Essentials', 'Supplies Network'
]

UNITS = ['each', 'box', 'pack', 'case', 'dozen', 'ream', 'roll', 'bottle', 'bag', 'set']

LOCATIONS = [
    'Warehouse A-1', 'Warehouse A-2', 'Warehouse B-1', 'Warehouse B-2',
    'Storage Room 101', 'Storage Room 102', 'Storage Room 201', 'Storage Room 202',
    'Main Office Supply', 'Break Room Storage', 'IT Equipment Room',
    'Cleaning Supply Closet', 'Reception Storage', 'Conference Room Storage'
]

STATUSES = ['in-stock', 'low-stock', 'out-of-stock']
ORDER_STATUSES = ['pending', 'approved', 'ordered', 'received', 'cancelled']

def generate_suppliers(count=25):
    """Generate fake supplier data"""
    suppliers = []
    used_names = set()
    
    for i in range(count):
        # Ensure unique supplier names
        while True:
            name = random.choice(SUPPLIER_COMPANIES)
            if name not in used_names:
                used_names.add(name)
                break
        
        supplier = {
            'id': f'sup_{uuid.uuid4().hex[:8]}',
            'name': name,
            'email': fake.company_email(),
            'phone': fake.phone_number(),
            'address': fake.address().replace('\n', ', '),
            'contactPerson': fake.name(),
            'contactTitle': random.choice(['Sales Manager', 'Account Manager', 'Business Development', 'Customer Service']),
            'website': f'https://www.{name.lower().replace(" ", "").replace(".", "")}.com',
            'taxId': fake.ssn(),
            'paymentTerms': random.choice(['Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD']),
            'status': random.choice(['Active', 'Active', 'Active', 'Inactive']),  # 75% active
            'rating': round(random.uniform(3.0, 5.0), 1),
            'categories': random.sample(list(OFFICE_CATEGORIES.keys()), random.randint(1, 4)),
            'createdAt': fake.date_between(start_date='-2y', end_date='today').isoformat(),
            'updatedAt': fake.date_between(start_date='-30d', end_date='today').isoformat(),
            'notes': fake.text(max_nb_chars=200) if random.random() < 0.3 else ''
        }
        suppliers.append(supplier)
    
    return suppliers

def generate_inventory_items(suppliers, count=150):
    """Generate fake inventory items"""
    items = []
    
    for i in range(count):
        category = random.choice(list(OFFICE_CATEGORIES.keys()))
        item_name = random.choice(OFFICE_CATEGORIES[category])
        
        # Add brand/model variation
        brands = ['Generic', 'Premium', 'Deluxe', 'Standard', 'Professional', 'Economy']
        if random.random() < 0.7:  # 70% chance of having a brand
            item_name = f'{random.choice(brands)} {item_name}'
        
        # Generate realistic quantities and prices
        base_price = random.uniform(0.50, 200.00)
        quantity = random.randint(0, 500)
        min_stock = random.randint(5, 50)
        max_stock = min_stock + random.randint(50, 200)
        
        # Determine status based on quantity
        if quantity == 0:
            status = 'out-of-stock'
        elif quantity <= min_stock:
            status = 'low-stock'
        else:
            status = 'in-stock'
        
        # Eco-friendly probability based on category
        eco_categories = ['Paper Products', 'Cleaning Supplies']
        is_eco_friendly = category in eco_categories and random.random() < 0.4
        
        item = {
            'id': f'item_{uuid.uuid4().hex[:8]}',
            'name': item_name,
            'category': category,
            'sku': f'{category[:3].upper()}-{random.randint(1000, 9999)}',
            'description': fake.text(max_nb_chars=150),
            'quantity': quantity,
            'unit': random.choice(UNITS),
            'minStock': min_stock,
            'maxStock': max_stock,
            'unitPrice': round(base_price, 2),
            'supplier': random.choice(suppliers)['name'],
            'location': random.choice(LOCATIONS),
            'status': status,
            'lastUpdated': fake.date_time_between(start_date='-30d', end_date='now').isoformat(),
            'expiryDate': fake.date_between(start_date='+6m', end_date='+2y').isoformat() if random.random() < 0.2 else None,
            'isActive': random.choice([True, True, True, False]),  # 75% active
            'isEcoFriendly': is_eco_friendly,
            'ecoRating': round(random.uniform(3.0, 5.0), 1) if is_eco_friendly else None,
            'carbonFootprint': round(random.uniform(0.1, 5.0), 2) if is_eco_friendly else None,
            'recyclable': is_eco_friendly or random.random() < 0.3
        }
        items.append(item)
    
    return items

def generate_purchase_orders(suppliers, items, count=50):
    """Generate fake purchase orders"""
    orders = []
    
    for i in range(count):
        supplier = random.choice(suppliers)
        order_date = fake.date_between(start_date='-6m', end_date='today')
        
        # Generate order items (1-5 items per order)
        order_items = []
        num_items = random.randint(1, 5)
        selected_items = random.sample(items, min(num_items, len(items)))
        
        total_amount = 0
        for item in selected_items:
            quantity = random.randint(1, 50)
            unit_price = item['unitPrice'] * random.uniform(0.9, 1.1)  # Slight price variation
            total_price = quantity * unit_price
            total_amount += total_price
            
            order_items.append({
                'itemId': item['id'],
                'itemName': item['name'],
                'quantity': quantity,
                'unitPrice': round(unit_price, 2),
                'unit': item['unit'],
                'totalPrice': round(total_price, 2)
            })
        
        # Generate order number
        order_number = f'PO-{order_date.year}{order_date.month:02d}{order_date.day:02d}-{i+1:04d}'
        
        order = {
            'id': f'po_{uuid.uuid4().hex[:8]}',
            'orderNumber': order_number,
            'supplierId': supplier['id'],
            'supplierName': supplier['name'],
            'status': random.choice(ORDER_STATUSES),
            'orderDate': order_date.isoformat(),
            'expectedDelivery': (order_date + timedelta(days=random.randint(3, 14))).isoformat(),
            'actualDelivery': (order_date + timedelta(days=random.randint(3, 20))).isoformat() if random.random() < 0.7 else None,
            'notes': fake.text(max_nb_chars=100) if random.random() < 0.4 else '',
            'items': order_items,
            'totalAmount': round(total_amount, 2),
            'createdBy': fake.name(),
            'createdAt': order_date.isoformat(),
            'updatedAt': fake.date_time_between(start_date=order_date, end_date='now').isoformat()
        }
        orders.append(order)
    
    return orders

def generate_reports_data(items, orders):
    """Generate realistic reports data"""
    # Calculate real metrics from generated data
    total_items = len(items)
    active_items = len([item for item in items if item['isActive']])
    low_stock_items = len([item for item in items if item['status'] == 'low-stock'])
    out_of_stock_items = len([item for item in items if item['status'] == 'out-of-stock'])
    
    total_inventory_value = sum(item['quantity'] * item['unitPrice'] for item in items)
    
    # Category breakdown
    category_spending = {}
    for category in OFFICE_CATEGORIES.keys():
        category_items = [item for item in items if item['category'] == category]
        category_spending[category] = sum(item['quantity'] * item['unitPrice'] for item in category_items)
    
    # Monthly spending trend (last 12 months)
    monthly_spending = []
    for i in range(12):
        month_date = datetime.now() - timedelta(days=30 * i)
        month_orders = [order for order in orders if 
                       datetime.fromisoformat(order['orderDate']).month == month_date.month and
                       datetime.fromisoformat(order['orderDate']).year == month_date.year]
        monthly_total = sum(order['totalAmount'] for order in month_orders)
        monthly_spending.append({
            'month': month_date.strftime('%Y-%m'),
            'amount': round(monthly_total, 2)
        })
    
    # Top suppliers by spending
    supplier_spending = {}
    for order in orders:
        supplier_name = order['supplierName']
        if supplier_name not in supplier_spending:
            supplier_spending[supplier_name] = 0
        supplier_spending[supplier_name] += order['totalAmount']
    
    top_suppliers = sorted(supplier_spending.items(), key=lambda x: x[1], reverse=True)[:5]
    
    reports_data = {
        'overview': {
            'totalItems': total_items,
            'activeItems': active_items,
            'lowStockItems': low_stock_items,
            'outOfStockItems': out_of_stock_items,
            'totalInventoryValue': round(total_inventory_value, 2),
            'totalOrders': len(orders),
            'pendingOrders': len([order for order in orders if order['status'] == 'pending']),
            'monthlySpending': round(sum(order['totalAmount'] for order in orders 
                                      if datetime.fromisoformat(order['orderDate']).month == datetime.now().month), 2)
        },
        'categorySpending': category_spending,
        'monthlyTrend': monthly_spending,
        'topSuppliers': [{'name': name, 'amount': round(amount, 2)} for name, amount in top_suppliers],
        'lastUpdated': datetime.now().isoformat()
    }
    
    return reports_data

def save_data_to_files(suppliers, items, orders, reports):
    """Save generated data to JSON files"""
    # Create data directory if it doesn't exist
    data_dir = 'src/data'
    os.makedirs(data_dir, exist_ok=True)
    
    # Save each dataset
    datasets = {
        'suppliers.json': suppliers,
        'items.json': {'items': items},
        'purchase-orders.json': orders,
        'reports.json': reports
    }
    
    for filename, data in datasets.items():
        filepath = os.path.join(data_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f'✅ Generated {filepath}')

def main():
    """Main function to generate all fake data"""
    print('🚀 Starting fake data generation...')
    print()
    
    # Generate data in order (suppliers first, then items, then orders)
    print('📊 Generating suppliers...')
    suppliers = generate_suppliers(22)
    print(f'   Created {len(suppliers)} suppliers')
    
    print('📦 Generating inventory items...')
    items = generate_inventory_items(suppliers, 150)
    print(f'   Created {len(items)} inventory items')
    
    print('🛒 Generating purchase orders...')
    orders = generate_purchase_orders(suppliers, items, 50)
    print(f'   Created {len(orders)} purchase orders')
    
    print('📈 Generating reports data...')
    reports = generate_reports_data(items, orders)
    print('   Created comprehensive reports data')
    
    print()
    print('💾 Saving data to files...')
    save_data_to_files(suppliers, items, orders, reports)
    
    print()
    print('✨ Fake data generation completed successfully!')
    print()
    print('📋 Summary:')
    print(f'   • {len(suppliers)} suppliers')
    print(f'   • {len(items)} inventory items')
    print(f'   • {len(orders)} purchase orders')
    print(f'   • Complete reports dataset')
    print()
    print('🎯 Data saved to src/data/ directory')
    print('   You can now use this data in your application!')

if __name__ == '__main__':
    main()