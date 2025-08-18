// Test script to verify inventory updates when orders are received
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Helper function to make API requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    return {
      status: response.status,
      ok: response.ok,
      data: response.ok ? await response.json() : await response.text()
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testInventoryUpdate() {
  console.log('🧪 Testing Inventory Update Process...\n');
  
  try {
    // 1. Get current items to see their stock levels
    console.log('1. Fetching current inventory...');
    const itemsResult = await makeRequest('/api/items');
    
    if (!itemsResult.ok) {
      console.log('❌ Failed to fetch items:', itemsResult.data);
      return;
    }
    
    const items = itemsResult.data.items || [];
    console.log(`✅ Found ${items.length} items in inventory`);
    
    // Show first 5 items with their current stock
    console.log('\nCurrent stock levels (first 5 items):');
    items.slice(0, 5).forEach(item => {
      console.log(`  - ${item.name}: ${item.quantity} ${item.unit} (SKU: ${item.sku})`);
    });
    
    // 2. Get purchase orders to find one we can test with
    console.log('\n2. Fetching purchase orders...');
    const ordersResult = await makeRequest('/api/purchase-orders');
    
    if (!ordersResult.ok) {
      console.log('❌ Failed to fetch orders:', ordersResult.data);
      return;
    }
    
    const orders = ordersResult.data.orders || [];
    console.log(`✅ Found ${orders.length} purchase orders`);
    
    // Find a SENT order that we can receive
    const sentOrder = orders.find(order => order.status === 'SENT');
    
    if (!sentOrder) {
      console.log('⚠️  No SENT orders found to test with');
      
      // Show available orders
      console.log('\nAvailable orders:');
      orders.slice(0, 5).forEach(order => {
        console.log(`  - ${order.orderNumber}: ${order.status} (${order.supplier})`);
      });
      return;
    }
    
    console.log(`\n3. Found SENT order to test: ${sentOrder.orderNumber}`);
    console.log(`   Supplier: ${sentOrder.supplier}`);
    console.log(`   Items: ${sentOrder.itemsCount}`);
    console.log(`   Total: $${sentOrder.totalAmount}`);
    
    // Get the specific items in this order to track their stock
    const orderItems = sentOrder.items || [];
    console.log('\nItems in this order:');
    orderItems.forEach(item => {
      console.log(`  - ${item.name}: ${item.quantity} units @ $${item.unitPrice}`);
    });
    
    console.log('\n4. This would be a good order to test receiving.');
    console.log('   To test manually:');
    console.log('   1. Go to http://localhost:3000/orders');
    console.log(`   2. Find order ${sentOrder.orderNumber}`);
    console.log('   3. Click "Received" button');
    console.log('   4. Check inventory page to see updated quantities');
    console.log('   5. Use the Refresh button on inventory page if needed');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

// Run the test
testInventoryUpdate();
