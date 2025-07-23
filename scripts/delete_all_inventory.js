// Script to trim whitespace from all itSpoc values in InventoryItems
const { InventoryItem } = require('../src/models');
(async () => {
  try {
    const items = await InventoryItem.findAll();
    for (const item of items) {
      if (typeof item.itSpoc === 'string') {
        const trimmed = item.itSpoc.trim();
        if (trimmed !== item.itSpoc) {
          item.itSpoc = trimmed;
          await item.save();
          console.log(`Trimmed itSpoc for item ID ${item.id}: '${item.itSpoc}'`);
        }
      }
    }
    console.log('All itSpoc values trimmed.');
    process.exit(0);
  } catch (err) {
    console.error('Error trimming itSpoc values:', err);
    process.exit(1);
  }
})(); 