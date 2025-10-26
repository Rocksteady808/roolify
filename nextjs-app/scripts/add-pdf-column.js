/**
 * Script to add include_pdf column to notification_setting table in Xano
 * 
 * This script should be run once to add the PDF column to the existing table.
 * The column will be added with a default value of false.
 */

console.log('📄 Adding include_pdf column to notification_setting table...');
console.log('');
console.log('To add the PDF column to your Xano database:');
console.log('');
console.log('1. Go to your Xano dashboard');
console.log('2. Navigate to Database → Tables → notification_setting');
console.log('3. Click "Add Column"');
console.log('4. Configure the new column:');
console.log('   - Column Name: include_pdf');
console.log('   - Data Type: Boolean');
console.log('   - Default Value: false');
console.log('   - Required: No (optional)');
console.log('5. Click "Save"');
console.log('');
console.log('✅ After adding the column, your PDF attachment feature will be fully functional!');
console.log('');
console.log('The PDF feature will:');
console.log('- Generate professional PDFs with form submission data');
console.log('- Attach PDFs to admin notification emails');
console.log('- Allow users to enable/disable PDF generation per form');
console.log('- Include site name and submission metadata in PDFs');
