import { Request, Response } from 'express';
import { db } from '../repositories/db.js';
import { PricingService } from '../services/pricingService.js';
import { reserveStockSchema } from '../validators/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class CampaignController {
  public static async listCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const { category, status, search, sort } = req.query;
      let campaigns = db.getCampaigns();

      // Filter by category
      if (category && typeof category === 'string' && category !== 'All') {
        campaigns = campaigns.filter((c) => c.product?.category.toLowerCase() === category.toLowerCase());
      }

      // Filter by status
      if (status && typeof status === 'string' && status !== 'ALL') {
        if (status === 'CLOSING_SOON') {
          // Ends within 7 days
          const now = Date.now();
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          campaigns = campaigns.filter((c) => {
            const diff = new Date(c.endsAt).getTime() - now;
            return diff > 0 && diff <= sevenDays && c.status === 'ACTIVE';
          });
        } else {
          campaigns = campaigns.filter((c) => c.status === status);
        }
      }

      // Search keyword
      if (search && typeof search === 'string') {
        const query = search.toLowerCase();
        campaigns = campaigns.filter(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            c.product?.title.toLowerCase().includes(query) ||
            c.product?.description.toLowerCase().includes(query) ||
            c.supplier?.businessName.toLowerCase().includes(query)
        );
      }

      // Compute pricing metrics for each campaign
      const enriched = campaigns.map((c) => {
        const pricing = PricingService.calculateUnitPrice(c);
        const mrp = c.product?.mrpInr || pricing.unitPrice;
        const currentSavings = Math.max(0, mrp - pricing.unitPrice);
        const savingsPercent = Math.round((currentSavings / mrp) * 100);
        const progressPercent = Math.min(100, Math.round((c.committedQty / c.minTargetQty) * 100));

        return {
          ...c,
          pricing: {
            currentUnitPrice: pricing.unitPrice,
            unlockedTier: pricing.unlockedTier,
            nextTier: pricing.nextTier,
            unitsToNextTier: pricing.unitsToNextTier,
            savingsInr: currentSavings,
            savingsPercent,
            progressPercent,
          },
        };
      });

      // Sort
      if (sort === 'savings_desc') {
        enriched.sort((a, b) => b.pricing.savingsPercent - a.pricing.savingsPercent);
      } else if (sort === 'deadline') {
        enriched.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
      } else if (sort === 'price_asc') {
        enriched.sort((a, b) => a.pricing.currentUnitPrice - b.pricing.currentUnitPrice);
      } else {
        // default: popular / most committed
        enriched.sort((a, b) => b.committedQty - a.committedQty);
      }

      res.json({
        campaigns: enriched,
        total: enriched.length,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  public static async getCampaignById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const campaign = db.findCampaignById(id);

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      const pricing = PricingService.calculateUnitPrice(campaign);
      const mrp = campaign.product?.mrpInr || pricing.unitPrice;
      const currentSavings = Math.max(0, mrp - pricing.unitPrice);
      const savingsPercent = Math.round((currentSavings / mrp) * 100);
      const progressPercent = Math.min(100, Math.round((campaign.committedQty / campaign.minTargetQty) * 100));

      res.json({
        campaign: {
          ...campaign,
          pricing: {
            currentUnitPrice: pricing.unitPrice,
            unlockedTier: pricing.unlockedTier,
            nextTier: pricing.nextTier,
            unitsToNextTier: pricing.unitsToNextTier,
            savingsInr: currentSavings,
            savingsPercent,
            progressPercent,
          },
        },
      });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  public static async reserveStock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required to reserve stock' });
        return;
      }

      const { id } = req.params;
      const parsed = reserveStockSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid reservation request', details: parsed.error.format() });
        return;
      }

      const result = db.reserveStock(id, req.user.id, parsed.data.quantity);
      if (!result.success) {
        res.status(409).json({ error: result.message });
        return;
      }

      res.json({
        message: result.message,
        reservation: result.reservation,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  public static async listCategories(_req: Request, res: Response): Promise<void> {
    const products = db.getProducts();
    const categoriesMap: Record<string, number> = {};

    for (const p of products) {
      categoriesMap[p.category] = (categoriesMap[p.category] || 0) + 1;
    }

    const categories = Object.entries(categoriesMap).map(([name, productCount]) => ({
      name,
      productCount,
    }));

    res.json({ categories });
  }

  public static async getPlatformMetrics(_req: Request, res: Response): Promise<void> {
    const metrics = db.getPlatformMetrics();
    res.json({ metrics });
  }
}
