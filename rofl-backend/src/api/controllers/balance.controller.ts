import { Request, Response, NextFunction } from 'express';
import { getAllBalances } from '../../services/balance.service';
import { backfillDepositsForWallet } from '../../services/webhook.service';

export class BalanceController {
  /**
   * Get balances for authenticated wallet
   * GET /api/balance
   * If empty, backfill from chain (deposits made before balance secret was set).
   */
  async getBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wallet = req.wallet;

      if (!wallet) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      let balances = await getAllBalances(wallet);
      if (balances.length === 0) {
        await backfillDepositsForWallet(wallet);
        balances = await getAllBalances(wallet);
      }

      res.json({
        success: true,
        data: {
          wallet,
          balances,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
