import express from 'express';
import { getModules, getUserModules, unlockModule } from '../controllers/modulesController.js';

const router = express.Router();

router.get('/modules', getModules);
router.get('/users/:id/modules', getUserModules);
router.post('/modules/unlock', unlockModule);

export default router;


