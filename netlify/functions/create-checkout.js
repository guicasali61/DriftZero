require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PRODUCT_CATALOG = {
  "apex-pro-hit-parade": {
    name: "DriftZero Apex Pro - Hit Parade",
    price: 59.99
  },

  "apex-pro-drip-crew": {
    name: "DriftZero Apex Pro - Drip Crew",
    price: 59.99
  },

  "apex-pro-elder-vale": {
    name: "DriftZero Apex Pro - Elder Vale",
    price: 59.99
  },

  "apex-pro-obsidian-core": {
    name: "DriftZero Apex Pro - Obsidian Core",
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

  "classic-rail-white": {
    name: "DriftZero Classic Rail - Ivory Signal",
    price: 34.99
  },

  "classic-rail-ivory-signal": {
    name: "DriftZero Classic Rail - Ivory Signal",
    price: 34.99
  },

  "classic-rail-red": {
    name: "DriftZero Classic Rail - Crimson Rail",
    price: 34.99
  },

  "classic-rail-crimson-rail": {
    name: "DriftZero Classic Rail - Crimson Rail",
    price: 34.99
  },

  "classic-rail-pink": {
    name: "DriftZero Classic Rail - Rose Static",
    price: 34.99
  },

  "classic-rail-rose-static": {
    name: "DriftZero Classic Rail - Rose Static",
    price: 34.99
  },

  "core-rail-custom-pair": {
    name: "DriftZero Core Rail - Custom Pair",
    price: 19.99
  }
};

function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  };
}

function parseRequestBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function getBackendProduct(item) {
  if (!item || typeof item !== "object") {
    throw new Error("Invalid cart item");
  }

  if (!item.key || typeof item.key !== "string") {
    throw new Error("Missing product key");
  }

  const product = PRODUCT_CATALOG[item.key];

  if (!product) {
    throw new Error(`Unknown product key: ${item.key}`);
  }

  return product;
}

function getValidQuantity(item) {
  const quantity = Number(item.quantity);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    throw new Error("Invalid quantity");
  }

  return quantity;
}

function cleanMetadataValue(value) {
  if (typeof value !== "string") return "";
  return value.slice(0, 120);
}

exports.handler = async function (event) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing STRIPE_SECRET_KEY");

      return createResponse(500, {
        error: "Server configuration error"
      });
    }

    if (event.httpMethod !== "POST") {
      return createResponse(405, {
        error: "Method not allowed"
      });
    }

    const body = parseRequestBody(event);
    const items = Array.isArray(body.items) ? body.items : body;

    console.log("ITEM KEYS:", Array.isArray(items) ? items.map(item => item.key) : "Invalid items");

    if (!Array.isArray(items) || items.length === 0) {
      return createResponse(400, {
        error: "Cart is empty"
      });
    }

    if (items.length > 20) {
      return createResponse(400, {
        error: "Too many cart items"
      });
    }

    const lineItems = items.map((item) => {
      const backendProduct = getBackendProduct(item);
      const quantity = getValidQuantity(item);

      return {
        quantity,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(backendProduct.price * 100),
          product_data: {
            name: backendProduct.name,
            metadata: {
              key: cleanMetadataValue(item.key),
              product: cleanMetadataValue(item.product),
              type: cleanMetadataValue(item.type),
              color: cleanMetadataValue(item.color),
              colorKey: cleanMetadataValue(item.colorKey),
              leftColor: cleanMetadataValue(item.leftColor),
              rightColor: cleanMetadataValue(item.rightColor),
              leftKey: cleanMetadataValue(item.leftKey),
              rightKey: cleanMetadataValue(item.rightKey),
              patternKey: cleanMetadataValue(item.patternKey)
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

      shipping_address_collection: {
        allowed_countries: ["IT"]
      },

      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 499,
              currency: "eur"
            },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 3
              },
              maximum: {
                unit: "business_day",
                value: 7
              }
            }
          }
        }
      ],

      success_url: `${siteUrl}/pagine/cart.html?success=true`,
      cancel_url: `${siteUrl}/pagine/cart.html?canceled=true`
    });

    return createResponse(200, {
      url: session.url
    });

  } catch (error) {
    console.error("Checkout error:", error);

    return createResponse(500, {
      error: "Unable to create checkout session"
    });
  }
};