const fs = require('fs');
const path = require('path');

const routeFile = './app/dashboard/route.ts';

try {
  if (fs.existsSync(routeFile)) {
    fs.unlinkSync(routeFile);
    console.log('Successfully deleted route.ts file');
  } else {
    console.log('route.ts file does not exist');
  }
} catch (error) {
  console.error('Error deleting file:', error);
}