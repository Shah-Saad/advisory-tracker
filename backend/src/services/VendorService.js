const Vendor = require('../models/Vendor');

class VendorService {
  static async getAllVendors() {
    return await Vendor.findAll();
  }

  static async getActiveVendors() {
    return await Vendor.findActiveVendors();
  }

  static async getVendorById(id) {
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    return vendor;
  }

  static async searchVendors(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return await this.getAllVendors();
    }
    return await Vendor.searchByName(searchTerm.trim());
  }

  static async createVendor(vendorData) {
    // Check if vendor with same name already exists
    const existingVendor = await Vendor.findByName(vendorData.name);
    if (existingVendor) {
      throw new Error('Vendor with this name already exists');
    }

    // Check if vendor with same email already exists
    if (vendorData.email) {
      const existingVendorByEmail = await Vendor.findByEmail(vendorData.email);
      if (existingVendorByEmail) {
        throw new Error('Vendor with this email already exists');
      }
    }

    return await Vendor.create(vendorData);
  }

  static async updateVendor(id, vendorData) {
    // Check if vendor exists
    const existingVendor = await Vendor.findById(id);
    if (!existingVendor) {
      throw new Error('Vendor not found');
    }

    // Check if name is being changed and if new name conflicts
    if (vendorData.name && vendorData.name !== existingVendor.name) {
      const conflictingVendor = await Vendor.findByName(vendorData.name);
      if (conflictingVendor) {
        throw new Error('Vendor with this name already exists');
      }
    }

    // Check if email is being changed and if new email conflicts
    if (vendorData.email && vendorData.email !== existingVendor.email) {
      const conflictingVendor = await Vendor.findByEmail(vendorData.email);
      if (conflictingVendor) {
        throw new Error('Vendor with this email already exists');
      }
    }

    return await Vendor.update(id, vendorData);
  }

  static async deleteVendor(id) {
    // Check if vendor exists
    const existingVendor = await Vendor.findById(id);
    if (!existingVendor) {
      throw new Error('Vendor not found');
    }

    // TODO: Check if vendor is being used in any sheets before deletion
    // You might want to soft delete instead of hard delete

    return await Vendor.delete(id);
  }
}

module.exports = VendorService;
