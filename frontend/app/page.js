"use client"
import React, { useState } from "react";
import axios from "axios";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:4000/checkout");
      window.location.href = response.data.checkoutUrl;
    } catch (error) {
      alert("Checkout failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? "Loading..." : "Buy Sample Product"}
    </button>
  );
}
