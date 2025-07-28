const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entryController');
const auth = require('../middlewares/auth');

// All entry routes require authentication
router.use(auth);

router.get('/', entryController.getAllEntries);
router.get('/:id', entryController.getEntryById);
router.get('/sheet/:sheetId', entryController.getEntriesBySheetId);
router.post('/', entryController.createEntry);
router.put('/:id', entryController.updateEntry);
router.delete('/:id', entryController.deleteEntry);

module.exports = router;
