import { dbAdapter } from './databaseAdapter';
import { BloodBank, BloodInventoryItem, BloodGroupType, BloodComponentType } from '../types/database';

class BloodBankService {
  public getAllBloodBanks(): BloodBank[] {
    return dbAdapter.getTable('blood_banks');
  }

  public getInventory(bloodBankId?: string): BloodInventoryItem[] {
    const inv = dbAdapter.getTable('blood_inventory');
    if (bloodBankId) {
      return inv.filter((item) => item.blood_bank_id === bloodBankId);
    }
    return inv;
  }

  public updateStock(
    inventoryId: string,
    deltaAvailable: number,
    deltaReserved = 0,
    performedBy?: string,
    reason?: string
  ): BloodInventoryItem | null {
    const inv = dbAdapter.getTable('blood_inventory').find((i) => i.id === inventoryId);
    if (!inv) return null;

    const newAvailable = Math.max(0, inv.units_available + deltaAvailable);
    const newReserved = Math.max(0, inv.units_reserved + deltaReserved);

    const updated = dbAdapter.update('blood_inventory', inventoryId, {
      units_available: newAvailable,
      units_reserved: newReserved,
      last_updated: new Date().toISOString(),
    });

    dbAdapter.logAudit(
      performedBy,
      'INVENTORY_MUTATION',
      'blood_inventory',
      inventoryId,
      { available: inv.units_available, reserved: inv.units_reserved },
      { available: newAvailable, reserved: newReserved, reason }
    );

    return updated;
  }

  public reserveUnits(
    bloodBankId: string,
    bloodGroup: BloodGroupType,
    component: BloodComponentType,
    unitsCount: number,
    performedBy?: string
  ): boolean {
    const inv = dbAdapter
      .getTable('blood_inventory')
      .find((i) => i.blood_bank_id === bloodBankId && i.blood_group === bloodGroup && i.component === component);

    if (!inv || inv.units_available < unitsCount) {
      return false;
    }

    this.updateStock(inv.id, -unitsCount, unitsCount, performedBy, `Reserved ${unitsCount} units for emergency`);
    return true;
  }

  public getLowStockAlerts(threshold = 5): BloodInventoryItem[] {
    return dbAdapter.getTable('blood_inventory').filter((i) => i.units_available <= threshold);
  }
}

export const bloodBankService = new BloodBankService();
