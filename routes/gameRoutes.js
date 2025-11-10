// FILE: routes/gameRoutes.js
import express from 'express';
import guestTracking from '../middleware/guestTracking.js';
import checkGuestAccess from '../middleware/guestAccess.js';

const router = express.Router();

router.get('/play/:gameId', 
  guestTracking,
  checkGuestAccess,
  (req, res) => {
    res.json({
      success: true,
      game: req.gameData,
      message: 'Access granted'
    });
  }
);

export default router;
