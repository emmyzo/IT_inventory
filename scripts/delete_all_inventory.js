// delete_all_inventory.js
const InventoryItem = require('../src/models/inventory-item');
const UserInventory = require('../src/models/userinventory');
const sequelize = require('../src/config/db');

async function deleteAllInventory() {
  try {
    await sequelize.authenticate();
    console.log('DB connection established.');
    const userInvCount = await UserInventory.count();
    const invCount = await InventoryItem.count();
    console.log(`UserInventories: ${userInvCount}, InventoryItems: ${invCount}`);
    if (userInvCount === 0 && invCount === 0) {
      console.log('No inventory data to delete.');
      process.exit(0);
    }
    await UserInventory.destroy({ where: {} });
    await InventoryItem.destroy({ where: {} });
    console.log('All inventory and user-inventory records deleted.');
    process.exit(0);
  } catch (err) {
    console.error('Error during deletion:', err);
    process.exit(1);
  }
}
deleteAllInventory(); 