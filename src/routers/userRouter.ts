import express from 'express';
import {
  signup,
  login,
  protect,
  updatePassword,
  restrictTo,
} from '../controllers/authController';
import { createUser } from '../controllers/userController';
import { Role } from '../models/userModel';

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);

router.patch('/updateMyPassword', protect, updatePassword);

router.route('/').post(protect, restrictTo(Role.ADMIN), createUser);

export default router;
