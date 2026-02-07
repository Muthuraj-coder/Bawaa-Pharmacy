// src/services/api.js
import Constants from "expo-constants";

// Derive host (IPv4) from Expo dev server so it works
// for both physical devices and emulators on the same network.
const host = Constants.expoConfig?.hostUri?.split(":")?.[0];

// Base URL used for all backend requests.
// In Expo dev, this resolves to something like http://192.168.x.x:8000
// which is reachable from:
// - Physical devices on the same Wi‑Fi
// - Android emulator (it can also reach the host via this LAN IP;
//   alternatively you can temporarily hard‑code "http://10.0.2.2:8000"
//   if needed for local Android emulator testing).
const BASE_URL =
  __DEV__ && host ? `http://${host}:8000` : "http://localhost:8000";

/**
 * Safely parse backend response
 */
async function parseResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(text || "Invalid server response");
  }
}

/**
 * SIGNUP API
 */
export async function signup(payload) {
  try {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await parseResponse(response);
      const message = errorBody.detail || "Signup failed";
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return parseResponse(response);
  } catch (err) {
    // Surface full network / parsing errors to the caller
    console.log("Signup request error:", err);
    throw err;
  }
}

/**
 * LOGIN API
 */
export async function login(payload) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await parseResponse(response);

      const isAuthError =
        response.status === 401 || response.status === 403;

      const message =
        errorBody.detail ||
        (isAuthError ? "Invalid email or password" : "Login failed");

      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return parseResponse(response);
  } catch (err) {
    // This will include:
    // - Network errors (e.g. "Network request failed")
    // - Any explicit errors thrown above with status codes attached
    console.log("Login request error:", err);
    throw err;
  }
}

/**
 * STOCK / MEDICINE APIs
 */

// Fetch all medicines with their variants
export async function fetchMedicinesWithVariants() {
  try {
    const response = await fetch(
      `${BASE_URL}/api/stock/medicines-with-variants`
    );

    if (!response.ok) {
      const errorBody = await parseResponse(response);
      const error = new Error(
        errorBody.detail || "Failed to fetch medicines"
      );
      error.status = response.status;
      throw error;
    }

    return parseResponse(response);
  } catch (err) {
    console.error("fetchMedicinesWithVariants error:", err);
    throw err;
  }
}

// Create or return a generic medicine, then create a variant (stock).
// This keeps the frontend simple: a single call for new stock arrivals.
export async function createMedicineStock(payload) {
  const { name, category, ...variantData } = payload;

  try {
    // 1) Ensure generic medicine exists
    const medicineResponse = await fetch(`${BASE_URL}/api/stock/medicines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, category }),
    });

    if (!medicineResponse.ok) {
      const errorBody = await parseResponse(medicineResponse);
      const error = new Error(
        errorBody.detail || "Failed to create medicine"
      );
      error.status = medicineResponse.status;
      throw error;
    }

    const medicine = await parseResponse(medicineResponse);

    // 2) Create concrete variant for this medicine
    const variantResponse = await fetch(
      `${BASE_URL}/api/stock/medicines/${medicine._id}/variants`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(variantData),
      }
    );

    if (!variantResponse.ok) {
      const errorBody = await parseResponse(variantResponse);
      const error = new Error(
        errorBody.detail || "Failed to create medicine variant"
      );
      error.status = variantResponse.status;
      throw error;
    }

    return parseResponse(variantResponse);
  } catch (err) {
    console.error("createMedicineStock error:", err);
    throw err;
  }
}

// Reduce stock for a specific variant after a sale.
// Expects a valid MongoDB _id for the variant and a positive quantity.
export async function reduceStockOnSale(variantId, quantity) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/stock/variants/${variantId}/reduce`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      }
    );

    if (!response.ok) {
      const errorBody = await parseResponse(response);
      const error = new Error(errorBody.detail || "Failed to reduce stock");
      error.status = response.status;
      throw error;
    }

    return parseResponse(response);
  } catch (err) {
    console.error("reduceStockOnSale error:", err);
    throw err;
  }
}

/**
 * MEDICINE MASTER SEARCH
 */
export async function searchMedicineMaster(query) {
  const q = String(query || "").trim();
  if (!q) return [];

  try {
    const response = await fetch(
      `${BASE_URL}/api/medicines/search?q=${encodeURIComponent(q)}`
    );

    if (!response.ok) {
      const errorBody = await parseResponse(response);
      const error = new Error(errorBody.detail || "Search failed");
      error.status = response.status;
      throw error;
    }

    return parseResponse(response);
  } catch (err) {
    console.error("searchMedicineMaster error:", err);
    throw err;
  }
}

/**
 * LOW STOCK API
 */
export async function fetchLowStockMedicines() {
  try {
    const response = await fetch(`${BASE_URL}/api/medicines/low-stock`);

    if (!response.ok) {
      const errorBody = await parseResponse(response);
      const error = new Error(
        errorBody.detail || "Failed to fetch low stock medicines"
      );
      error.status = response.status;
      throw error;
    }

    return parseResponse(response);
  } catch (err) {
    console.error("fetchLowStockMedicines error:", err);
    throw err;
  }
}

/**
 * DASHBOARD STATS
 */
export async function fetchStats() {
  try {
    const response = await fetch(`${BASE_URL}/api/stats`);
    if (!response.ok) {
      const errorBody = await parseResponse(response);
      throw new Error(errorBody.detail || "Failed to fetch stats");
    }
    return parseResponse(response);
  } catch (err) {
    console.error("fetchStats error:", err);
    throw err;
  }
}

/**
 * INVOICE API
 */

// Preview totals (no persist). Same body as create minus paymentMode.
export async function getInvoicePreview(payload) {
  try {
    const response = await fetch(`${BASE_URL}/api/invoices/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorBody = await parseResponse(response);
      throw new Error(errorBody.detail || "Preview failed");
    }
    return parseResponse(response);
  } catch (err) {
    console.error("getInvoicePreview error:", err);
    throw err;
  }
}

// List invoices (sort: dateDesc | dateAsc, fromDate, toDate: YYYY-MM-DD)
export async function fetchInvoices(params = {}) {
  try {
    const q = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/api/invoices${q ? `?${q}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await parseResponse(response);
      throw new Error(errorBody.detail || "Failed to fetch invoices");
    }
    return parseResponse(response);
  } catch (err) {
    console.error("fetchInvoices error:", err);
    throw err;
  }
}

// Fetch single invoice by id
export async function getInvoice(id) {
  try {
    const response = await fetch(`${BASE_URL}/api/invoices/${id}`);
    if (!response.ok) {
      const errorBody = await parseResponse(response);
      const error = new Error(errorBody.detail || "Failed to fetch invoice");
      error.status = response.status;
      throw error;
    }
    return parseResponse(response);
  } catch (err) {
    console.error("getInvoice error:", err);
    throw err;
  }
}

export async function createInvoice(payload) {
  try {
    const response = await fetch(`${BASE_URL}/api/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await parseResponse(response);
      const error = new Error(errorBody.detail || "Failed to create invoice");
      error.status = response.status;
      throw error;
    }

    return parseResponse(response);
  } catch (err) {
    console.error("createInvoice error:", err);
    throw err;
  }
}

