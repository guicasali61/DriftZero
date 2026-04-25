require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
      const price = Number(item.price);
      const quantity = Number(item.quantity) || 1;

      if (!item.name || !price || price <= 0) {
        throw new Error("Invalid cart item");
      }

      return {
        quantity,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(price * 100),
          product_data: {
            name: item.name,
            metadata: {
              key: item.key || "",
              product: item.product || "",
              type: item.type || "",
              color: item.color || "",
              colorKey: item.colorKey || "",
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