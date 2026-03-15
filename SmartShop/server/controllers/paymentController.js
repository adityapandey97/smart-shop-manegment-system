// ============================================
//   Payment Controller (Razorpay)
//   Handles online payment creation & verification
// ============================================

const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay with your API keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ---- Create a Razorpay Order ----
// POST /api/payment/create-order
// Call this before showing the payment popup
const createOrder = async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

    // Amount must be in paise (1 rupee = 100 paise)
    const options = {
      amount: Math.round(amount * 100), // Convert rupees to paise
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID, // Send to frontend for Razorpay checkout
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Payment order creation failed: " + error.message });
  }
};

// ---- Verify Payment After Completion ----
// POST /api/payment/verify
// Razorpay sends payment data to frontend, frontend sends here for verification
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature using HMAC-SHA256
    // This ensures the payment is genuine and not tampered with
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
      // Payment is verified and genuine!
      res.json({
        success: true,
        message: "Payment verified successfully!",
        paymentId: razorpay_payment_id,
      });
    } else {
      // Signature mismatch = payment is fake
      res.status(400).json({
        success: false,
        message: "Payment verification failed. Possible fraud attempt.",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder, verifyPayment };
