// ==============================
// STORAGE KEYS
// ==============================
const CORE_RAIL_STOCK_KEY = "coreRailStock";

// ==============================
// STOCK INIZIALE
// ==============================
function getDefaultCoreRailStock() {
  return {
    solid: {
      left: {
        blue: 0,
        red: 1,
        purple: 1,
        "dark-blue": 0,
        yellow: 0,
        gray: 1,
        white: 0,
        "light-purple": 1,
        fuchsia: 0,
        pink: 1,
        green: 1,
        brown: 0
      },
      right: {
        red: 1,
        blue: 0,
        orange: 1,
        yellow: 0,
        gray: 1,
        white: 0,
        "light-green": 1,
        green: 1,
        "light-yellow": 0,
        "light-blue": 0,
        ochre: 0,
        pink: 1
      }
    },
    pattern: {
      "splatoon-2": 1,
      "monster-hunter": 0,
      "zelda-totk": 0,
      "zelda-skyward": 1,
      "pokemon": 0,
      "mario": 1
    }
  };
}
// ==============================
// GET / SAVE
// ==============================
function getCoreRailStock() {
  let stock = localStorage.getItem(CORE_RAIL_STOCK_KEY);

  if (!stock) {
    stock = getDefaultCoreRailStock();
    localStorage.setItem(CORE_RAIL_STOCK_KEY, JSON.stringify(stock));
    return stock;
  }

  return JSON.parse(stock);
}

function saveCoreRailStock(stock) {
  localStorage.setItem(CORE_RAIL_STOCK_KEY, JSON.stringify(stock));
}

function resetCoreRailStock() {
  const stock = getDefaultCoreRailStock();
  saveCoreRailStock(stock);
}

// ==============================
// DISPONIBILITÀ (SOLO STOCK REALE)
// ==============================
function getCoreRailAvailableQty(selection) {
  const stock = getCoreRailStock();

  if (!selection) return 0;

  // PATTERN (coppia completa)
  if (selection.type === "pattern") {
    return stock.pattern[selection.patternKey] ?? 0;
  }

  // SOLID (left + right)
  if (selection.type === "solid") {
    const leftStock = stock.solid.left[selection.leftKey] ?? 0;
    const rightStock = stock.solid.right[selection.rightKey] ?? 0;

    return Math.min(leftStock, rightStock);
  }

  return 0;
}

// ==============================
// CHECK DISPONIBILITÀ
// ==============================
function canAddCoreRailToCart(selection, qty = 1) {
  const available = getCoreRailAvailableQty(selection);
  return available >= qty;
}

// ==============================
// CHECKOUT (QUI SCALA DAVVERO)
// ==============================
function consumeCoreRailStockFromCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const stock = getCoreRailStock();

  for (const item of cart) {
    if (!item.key || !item.key.startsWith("lite-")) continue;

    const parts = item.key.replace("lite-", "").split("-");
    const leftKey = parts[0];
    const rightKey = parts[1];

    const isPattern = leftKey === rightKey && stock.pattern[leftKey] !== undefined;

    if (isPattern) {
      if ((stock.pattern[leftKey] ?? 0) <= 0) {
        return { ok: false, message: `Pattern ${leftKey} out of stock` };
      }
      stock.pattern[leftKey] -= 1;
    } else {
      if ((stock.solid.left[leftKey] ?? 0) <= 0) {
        return { ok: false, message: `Left ${leftKey} out of stock` };
      }

      if ((stock.solid.right[rightKey] ?? 0) <= 0) {
        return { ok: false, message: `Right ${rightKey} out of stock` };
      }

      stock.solid.left[leftKey] -= 1;
      stock.solid.right[rightKey] -= 1;
    }
  }

  saveCoreRailStock(stock);

  return { ok: true, message: "Stock aggiornato correttamente" };
}