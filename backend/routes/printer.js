// routes/printer.js - Enhanced Windows-Compatible Printer Integration
const express = require('express');
const Bill = require('../models/Bill');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const net = require('net');

const router = express.Router();

// Enhanced ESC/POS Commands with proper encoding
const ESC_POS = {
  INIT: Buffer.from([0x1B, 0x40]), // Initialize printer
  FEED_LINE: Buffer.from([0x0A]), // Line feed
  CUT: Buffer.from([0x1D, 0x56, 0x00]), // Cut paper
  ALIGN_CENTER: Buffer.from([0x1B, 0x61, 0x01]),
  ALIGN_LEFT: Buffer.from([0x1B, 0x61, 0x00]),
  ALIGN_RIGHT: Buffer.from([0x1B, 0x61, 0x02]),
  BOLD_ON: Buffer.from([0x1B, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([0x1B, 0x45, 0x00]),
  SIZE_NORMAL: Buffer.from([0x1D, 0x21, 0x00]),
  SIZE_DOUBLE: Buffer.from([0x1D, 0x21, 0x11]),
  SIZE_LARGE: Buffer.from([0x1D, 0x21, 0x22]),
  UNDERLINE_ON: Buffer.from([0x1B, 0x2D, 0x01]),
  UNDERLINE_OFF: Buffer.from([0x1B, 0x2D, 0x00]),
  CASH_DRAWER: Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]) // Open cash drawer
};

// Utility function to create buffer from mixed content
function createBuffer(content) {
  const buffers = [];
  
  for (const item of content) {
    if (Buffer.isBuffer(item)) {
      buffers.push(item);
    } else if (typeof item === 'string') {
      buffers.push(Buffer.from(item, 'utf8'));
    }
  }
  
  return Buffer.concat(buffers);
}

// Enhanced bill formatting with better spacing and alignment
function createESCPOSBill(bill) {
  const content = [];
  
  // Initialize printer
  content.push(ESC_POS.INIT);
  content.push('\n');
  
  // Header - Restaurant Name
  content.push(ESC_POS.ALIGN_CENTER);
  content.push(ESC_POS.SIZE_DOUBLE);
  content.push(ESC_POS.BOLD_ON);
  content.push('RESTAURANT POS\n');
  content.push(ESC_POS.SIZE_NORMAL);
  content.push(ESC_POS.BOLD_OFF);
  content.push('\n');
  
  // Restaurant Details
  content.push('123 Main Street, City\n');
  content.push('Phone: +91-9876543210\n');
  content.push('GSTIN: 123456789012345\n');
  content.push('\n');
  content.push('================================\n');
  content.push('\n');
  
  // Bill Information
  content.push(ESC_POS.ALIGN_LEFT);
  content.push(ESC_POS.BOLD_ON);
  content.push(`BILL NO: ${bill.billNumber || 'N/A'}\n`);
  content.push(ESC_POS.BOLD_OFF);
  content.push('\n');
  
  const date = new Date(bill.createdAt || new Date());
  content.push(`Date: ${date.toLocaleDateString('en-IN')}\n`);
  content.push(`Time: ${date.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  })}\n`);
  content.push('\n');
  
  if (bill.customerName) {
    content.push(`Customer: ${bill.customerName}\n`);
  }
  
  if (bill.customerPhone) {
    content.push(`Phone: ${bill.customerPhone}\n`);
  }
  
  content.push('\n');
  content.push('================================\n');
  content.push('\n');
  
  // Items header
  content.push(ESC_POS.BOLD_ON);
  content.push('ITEM                 QTY  AMOUNT\n');
  content.push('--------------------------------\n');
  content.push(ESC_POS.BOLD_OFF);
  
  // Items with proper formatting
  if (bill.items && Array.isArray(bill.items)) {
    bill.items.forEach((item, index) => {
      if (!item) return;
      
      const itemNumber = `${index + 1}.`;
      const itemName = (item.name || 'Unknown Item').length > 16 
        ? (item.name || 'Unknown Item').substring(0, 16) + '..' 
        : (item.name || 'Unknown Item');
      
      const qty = item.quantity || 1;
      const total = item.total || (item.price * qty) || 0;
      
      // Format line with proper spacing
      const itemLine = `${itemNumber} ${itemName}`.padEnd(20);
      const qtyStr = qty.toString().padStart(3);
      const totalStr = total.toFixed(2).padStart(7);
      
      content.push(`${itemLine}${qtyStr} ${totalStr}\n`);
      
      // Show unit price for multiple quantities
      if (qty > 1 && item.price) {
        content.push(`   @ Rs.${item.price.toFixed(2)} each\n`);
      }
      content.push('\n');
    });
  }
  
  content.push('--------------------------------\n');
  content.push('\n');
  
  // Totals
  const subtotal = bill.subtotal || 0;
  const gst = bill.gst || bill.tax || 0;
  const discount = bill.discount || 0;
  const total = bill.total || subtotal + gst - discount;
  
  content.push(`Subtotal:           ${subtotal.toFixed(2).padStart(8)}\n`);
  if (gst > 0) {
    content.push(`GST (18%):          ${gst.toFixed(2).padStart(8)}\n`);
  }
  if (discount > 0) {
    content.push(`Discount:          -${discount.toFixed(2).padStart(8)}\n`);
  }
  
  content.push('\n');
  content.push('================================\n');
  content.push('\n');
  
  // Grand Total
  content.push(ESC_POS.ALIGN_CENTER);
  content.push(ESC_POS.SIZE_DOUBLE);
  content.push(ESC_POS.BOLD_ON);
  content.push(`TOTAL: Rs.${total.toFixed(2)}\n`);
  content.push(ESC_POS.SIZE_NORMAL);
  content.push(ESC_POS.BOLD_OFF);
  content.push('\n');
  
  // Payment information
  if (bill.paymentMethod) {
    content.push(`PAID BY: ${bill.paymentMethod.toUpperCase()}\n`);
  }
  
  const status = bill.status || 'pending';
  content.push(`${status === 'paid' ? 'PAYMENT CONFIRMED' : 'PAYMENT PENDING'}\n`);
  
  content.push('\n');
  content.push('================================\n');
  content.push('\n');
  
  // Footer
  content.push(ESC_POS.BOLD_ON);
  content.push('THANK YOU FOR DINING!\n');
  content.push(ESC_POS.BOLD_OFF);
  content.push('\n');
  content.push('Please visit us again!\n');
  content.push('Rate us & get 10% off next visit\n');
  content.push('\n');
  
  // Bill reference
  if (bill._id) {
    content.push(`Bill ID: ${bill._id.toString().slice(-8)}\n`);
  }
  content.push(`Printed: ${new Date().toLocaleString('en-IN')}\n`);
  
  // Extra spacing and cut
  content.push('\n\n\n');
  content.push(ESC_POS.CUT);
  
  return createBuffer(content);
}

// Enhanced Windows printer function with better error handling
async function printToWindowsPrinter(bill, printerName) {
  return new Promise((resolve, reject) => {
    try {
      const printer = require('printer');
      const printerData = createESCPOSBill(bill);
      
      // Get available printers
      const printers = printer.getPrinters();
      
      if (printers.length === 0) {
        return reject(new Error('No printers found on the system'));
      }
      
      console.log('Available printers:', printers.map(p => p.name));
      
      // Find target printer
      let targetPrinter = null;
      
      if (printerName) {
        targetPrinter = printers.find(p => p.name === printerName);
      }
      
      if (!targetPrinter) {
        // Look for TVS or thermal printers
        targetPrinter = printers.find(p => 
          p.name.toLowerCase().includes('tvs') || 
          p.name.toLowerCase().includes('rp3160') ||
          p.name.toLowerCase().includes('thermal') ||
          p.name.toLowerCase().includes('pos')
        );
      }
      
      if (!targetPrinter) {
        // Use default printer
        targetPrinter = printers.find(p => p.isDefault) || printers[0];
      }
      
      // Print with timeout handling
      const printTimeout = setTimeout(() => {
        reject(new Error('Print operation timed out'));
      }, 30000); // 30 second timeout
      
      printer.printDirect({
        data: printerData,
        printer: targetPrinter.name,
        type: 'RAW',
        success: function(jobID) {
          clearTimeout(printTimeout);
          console.log(`Print job sent successfully. Job ID: ${jobID}`);
          resolve({ 
            success: true, 
            message: 'Bill printed successfully', 
            printer: targetPrinter.name,
            jobID: jobID
          });
        },
        error: function(err) {
          clearTimeout(printTimeout);
          console.error('Print error:', err);
          reject(new Error(`Print failed: ${err}`));
        }
      });
      
    } catch (error) {
      console.error('Windows printer error:', error);
      reject(new Error(`Printer initialization failed: ${error.message}`));
    }
  });
}

// Enhanced USB printer function
async function printToUSBPrinter(bill) {
  return new Promise((resolve, reject) => {
    try {
      const printerData = createESCPOSBill(bill);
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFile = path.join(tempDir, `bill_${bill.billNumber || Date.now()}.prn`);
      
      // Write to temp file
      fs.writeFileSync(tempFile, printerData);
      
      // Try different USB ports
      const usbPorts = ['LPT1:', 'USB001:', 'USB002:', 'COM1:', 'COM2:'];
      let portIndex = 0;
      
      function tryNextPort() {
        if (portIndex >= usbPorts.length) {
          // All ports failed, keep file for manual printing
          resolve({
            success: true,
            message: 'File saved for manual printing',
            tempFile: tempFile,
            instruction: `Please copy ${tempFile} to your printer manually`
          });
          return;
        }
        
        const port = usbPorts[portIndex];
        portIndex++;
        
        exec(`copy "${tempFile}" /B ${port} /B`, (error, stdout, stderr) => {
          if (!error) {
            // Success - clean up temp file
            setTimeout(() => {
              try {
                fs.unlinkSync(tempFile);
              } catch (e) {
                console.log('Could not delete temp file:', e.message);
              }
            }, 5000);
            
            resolve({
              success: true,
              message: `Bill printed to ${port}`,
              port: port
            });
          } else {
            console.log(`Failed to print to ${port}, trying next...`);
            tryNextPort();
          }
        });
      }
      
      tryNextPort();
      
    } catch (error) {
      console.error('USB printer error:', error);
      reject(new Error(`USB print failed: ${error.message}`));
    }
  });
}

// Enhanced network printer function
async function printToNetworkPrinter(bill, ip = '192.168.1.100', port = 9100) {
  return new Promise((resolve, reject) => {
    try {
      const printerData = createESCPOSBill(bill);
      const client = new net.Socket();
      
      // Set timeout
      client.setTimeout(15000);
      
      client.connect(port, ip, () => {
        console.log(`Connected to network printer at ${ip}:${port}`);
        client.write(printerData);
        
        // Close connection after a short delay
        setTimeout(() => {
          client.end();
        }, 1000);
      });
      
      client.on('close', () => {
        console.log('Network printer connection closed');
        resolve({ 
          success: true, 
          message: 'Bill printed via network',
          ip: ip,
          port: port
        });
      });
      
      client.on('error', (err) => {
        console.error('Network printer error:', err);
        client.destroy();
        reject(new Error(`Network print failed: ${err.message}`));
      });
      
      client.on('timeout', () => {
        console.error('Network printer timeout');
        client.destroy();
        reject(new Error('Network printer connection timeout'));
      });
      
    } catch (error) {
      console.error('Network printer setup error:', error);
      reject(new Error(`Network setup failed: ${error.message}`));
    }
  });
}

// Main print function with enhanced error handling
async function printBill(bill, printerConfig = {}) {
  const { 
    connection = 'auto', 
    ip = '192.168.1.100', 
    port = 9100, 
    printerName,
    retries = 2
  } = printerConfig;
  
  console.log(`Attempting to print bill ${bill.billNumber || 'unknown'} using ${connection} connection`);
  
  // Validate bill data
  if (!bill) {
    throw new Error('Bill data is required');
  }
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(`Print attempt ${attempt}/${retries + 1}`);
      
      switch (connection.toLowerCase()) {
        case 'network':
        case 'lan':
          return await printToNetworkPrinter(bill, ip, port);
          
        case 'usb':
          return await printToUSBPrinter(bill);
          
        case 'windows':
          return await printToWindowsPrinter(bill, printerName);
          
        case 'auto':
        default:
          // Try Windows printer first (most reliable)
          try {
            return await printToWindowsPrinter(bill, printerName);
          } catch (winError) {
            console.log(`Windows printer failed (attempt ${attempt}):`, winError.message);
            
            if (attempt === retries + 1) {
              // Last attempt - try alternatives
              try {
                console.log('Trying USB as fallback...');
                return await printToUSBPrinter(bill);
              } catch (usbError) {
                console.log('USB failed, trying network as last resort...');
                return await printToNetworkPrinter(bill, ip, port);
              }
            }
            // Retry Windows printer
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            throw winError;
          }
      }
    } catch (error) {
      if (attempt === retries + 1) {
        throw error;
      }
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
    }
  }
}

// Enhanced print route with better validation
router.post('/print/:billId', auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.billId);
    
    if (!bill) {
      return res.status(404).json({ 
        success: false,
        message: 'Bill not found' 
      });
    }

    const printResult = await printBill(bill, req.body.printerConfig || {});
    
    if (printResult.success) {
      // Mark bill as printed with timestamp
      await Bill.findByIdAndUpdate(req.params.billId, { 
        isPrinted: true,
        printedAt: new Date()
      });
    }

    res.json({
      success: printResult.success,
      message: printResult.message,
      billNumber: bill.billNumber,
      details: printResult
    });
    
  } catch (error) {
    console.error('Print route error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Print failed',
      error: error.message,
      billId: req.params.billId
    });
  }
});

// Enhanced test printer route
router.post('/test', auth, async (req, res) => {
  try {
    const { connection = 'auto', ip, port, printerName } = req.body;
    
    // Create a comprehensive test bill
    const testBill = {
      billNumber: `TEST${Date.now()}`,
      customerName: 'Test Customer',
      customerPhone: '+91-9876543210',
      items: [
        { name: 'Test Item 1', quantity: 2, price: 50, total: 100 },
        { name: 'Long Test Item Name Example', quantity: 1, price: 25.50, total: 25.50 }
      ],
      subtotal: 125.50,
      gst: 22.59,
      discount: 5.00,
      total: 143.09,
      paymentMethod: 'cash',
      status: 'paid',
      createdAt: new Date()
    };
    
    const result = await printBill(testBill, { connection, ip, port, printerName });
    
    res.json({
      success: result.success,
      message: result.success ? 'Printer test successful!' : result.message,
      testBill: testBill.billNumber,
      details: result
    });
    
  } catch (error) {
    console.error('Printer test error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Printer test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced get printers route
router.get('/printers', auth, async (req, res) => {
  try {
    const printer = require('printer');
    const printers = printer.getPrinters();
    
    const formattedPrinters = printers.map(p => ({
      name: p.name,
      displayName: p.displayName || p.name,
      status: p.status,
      isDefault: p.isDefault,
      isShared: p.isShared,
      portName: p.portName,
      driverName: p.driverName,
      location: p.location,
      comment: p.comment,
      isThermal: p.name.toLowerCase().includes('tvs') || 
                p.name.toLowerCase().includes('thermal') ||
                p.name.toLowerCase().includes('pos') ||
                p.name.toLowerCase().includes('rp3160')
    }));
    
    // Sort thermal printers first
    formattedPrinters.sort((a, b) => {
      if (a.isThermal && !b.isThermal) return -1;
      if (!a.isThermal && b.isThermal) return 1;
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
    
    res.json({
      success: true,
      printers: formattedPrinters,
      count: formattedPrinters.length,
      thermalPrinters: formattedPrinters.filter(p => p.isThermal).length,
      defaultPrinter: formattedPrinters.find(p => p.isDefault)?.name || 'None'
    });
    
  } catch (error) {
    console.error('Get printers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get printers: ' + error.message,
      printers: [],
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced printer status route
router.get('/status', auth, async (req, res) => {
  try {
    const printer = require('printer');
    const printers = printer.getPrinters();
    
    const thermalPrinters = printers.filter(p => 
      p.name.toLowerCase().includes('tvs') || 
      p.name.toLowerCase().includes('rp3160') ||
      p.name.toLowerCase().includes('thermal') ||
      p.name.toLowerCase().includes('pos')
    );
    
    const defaultPrinter = printers.find(p => p.isDefault);
    
    res.json({
      status: thermalPrinters.length > 0 ? 'online' : (printers.length > 0 ? 'available' : 'offline'),
      model: 'TVS RP3160',
      connection: thermalPrinters.length > 0 ? 'Connected' : 'Not Found',
      thermalPrinters: thermalPrinters.map(p => ({
        name: p.name,
        status: p.status,
        isDefault: p.isDefault
      })),
      defaultPrinter: defaultPrinter?.name || 'None',
      totalPrinters: printers.length,
      lastCheck: new Date().toISOString(),
      recommendations: thermalPrinters.length === 0 ? [
        'Install TVS RP3160 drivers',
        'Check USB connection',
        'Verify printer power'
      ] : []
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      model: 'TVS RP3160',
      connection: 'Error checking status',
      timestamp: new Date().toISOString()
    });
  }
});

// Bulk print route for multiple bills
router.post('/print/bulk', auth, async (req, res) => {
  try {
    const { billIds, printerConfig } = req.body;
    
    if (!Array.isArray(billIds) || billIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bill IDs array is required'
      });
    }
    
    const results = [];
    
    for (const billId of billIds) {
      try {
        const bill = await Bill.findById(billId);
        if (!bill) {
          results.push({
            billId,
            success: false,
            message: 'Bill not found'
          });
          continue;
        }
        
        const printResult = await printBill(bill, printerConfig || {});
        
        if (printResult.success) {
          await Bill.findByIdAndUpdate(billId, { 
            isPrinted: true,
            printedAt: new Date()
          });
        }
        
        results.push({
          billId,
          billNumber: bill.billNumber,
          success: printResult.success,
          message: printResult.message
        });
        
        // Small delay between prints
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({
          billId,
          success: false,
          message: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: successCount > 0,
      message: `${successCount}/${billIds.length} bills printed successfully`,
      results,
      totalBills: billIds.length,
      successCount,
      failureCount: billIds.length - successCount
    });
    
  } catch (error) {
    console.error('Bulk print error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk print failed: ' + error.message
    });
  }
});

module.exports = router;