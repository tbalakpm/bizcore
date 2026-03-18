import express, { type Request, type Response } from 'express';
import { gstService } from '../services/gst.service';

export const gstRouter = express.Router();

// Get a new captcha
gstRouter.get('/captcha', async (req: Request, res: Response) => {
  try {
    const captcha = await gstService.getCaptcha();
    res.json(captcha);
  } catch (error: any) {
    console.error('Failed to get captcha', error);
    res.status(500).json({ error: error.message || 'Failed to get captcha' });
  }
});

// Fetch taxpayer details using GSTIN and solved captcha
gstRouter.post('/details', async (req: Request, res: Response) => {
  const { gstin, captcha, sessionId } = req.body;

  if (!gstin || !captcha || !sessionId) {
    return res.status(400).json({ error: 'GSTIN, Captcha and Session ID are required' });
  }

  try {
    const details = await gstService.fetchGstinDetails(gstin, captcha, sessionId);
    if (!details) {
      return res.status(404).json({ error: 'Taxpayer details not found' });
    }

    res.json(details);
  } catch (error: any) {
    console.error('Failed to fetch taxpayer details', error);
    res.status(400).json({ error: error.message || 'Failed to fetch taxpayer details' });
  }
});

// Keep the old GET for backward compatibility if needed, but mark as deprecated or mock-only
gstRouter.get('/:gstin', async (req: Request, res: Response) => {
  res.status(400).json({ error: 'This endpoint is deprecated. Use POST /details with captcha instead.' });
});
