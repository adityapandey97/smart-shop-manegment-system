"""
============================================
  SmartShop AI Service (Python + Flask)
  Provides demand forecasting & smart insights
  Run separately: python ai_service.py
  Port: 5001
============================================
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime, timedelta
import random  # Replace with real ML model in production

app = Flask(__name__)
CORS(app)  # Allow requests from Node.js backend

# ============================================
#   Route: Predict future stock demand
#   POST /predict-demand
#   Input: { productId, salesHistory: [{date, quantity}], currentStock }
# ============================================
@app.route("/predict-demand", methods=["POST"])
def predict_demand():
    try:
        data = request.get_json()
        sales_history = data.get("salesHistory", [])
        current_stock = data.get("currentStock", 0)
        product_name = data.get("productName", "Product")

        if len(sales_history) < 3:
            # Not enough data for prediction
            return jsonify({
                "success": False,
                "message": "Need at least 3 days of sales history for prediction"
            })

        # Calculate average daily sales from history
        total_sold = sum(item.get("quantity", 0) for item in sales_history)
        avg_daily_sales = total_sold / len(sales_history)

        # Simple linear prediction (replace with ARIMA or Prophet for production)
        # Growing trend detection
        recent = sales_history[-3:] if len(sales_history) >= 3 else sales_history
        recent_avg = sum(r.get("quantity", 0) for r in recent) / len(recent)

        # Adjust for trend
        trend_factor = recent_avg / avg_daily_sales if avg_daily_sales > 0 else 1
        predicted_daily = avg_daily_sales * trend_factor

        # Days until stock runs out
        days_until_stockout = int(current_stock / predicted_daily) if predicted_daily > 0 else 999

        # Next 7 days prediction
        predictions = []
        for i in range(1, 8):
            # Add some realistic variance (in production: use actual ML)
            variance = random.uniform(0.85, 1.15)
            predicted_qty = max(0, round(predicted_daily * variance, 1))
            date = (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d")
            predictions.append({"date": date, "predicted_quantity": predicted_qty})

        # Generate recommendation
        if days_until_stockout <= 3:
            urgency = "critical"
            recommendation = f"🚨 CRITICAL: {product_name} will run out in {days_until_stockout} days! Order immediately."
        elif days_until_stockout <= 7:
            urgency = "high"
            recommendation = f"⚠️ Order {product_name} soon — stock lasts only {days_until_stockout} more days."
        elif days_until_stockout <= 14:
            urgency = "medium"
            recommendation = f"📦 Consider restocking {product_name} within a week."
        else:
            urgency = "low"
            recommendation = f"✅ {product_name} stock is sufficient for ~{days_until_stockout} days."

        # Recommended reorder quantity (30-day supply)
        reorder_qty = round(predicted_daily * 30)

        return jsonify({
            "success": True,
            "data": {
                "avgDailySales": round(avg_daily_sales, 2),
                "predictedDailySales": round(predicted_daily, 2),
                "daysUntilStockout": days_until_stockout,
                "urgency": urgency,
                "recommendation": recommendation,
                "reorderQuantity": reorder_qty,
                "next7Days": predictions,
                "trendFactor": round(trend_factor, 2),
                "trend": "increasing" if trend_factor > 1.05 else "decreasing" if trend_factor < 0.95 else "stable"
            }
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ============================================
#   Route: Detect dead stock
#   POST /detect-dead-stock
#   Input: { products: [{productId, lastSoldDate, stockQuantity, ...}] }
# ============================================
@app.route("/detect-dead-stock", methods=["POST"])
def detect_dead_stock():
    try:
        data = request.get_json()
        products = data.get("products", [])
        dead_stock = []
        today = datetime.now()

        for product in products:
            last_sold = product.get("lastSoldDate")
            stock_qty = product.get("stockQuantity", 0)

            if stock_qty <= 0:
                continue  # No stock, nothing to worry about

            if last_sold is None:
                # Never sold but has stock
                days_idle = 999
            else:
                last_sold_date = datetime.fromisoformat(last_sold.replace("Z", ""))
                days_idle = (today - last_sold_date).days

            if days_idle >= 45:
                dead_stock.append({
                    "productId": product.get("productId"),
                    "productName": product.get("productName"),
                    "stockQuantity": stock_qty,
                    "daysIdle": days_idle,
                    "estimatedLoss": stock_qty * product.get("buyingPrice", 0),
                    "suggestion": "Consider running a discount offer or returning to supplier."
                })

        return jsonify({
            "success": True,
            "count": len(dead_stock),
            "totalEstimatedLoss": sum(p["estimatedLoss"] for p in dead_stock),
            "data": dead_stock
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ============================================
#   Route: Customer risk analysis
#   POST /analyze-customer-risk
# ============================================
@app.route("/analyze-customer-risk", methods=["POST"])
def analyze_customer_risk():
    try:
        data = request.get_json()
        total_udhar = data.get("totalUdhar", 0)
        delay_count = data.get("delayCount", 0)
        days_since_payment = data.get("daysSincePayment", 0)
        payment_count = data.get("totalPayments", 0)

        # Scoring system (0-100, higher = more risk)
        score = 0
        score += min(40, total_udhar / 250)       # Max 40 points for udhar amount
        score += min(30, delay_count * 6)          # Max 30 points for delays
        score += min(20, days_since_payment / 5)  # Max 20 points for days without payment
        score += 10 if payment_count == 0 else 0  # 10 points if never paid back

        if score >= 60:
            risk = "high"
            advice = "🚨 Do not give more udhar. Request immediate payment."
        elif score >= 30:
            risk = "medium"
            advice = "⚠️ Give udhar only if necessary. Follow up regularly."
        else:
            risk = "low"
            advice = "✅ Good customer. Safe to give udhar."

        return jsonify({
            "success": True,
            "data": { "riskScore": round(score, 1), "riskLevel": risk, "advice": advice }
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ============================================
#   Route: Business insights summary
#   POST /business-insights
# ============================================
@app.route("/business-insights", methods=["POST"])
def business_insights():
    try:
        data = request.get_json()
        revenue = data.get("monthRevenue", 0)
        profit = data.get("monthProfit", 0)
        expenses = data.get("expenses", 0)
        prev_revenue = data.get("prevMonthRevenue", revenue)

        net_profit = profit - expenses
        margin = (profit / revenue * 100) if revenue > 0 else 0
        growth = ((revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0

        insights = []
        if margin < 10:
            insights.append("⚠️ Profit margin is very low. Review your pricing strategy.")
        if growth > 10:
            insights.append(f"📈 Great! Revenue grew by {growth:.1f}% compared to last month.")
        elif growth < -10:
            insights.append(f"📉 Revenue dropped {abs(growth):.1f}%. Check what products are not selling.")
        if expenses > profit * 0.6:
            insights.append("💸 Expenses are too high relative to profit. Look for cost-cutting opportunities.")
        if net_profit > 0:
            insights.append(f"✅ Net profit this month: ₹{net_profit:,.0f}. Keep it up!")

        return jsonify({
            "success": True,
            "data": {
                "netProfit": net_profit,
                "profitMargin": round(margin, 2),
                "revenueGrowth": round(growth, 2),
                "insights": insights or ["📊 Business is running normally. No major alerts."]
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# Chat Advisor Endpoint
@app.route("/chat-advisor", methods=["POST"])
def chat_advisor():
    try:
        data = request.get_json()
        message = data.get("message", "").strip().lower()
        products = data.get("products", [])
        sales = data.get("sales", [])
        expenses = data.get("expenses", [])

        # Default response
        response_text = ""
        
        # Simple agentic intent routing:
        if "price" in message or "selling" in message or "mrp" in message or "trend" in message or "cost" in message:
            # Pricing logic / price recommendation
            matched_product = None
            for p in products:
                name_val = p.get("productName", "").lower()
                if name_val in message or message in name_val:
                    matched_product = p
                    break
            
            # If no specific product matched, look for category match
            if not matched_product:
                for p in products:
                    if p.get("category", "").lower() in message:
                        matched_product = p
                        break

            if matched_product:
                p_name = matched_product.get("productName")
                bp = matched_product.get("buyingPrice", 0)
                sp = matched_product.get("sellingPrice", 0)
                # Calculate margin
                margin = ((sp - bp) / bp * 100) if bp > 0 else 0
                
                # Market trend suggestion (suggesting standard optimization)
                suggested_margin = 25  # Suggest 25% standard retail profit margin
                suggested_sp = round(bp * (1 + suggested_margin / 100))
                
                response_text = (
                    f"📊 **Market Trend Analysis for {p_name}**:\n\n"
                    f"- **Current Cost Price (Buying)**: ₹{bp:.2f}\n"
                    f"- **Current Selling Price**: ₹{sp:.2f} (Profit Margin: {margin:.1f}%)\n"
                    f"- **Suggested Retail Price**: ₹{suggested_sp:.2f} (Targeting a healthy {suggested_margin}% margin)\n\n"
                    f"💡 *Advice*: According to recent retail market trends, items in the same category are marking up between 20% and 30%. "
                    f"If competitors are pricing lower, consider bundle discount offers rather than dropping individual margins."
                )
            else:
                response_text = (
                    "🏷️ **Product Pricing & Market Trends Advisor**:\n\n"
                    "Please specify the product name (e.g., 'selling price for Amul Butter') to run a trend check. "
                    "In general, dairy products observe a 15-20% margin, whereas snacks and beverages yield a 25-35% profit markup. "
                    "I can recommend optimized prices if you name a specific item!"
                )

        elif "stock" in message or "inventory" in message or "low" in message or "count" in message or "depleted" in message:
            # Stock check
            low_stock = [p for p in products if p.get("stockQuantity", 0) <= p.get("minStockLevel", 5)]
            if low_stock:
                items_str = "\n".join([f"- **{p.get('productName')}**: {p.get('stockQuantity')} units left (Min threshold: {p.get('minStockLevel')})" for p in low_stock[:5]])
                response_text = (
                    f"📦 **Inventory Status Report**:\n\n"
                    f"You have **{len(low_stock)}** products running low on stock:\n"
                    f"{items_str}\n\n"
                    f"🚨 *Reorder Alert*: I suggest placing a restock order with your registered suppliers today to avoid out-of-stock losses."
                )
            else:
                response_text = "✅ **Inventory Status**: All products are currently stocked above their minimum safety thresholds. Your store is in good shape!"

        elif "profit" in message or "sales" in message or "revenue" in message or "business" in message or "expense" in message:
            # Financial advice
            total_rev = sum(s.get("totalAmount", 0) for s in sales)
            total_exp = sum(e.get("amount", 0) for e in expenses)
            net = total_rev - total_exp
            
            response_text = (
                f"📈 **Business Financial Summary**:\n\n"
                f"- **Total Revenue**: ₹{total_rev:,.2f}\n"
                f"- **Total Expenses**: ₹{total_exp:,.2f}\n"
                f"- **Estimated Net Margin**: ₹{net:,.2f}\n\n"
                f"💡 *Insight*: "
            )
            if net > 0:
                response_text += "Your store is currently operating in the green! To maximize returns, review high-cost expenses and optimize stock frequency."
            else:
                response_text += "Net earnings are currently flat or negative. Look at trimming marketing/other expenses, and consider increasing product margins slightly on fast-moving items."

        else:
            response_text = (
                "🤖 **SmartShop AI Assistant**:\n\n"
                "I am here to guide your operations. You can ask me questions like:\n"
                "1. *'What is the selling price of Milk according to market trends?'* (Pricing Advisor)\n"
                "2. *'Which products are low on stock?'* (Inventory check)\n"
                "3. *'How is my store's profit margin doing?'* (Financial breakdown)\n\n"
                "How can I help you optimize your business today?"
            )

        return jsonify({
            "success": True,
            "reply": response_text
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# Health check
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "SmartShop AI Service is running! 🤖", "port": 5001})
if __name__ == "__main__":
    print("[AI-Service] Starting Flask server on port 5001...")
    app.run(host="0.0.0.0", port=5001, debug=True)
