"use client"
import React, { useState } from "react";
import axios from "axios";

/**
 * POLAR.SH PAYMENT FLOW GUIDE FOR BEGINNERS
 * 
 * 1️⃣ USER CLICKS "BUY" BUTTON
 *    └─ This component calls handleCheckout()
 * 
 * 2️⃣ FRONTEND SENDS REQUEST TO BACKEND
 *    └─ POST request to http://localhost:4000/checkout
 * 
 * 3️⃣ BACKEND CREATES CHECKOUT WITH POLAR
 *    └─ Backend calls polar.checkouts.create()
 *    └─ Polar returns a checkout URL
 * 
 * 4️⃣ FRONTEND REDIRECTS USER TO POLAR CHECKOUT
 *    └─ User is redirected to Polar's secure payment page
 *    └─ User enters payment details on Polar (NOT on your site)
 * 
 * 5️⃣ POLAR PROCESSES PAYMENT
 *    └─ Polar handles payment securely
 *    └─ User is redirected back to successUrl (http://localhost:3000)
 * 
 * 6️⃣ POLAR SENDS WEBHOOK TO BACKEND
 *    └─ POST request to http://localhost:4000/webhook
 *    └─ Backend receives order.created event
 *    └─ Backend can now activate access, send emails, etc.
 */

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    console.log("\n💳 [FRONTEND] User clicked 'Buy Sample Product' button");
    console.log("💳 [FRONTEND] Loading state set to true");

    try {
      console.log("💳 [FRONTEND] Sending checkout request to backend...");
      console.log("💳 [FRONTEND] Request details:", {
        url: "http://localhost:4000/checkout",
        method: "POST",
        timestamp: new Date().toISOString()
      });

      const response = await axios.post("http://localhost:4000/checkout");

      console.log("✅ [FRONTEND] Backend response received successfully!");
      console.log("✅ [FRONTEND] Response data:", {
        checkoutUrl: response.data.checkoutUrl,
        checkoutId: response.data.checkoutId,
        message: response.data.message
      });

      console.log("✅ [FRONTEND] Redirecting user to Polar checkout page...");
      console.log("⏭️  [FRONTEND] After this point:");
      console.log("   - User will complete payment on Polar's site");
      console.log("   - Payment details are NOT sent to our backend");
      console.log("   - Polar handles all payment security");
      console.log("   - User will be redirected back after payment");
      console.log("   - Backend will receive webhook confirmation");

      // Redirect to Polar's hosted checkout
      window.location.href = response.data.checkoutUrl;

    } catch (error) {
      console.error("❌ [FRONTEND] Checkout request failed!");
      console.error("❌ [FRONTEND] Error details:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data
      });

      const errorMessage = error.response?.data?.error || error.message || "Unknown error occurred";
      setError(errorMessage);
      alert("Checkout failed: " + errorMessage);

    } finally {
      setLoading(false);
      console.log("💳 [FRONTEND] Loading state set to false");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎉 Sample Product</h1>

        <div style={styles.productInfo}>
          <p style={styles.price}>$19.99</p>
          <p style={styles.description}>
            A sample product to test Polar.sh payment integration
          </p>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <>
              <span style={styles.spinner}>⏳</span> Loading Checkout...
            </>
          ) : (
            <>
              <span style={styles.icon}>🛒</span> Buy Sample Product
            </>
          )}
        </button>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>ℹ️ How it works:</h3>
          <ol style={styles.infoList}>
            <li>Click the button to create a checkout session</li>
            <li>You'll be redirected to Polar's secure checkout page</li>
            <li>Enter your payment details (safely on Polar's site)</li>
            <li>After payment, you'll be redirected back here</li>
            <li>The backend will receive a webhook confirmation</li>
          </ol>
        </div>

        <div style={styles.debugBox}>
          <h3 style={styles.debugTitle}>🔍 Open Developer Console (F12)</h3>
          <p style={styles.debugText}>Check the Console tab to see detailed logs:</p>
          <ul style={styles.debugList}>
            <li><strong>🟦 Frontend logs:</strong> Button clicks, API requests</li>
            <li><strong>🟩 Backend logs:</strong> Checkout creation, webhook events</li>
            <li><strong>📊 Data flow:</strong> What gets sent where</li>
            <li><strong>💾 Database tips:</strong> What to store and why</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '500px',
    width: '100%'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: '0 0 20px 0',
    color: '#2c3e50'
  },
  productInfo: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #e0e6ed'
  },
  price: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2ecc71',
    margin: '10px 0'
  },
  description: {
    fontSize: '14px',
    color: '#7f8c8d',
    margin: '10px 0'
  },
  button: {
    width: '100%',
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  spinner: {
    display: 'inline-block',
    marginRight: '5px'
  },
  icon: {
    display: 'inline-block',
    marginRight: '5px'
  },
  errorBox: {
    backgroundColor: '#fadbd8',
    border: '1px solid #f5b7b1',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '20px',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start'
  },
  errorIcon: {
    fontSize: '18px',
    flexShrink: 0
  },
  errorText: {
    margin: '0',
    color: '#c0392b',
    fontSize: '14px'
  },
  infoBox: {
    backgroundColor: '#eaf4fc',
    border: '1px solid #d6eaf8',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '20px'
  },
  infoTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50'
  },
  infoList: {
    margin: '0',
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#34495e',
    lineHeight: '1.6'
  },
  debugBox: {
    backgroundColor: '#fef5e7',
    border: '1px solid #fdebd0',
    borderRadius: '6px',
    padding: '16px'
  },
  debugTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50'
  },
  debugText: {
    margin: '0 0 10px 0',
    fontSize: '13px',
    color: '#34495e'
  },
  debugList: {
    margin: '0',
    paddingLeft: '20px',
    fontSize: '12px',
    color: '#34495e',
    lineHeight: '1.6'
  }
};
