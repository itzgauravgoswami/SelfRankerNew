import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import authMiddleware from '../authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Razorpay SDK Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create premium upgrade order
router.post('/order', authMiddleware, async (req, res) => {
  try {
    const options = {
      amount: 2100, // 21.00 INR (specified in paise)
      currency: 'INR',
      receipt: `rcpt_${req.user.userId.toString().slice(-12)}_${Date.now().toString().slice(-6)}`
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({ error: 'Failed to create payment order.' });
  }
});

// Verify signature and upgrade user to premium
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Payment details are missing.' });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Mark user as Premium in MongoDB
      const user = await User.findOne({ email: req.user.email });
      if (!user) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      user.isPremium = true;
      await user.save();

      res.json({
        success: true,
        message: 'Payment verification successful! Account upgraded to Premium.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          xp: user.xp,
          level: user.level,
          avatarUrl: user.avatarUrl,
          isPremium: user.isPremium
        }
      });
    } else {
      res.status(400).json({ error: 'Payment signature verification failed. Possible tampering.' });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Internal server error verifying payment.' });
  }
});

export default router;
