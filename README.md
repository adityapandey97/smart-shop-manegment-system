# 🏪 SmartShop Management System

> A complete MERN stack retail shop management system with Udhar tracking, Dynamic Pricing, Inventory Prediction, and Profit Analysis.

---

## 📁 Project Structure

```
SmartShop/
├── server/                   ← Node.js + Express Backend
│   ├── config/               ← Database & Cloudinary config
│   ├── models/               ← MongoDB schemas (User, Product, Sale, etc.)
│   ├── controllers/          ← Business logic for each module
│   ├── routes/               ← API route definitions
│   ├── middleware/           ← JWT auth & role checking
│   └── index.js              ← Server entry point
│
├── client/                   ← React Frontend
│   ├── public/               ← index.html
│   └── src/
│       ├── pages/            ← All 11 pages (Dashboard, Products, Sales, etc.)
│       ├── components/       ← Reusable UI components
│       ├── context/          ← Auth & Theme context (global state)
│       ├── services/         ← Axios API calls
│       └── App.js            ← Main router
│
├── ai-service/               ← Python Flask AI Service (Port 5001)
│   ├── ai_service.py         ← Demand forecasting & insights
│   └── requirements.txt
│
├── .env.example              ← Copy to .env and fill your keys
├── package.json              ← Root package (backend)
└── README.md
```

---

## 🚀 Setup Instructions (Step by Step)

### Step 1: Clone & Install

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm install --prefix client
```

### Step 2: Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Open .env and fill in:
# - MONGO_URI (from MongoDB Atlas)
# - JWT_SECRET (make it long and random)
# - RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (from Razorpay dashboard)
# - CLOUDINARY details (optional, for product images)
```

### Step 3: Start the App

```bash
# Start both backend and frontend together
npm run dev

# OR start separately:
npm run server    # Backend on port 5000
npm run client    # Frontend on port 3000
```

### Step 4: Start AI Service (Optional)

```bash
cd ai-service
pip install -r requirements.txt
python ai_service.py
# Runs on port 5001
```

### Step 5: Open in Browser

```
http://localhost:3000
```

Register as **Owner** for full access → then login.

---

## 🧩 Modules

| Module | What it does |
|--------|-------------|
| 🔐 Auth | Login, Register, JWT, Roles (Owner/Manager/Staff) |
| 📦 Products | Add/Edit/Delete, Stock tracking, Low stock alert |
| 🛒 Purchases | Record stock purchases, auto-update inventory |
| 🧾 Sales | Create bills, multiple payment modes |
| 👥 Customers | Customer profiles, udhar tracking |
| 💳 Udhar | Credit ledger, partial payments, risk rating |
| 🏭 Suppliers | Supplier details, price comparison |
| 💰 Expenses | Rent, electricity, salary tracking |
| 🏷️ Pricing | Dynamic price suggestions when costs change |
| 📈 Reports | Profit/loss charts, top products, analytics |
| ⚙️ Settings | Profile, dark/light mode, language toggle |

---

## 💳 Payment Integration (Razorpay)

1. Create account at [razorpay.com](https://razorpay.com)
2. Get Test API keys from Dashboard → Settings → API Keys
3. Add to `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=xxxx
   ```
4. Use **Test Mode** with card `4111 1111 1111 1111` for testing

---

## 🌐 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client && npm run build
# Upload the /build folder to Vercel or Netlify
```

### Backend (Render/Railway)
```bash
# Set environment variables in Render dashboard
# Connect your GitHub repo
# Deploy from main branch
```

### Database (MongoDB Atlas)
- Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
- Whitelist all IPs: `0.0.0.0/0`
- Copy connection string to `MONGO_URI`

---

## 🔑 API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/products/low-stock
GET    /api/products/dead-stock
POST   /api/sales
GET    /api/sales
POST   /api/purchases
GET    /api/customers
POST   /api/udhar/pay
GET    /api/udhar/pending
POST   /api/expenses
GET    /api/reports/dashboard
GET    /api/reports/profit
POST   /api/payment/create-order
POST   /api/payment/verify
POST   /api/pricing/suggest
```

---

## 🎨 Features

- ✅ Dark Mode / Light Mode toggle
- ✅ Hindi / English language switch
- ✅ Fully responsive (mobile + desktop)
- ✅ JWT Authentication with role-based access
- ✅ Dynamic pricing suggestions
- ✅ Udhar (credit) tracking with risk indicator
- ✅ Dead stock & low stock detection
- ✅ Razorpay payment gateway
- ✅ Recharts data visualization
- ✅ Python AI service for demand forecasting

---

## 📚 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Router, Recharts |
| Styling | Pure CSS with CSS Variables |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Payment | Razorpay |
| Images | Cloudinary |
| AI | Python Flask |
| Deploy | Vercel + Render + MongoDB Atlas |

---

**Made with ❤️ for Indian Kirana Stores and Small Businesses**
