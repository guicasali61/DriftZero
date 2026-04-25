require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PRODUCT_CATALOG = {
  "apex-pro-hit-parade": {
    name: "DriftZero Apex Pro - Hit Parade",
    price: 59.99
  },

  "pulse-flux-rb": {
    name: "DriftZero Pulse Flux - Blue Blaze",
    price: 49.99
  },

  "pulse-flux-pg": {
    name: "DriftZero Pulse Flux - Neon Clash",
    price: 49.99
  },

  "classic-rail-ivory-signal": {
    name: "DriftZero Classic Rail - Ivory Signal",
    price: 34.99
  }
};

function getBackendProduct(item) {
  if (PRODUCT_CATALOG[item.key]) {
    return PRODUCT_CATALOG[item.key];
  }

  if (item.product === "core-rail") {
    return {
      name: item.name || "DriftZero Core Rail",
      price: 19.99
    };
  }

  throw new Error(`Unknown product: ${item.key || "missing-key"}`);
}

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const items = body.items || body;

    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Cart is empty" })
      };
    }

    const lineItems = items.map(item => {
      const backendProduct = getBackendProduct(item);
      const quantity = Number(item.quantity) || 1;

      if (quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      return {
        quantity,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(backendProduct.price * 100),
          product_data: {
            name: backendProduct.name,
            metadata: {
              key: item.key || "",
              product: item.product || "",
              type: item.type || "",
              color: item.color || "",
              colorKey: item.colorKey || "",
              leftColor: item.leftColor || "",
              rightColor: item.rightColor || "",
              leftKey: item.leftKey || "",
              rightKey: item.rightKey || "",
              patternKey: item.patternKey || ""
            }
          }
        }
      };
    });

    const siteUrl =
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      "http://localhost:8888";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${siteUrl}/pagine/cart.html?success=true`,
      cancel_url: `${siteUrl}/pagine/cart.html?canceled=true`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};