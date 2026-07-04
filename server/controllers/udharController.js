// ============================================
//   Udhar Controller — with owner isolation
// ============================================
const { UdharPayment } = require("../models/OtherModels");
const Customer = require("../models/Customer");
const Sale = require("../models/Sale");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

const recordPayment = async (req, res) => {
  try {
    const { customerId, saleId, paymentMode, notes } = req.body;
    const paidAmount = Number(req.body.paidAmount);

    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({ success: false, message: "Payment amount must be greater than 0." });
    }

    const customer = await Customer.findOne({ _id: customerId, owner: req.ownerId });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });

    if (paidAmount > customer.totalUdhar) {
      return res.status(400).json({ success: false, message: `Customer only owes ₹${customer.totalUdhar}.` });
    }

    const remainingBalance = Math.max(0, customer.totalUdhar - paidAmount);

    const payment = await UdharPayment.create({
      customerId, saleId, paidAmount, remainingBalance,
      paymentMode: paymentMode || "cash", notes,
      recordedBy: req.user._id,
      owner: req.ownerId,
    });

    customer.totalUdhar = remainingBalance;
    customer.lastPaymentDate = new Date();
    if (customer.totalUdhar > 5000) customer.riskLevel = "high";
    else if (customer.totalUdhar > 2000) customer.riskLevel = "medium";
    else customer.riskLevel = "low";
    await customer.save();

    if (saleId) {
      const sale = await Sale.findOne({ _id: saleId, owner: req.ownerId });
      if (sale) {
        const newDue = Math.max(0, sale.dueAmount - paidAmount);
        await Sale.findByIdAndUpdate(saleId, {
          dueAmount: newDue, paidAmount: sale.paidAmount + paidAmount, isPaid: newDue <= 0,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Payment of ₹${paidAmount} recorded. Remaining: ₹${remainingBalance}`,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const payments = await UdharPayment.find({ customerId: req.params.customerId, owner: req.ownerId })
      .populate("recordedBy", "name").sort({ paymentDate: -1 });
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllPendingUdhars = async (req, res) => {
  try {
    const customers = await Customer.find({ totalUdhar: { $gt: 0 }, isActive: true, owner: req.ownerId })
      .sort({ totalUdhar: -1 });
    const totalPending = customers.reduce((sum, c) => sum + c.totalUdhar, 0);
    res.json({ success: true, totalPending, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendReminder = async (req, res) => {
  try {
    const { customerId, type } = req.body; // 'email' or 'whatsapp'
    const customer = await Customer.findOne({ _id: customerId, owner: req.ownerId });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    if (customer.totalUdhar <= 0) {
      return res.status(400).json({ success: false, message: "Customer has no pending udhar." });
    }

    const amountDue = customer.totalUdhar;
    const customerName = customer.name;

    if (type === "email") {
      if (!customer.email) {
        return res.status(400).json({ success: false, message: "Customer does not have an email address." });
      }

      // Configure nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"SmartShop Billing" <${process.env.EMAIL_USER}>`,
        to: customer.email,
        subject: `⚠️ Pending Payment Reminder - SmartShop`,
        text: `Dear ${customerName},\n\nThis is a friendly reminder that you have a pending payment of ₹${amountDue.toLocaleString("en-IN")} at SmartShop.\n\nPlease clear your balance as soon as possible.\n\nThank you,\nSmartShop Team`,
        html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">Payment Reminder</h2>
          <p>Dear <strong>${customerName}</strong>,</p>
          <p>This is a friendly reminder regarding your pending balance at SmartShop.</p>
          <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Total Pending Balance</p>
            <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 800; color: #ef4444;">₹${amountDue.toLocaleString("en-IN")}</p>
          </div>
          <p>Please clear your pending dues at your earliest convenience. If you have already cleared this, please ignore this email.</p>
          <br/>
          <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-bottom: 0;">Thank you for your business!<br/><strong>SmartShop Management Team</strong></p>
        </div>`
      };

      await transporter.sendMail(mailOptions);
      return res.json({ success: true, message: `Email reminder sent to ${customer.email}! ✉️` });

    } else if (type === "whatsapp") {
      if (!customer.phone) {
        return res.status(400).json({ success: false, message: "Customer does not have a phone number." });
      }

      // Check if twilio credentials are set
      if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === "your_twilio_account_sid") {
        // Mock sending in development if no Twilio credentials
        console.log(`[Twilio Mock] Sending WhatsApp reminder to ${customer.phone}: Pending ₹${amountDue}`);
        return res.json({ success: true, message: `WhatsApp reminder simulated to ${customer.phone}! (No Twilio Config) 📱` });
      }

      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: `Dear ${customerName}, this is a reminder that you have a pending payment of ₹${amountDue.toLocaleString("en-IN")} at SmartShop. Please clear it soon. Thanks!`,
        from: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886",
        to: `whatsapp:${customer.phone.startsWith("+") ? customer.phone : "+91" + customer.phone}`
      });

      return res.json({ success: true, message: `WhatsApp reminder sent to ${customer.phone}! 📱` });
    } else {
      return res.status(400).json({ success: false, message: "Invalid reminder type." });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { recordPayment, getPaymentHistory, getAllPendingUdhars, sendReminder };
