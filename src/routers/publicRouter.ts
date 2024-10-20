import express from 'express';
import { greet } from '../controllers/publicController';

const router = express.Router();
router.get('/greet', greet);

export default router;
