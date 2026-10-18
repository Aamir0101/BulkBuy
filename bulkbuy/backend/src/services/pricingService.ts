import { Campaign, CampaignPriceTier } from '../models/types.js';

export class PricingService {
  /**
   * Calculates the unit price for a campaign given the target aggregated quantity.
   * If prospectiveQty is provided, calculates the price tier that would be unlocked.
   */
  public static calculateUnitPrice(campaign: Campaign, prospectiveQty?: number): { unitPrice: number; unlockedTier: CampaignPriceTier | null; nextTier: CampaignPriceTier | null; unitsToNextTier: number } {
    const tiers = campaign.tiers && campaign.tiers.length > 0 ? [...campaign.tiers].sort((a, b) => a.minQuantity - b.minQuantity) : [];
    
    // Default fallback to product MRP or base tier
    const basePrice = campaign.product?.mrpInr || 1000;
    if (tiers.length === 0) {
      return { unitPrice: basePrice, unlockedTier: null, nextTier: null, unitsToNextTier: 0 };
    }

    const effectiveQty = prospectiveQty !== undefined ? prospectiveQty : campaign.committedQty;

    let unlockedTier: CampaignPriceTier = tiers[0];
    let nextTier: CampaignPriceTier | null = null;

    for (let i = 0; i < tiers.length; i++) {
      if (effectiveQty >= tiers[i].minQuantity) {
        unlockedTier = tiers[i];
      } else {
        nextTier = tiers[i];
        break;
      }
    }

    const unitsToNextTier = nextTier ? Math.max(0, nextTier.minQuantity - effectiveQty) : 0;

    return {
      unitPrice: unlockedTier.priceInr,
      unlockedTier,
      nextTier,
      unitsToNextTier,
    };
  }
}
