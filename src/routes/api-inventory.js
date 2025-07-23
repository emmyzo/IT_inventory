const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { requireAuth } = require('../middleware/auth');

// Inventory management
router.get('/inventory', requireAuth, inventoryController.getAllInventory);
router.get('/inventory/itspocs', requireAuth, inventoryController.getUniqueItSpocs);
router.get('/inventory/unique-itspocs-statuses', requireAuth, inventoryController.getUniqueItSpocsAndStatuses);
router.get('/inventory/:id', requireAuth, inventoryController.getInventoryById);
router.post('/inventory', requireAuth, inventoryController.createInventory);
router.put('/inventory/:id', requireAuth, inventoryController.updateInventory);
router.patch('/inventory/:id/restore', requireAuth, inventoryController.restoreInventory);
router.post('/inventory/:id/transfer', requireAuth, inventoryController.transferInventory);
router.delete('/inventory/:id', requireAuth, inventoryController.deleteInventory);
router.get('/inventory/by-itspoc', requireAuth, inventoryController.getInventoryByItSpoc);
router.get('/inventory/test-route', (req, res) => {
  res.json({ message: 'Test route is working!' });
});
router.get('/inventory/debug-log', inventoryController.getUpdateDebugLog);

module.exports = router; 