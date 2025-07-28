const VendorService = require('../services/VendorService');

const vendorController = {
  // Get all vendors
  async getAllVendors(req, res) {
    try {
      const vendors = await VendorService.getAllVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get active vendors only
  async getActiveVendors(req, res) {
    try {
      const vendors = await VendorService.getActiveVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get vendor by ID
  async getVendorById(req, res) {
    try {
      const { id } = req.params;
      const vendor = await VendorService.getVendorById(id);
      res.json(vendor);
    } catch (error) {
      const statusCode = error.message === 'Vendor not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Search vendors
  async searchVendors(req, res) {
    try {
      const { q } = req.query;
      const vendors = await VendorService.searchVendors(q);
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create new vendor
  async createVendor(req, res) {
    try {
      const vendor = await VendorService.createVendor(req.body);
      res.status(201).json(vendor);
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Update vendor
  async updateVendor(req, res) {
    try {
      const { id } = req.params;
      const vendor = await VendorService.updateVendor(id, req.body);
      res.json(vendor);
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Vendor not found') statusCode = 404;
      else if (error.message.includes('already exists')) statusCode = 409;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Delete vendor
  async deleteVendor(req, res) {
    try {
      const { id } = req.params;
      await VendorService.deleteVendor(id);
      res.status(204).send();
    } catch (error) {
      const statusCode = error.message === 'Vendor not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }
};

module.exports = vendorController;
