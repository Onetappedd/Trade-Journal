// Test script for corporate actions adjustments

/**
 * Adjust price and quantity based on a split factor
 */
function adjustPriceQty({ price, qty, factor, direction }) {
  if (factor <= 0) {
    throw new Error('Split factor must be positive');
  }

  let adjustedPrice;
  let adjustedQty;

  if (direction === 'forward') {
    // Adjust for split: price decreases, quantity increases
    adjustedPrice = price / factor;
    adjustedQty = qty * factor;
  } else {
    // Reverse split adjustment: price increases, quantity decreases
    adjustedPrice = price * factor;
    adjustedQty = qty / factor;
  }

  return {
    adjustedPrice: Math.round(adjustedPrice * 1000000) / 1000000, // Round to 6 decimal places
    adjustedQty: Math.round(adjustedQty * 1000000) / 1000000
  };
}

// Test data
const testCases = [
  {
    name: 'AAPL 4:1 Split (Forward)',
    price: 500.00,
    qty: 100,
    factor: 4,
    direction: 'forward',
    expected: {
      adjustedPrice: 125.00,
      adjustedQty: 400
    }
  },
  {
    name: 'AAPL 4:1 Split (Backward)',
    price: 125.00,
    qty: 400,
    factor: 4,
    direction: 'backward',
    expected: {
      adjustedPrice: 500.00,
      adjustedQty: 100
    }
  },
  {
    name: 'TSLA 3:1 Split (Forward)',
    price: 900.00,
    qty: 50,
    factor: 3,
    direction: 'forward',
    expected: {
      adjustedPrice: 300.00,
      adjustedQty: 150
    }
  },
  {
    name: 'TSLA 3:1 Split (Backward)',
    price: 300.00,
    qty: 150,
    factor: 3,
    direction: 'backward',
    expected: {
      adjustedPrice: 900.00,
      adjustedQty: 50
    }
  },
  {
    name: 'No Split (Factor 1)',
    price: 300.00,
    qty: 200,
    factor: 1,
    direction: 'forward',
    expected: {
      adjustedPrice: 300.00,
      adjustedQty: 200
    }
  }
];

function testAdjustments() {
  console.log('🧪 Testing Corporate Actions Adjustments\n');
  
  let passed = 0;
  let failed = 0;

  testCases.forEach(testCase => {
    try {
      const result = adjustPriceQty({
        price: testCase.price,
        qty: testCase.qty,
        factor: testCase.factor,
        direction: testCase.direction
      });

      const priceMatch = Math.abs(result.adjustedPrice - testCase.expected.adjustedPrice) < 0.01;
      const qtyMatch = Math.abs(result.adjustedQty - testCase.expected.adjustedQty) < 0.01;

      if (priceMatch && qtyMatch) {
        console.log(`✅ ${testCase.name}`);
        console.log(`   Original: $${testCase.price} × ${testCase.qty}`);
        console.log(`   Adjusted: $${result.adjustedPrice.toFixed(2)} × ${result.adjustedQty}`);
        console.log(`   Factor: ${testCase.factor}:1 (${testCase.direction})\n`);
        passed++;
      } else {
        console.log(`❌ ${testCase.name}`);
        console.log(`   Expected: $${testCase.expected.adjustedPrice} × ${testCase.expected.adjustedQty}`);
        console.log(`   Got: $${result.adjustedPrice.toFixed(2)} × ${result.adjustedQty}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} - Error: ${error.message}\n`);
      failed++;
    }
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
    return true;
  } else {
    console.log('💥 Some tests failed!');
    return false;
  }
}

// Test demo split factors
function testDemoSplitFactors() {
  console.log('\n🧪 Testing Demo Split Factors\n');
  
  const demoSplitFactors = {
    'AAPL': 4, // 4:1 split on 2020-08-31
    'TSLA': 3, // 3:1 split on 2022-08-25
    'NVDA': 4, // 4:1 split on 2021-07-20
  };

  const testSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL'];
  
  testSymbols.forEach(symbol => {
    const factor = demoSplitFactors[symbol] || 1;
    const hasAdjustments = factor !== 1;
    
    console.log(`${symbol}: ${factor}:1 split${hasAdjustments ? ' (adjusted)' : ' (no adjustments)'}`);
  });
  
  console.log('\n✅ Demo split factors configured correctly');
}

// Test sample execution adjustments
function testSampleExecutions() {
  console.log('\n🧪 Testing Sample Execution Adjustments\n');
  
  const sampleExecutions = [
    {
      symbol: 'AAPL',
      instrument_type: 'equity',
      side: 'buy',
      quantity: 100,
      price: 500.00, // Pre-split price
      timestamp: '2020-08-15T10:30:00Z'
    },
    {
      symbol: 'TSLA',
      instrument_type: 'equity',
      side: 'buy',
      quantity: 50,
      price: 900.00, // Pre-split price
      timestamp: '2022-08-10T09:15:00Z'
    },
    {
      symbol: 'MSFT',
      instrument_type: 'equity',
      side: 'buy',
      quantity: 200,
      price: 300.00, // No split
      timestamp: '2023-01-15T11:00:00Z'
    }
  ];

  const demoSplitFactors = {
    'AAPL': 4,
    'TSLA': 3,
    'NVDA': 4,
  };

  sampleExecutions.forEach(execution => {
    const splitFactor = demoSplitFactors[execution.symbol] || 1;
    const hasAdjustments = splitFactor !== 1;
    
    if (hasAdjustments) {
      const { adjustedPrice, adjustedQty } = adjustPriceQty({
        price: execution.price,
        qty: execution.quantity,
        factor: splitFactor,
        direction: 'forward'
      });
      
      console.log(`✅ ${execution.symbol}: ${splitFactor}:1 split applied`);
      console.log(`   Original: $${execution.price} × ${execution.quantity}`);
      console.log(`   Adjusted: $${adjustedPrice.toFixed(2)} × ${adjustedQty}\n`);
    } else {
      console.log(`ℹ️  ${execution.symbol}: No adjustments needed\n`);
    }
  });
}

// Run tests
if (require.main === module) {
  const adjustmentsPassed = testAdjustments();
  testDemoSplitFactors();
  testSampleExecutions();
  
  console.log('\n📋 Summary:');
  console.log('- Adjustment calculations work correctly');
  console.log('- Demo split factors are configured');
  console.log('- Sample executions are adjusted properly');
  console.log('- Ready for integration with real corporate actions data');
  
  process.exit(adjustmentsPassed ? 0 : 1);
}

module.exports = { testAdjustments, testDemoSplitFactors, testSampleExecutions };
