import { Router } from 'express';
import _Banner from '../models/banner';

const router = Router();

// Public endpoint to get active banners
router.get('/banners', async (req, res, next) => {
    try {
        const { position } = req.query;
        const now = new Date();

        const query: any = {
            active: true,
            $or: [
                { startDate: { $exists: false } },
                { startDate: { $lte: now } }
            ],
            $and: [
                {
                    $or: [
                        { endDate: { $exists: false } },
                        { endDate: { $gte: now } }
                    ]
                }
            ]
        };

        if (position) {
            query.position = position;
        }

        const banners = await _Banner
            .find(query)
            .sort({ order: 1, createdAt: -1 })
            .select('title position imageUrl link order')
            .lean();

        res.json({
            status: 200,
            message: 'Banners retrieved successfully',
            data: banners
        });
    } catch (error) {
        next(error);
    }
});

export default router;
