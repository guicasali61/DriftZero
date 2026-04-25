const CLASSIC_RAIL_STOCK_KEY = 'classicRailStock';

function getDefaultClassicRailStock() {
  return {
    white: 4,
    red: 2,
    pink: 4
  };
}

function cloneClassicStock(data) {
  return JSON.parse(JSON.stringify(data));
}

function initializeClassicRailStock() {
  const existing = localStorage.getItem(CLASSIC_RAIL_STOCK_KEY);

  if (!existing) {
    localStorage.setItem(
      CLASSIC_RAIL_STOCK_KEY,
      JSON.stringify(cloneClassicStock(getDefaultClassicRailStock()))
    );
  }
}

function getClassicRailStock() {
  initializeClassicRailStock();
  const saved = localStorage.getItem(CLASSIC_RAIL_STOCK_KEY);
  return saved ? JSON.parse(saved) : cloneClassicStock(getDefaultClassicRailStock());
}

function saveClassicRailStock(stock) {
  localStorage.setItem(CLASSIC_RAIL_STOCK_KEY, JSON.stringify(stock));
}

function resetClassicRailStock() {
  saveClassicRailStock(cloneClassicStock(getDefaultClassicRailStock()));
}

function getClassicRailAvailableQty(colorKey) {
  const stock = getClassicRailStock();
  return stock[colorKey] ?? 0;
}

function validateClassicRailCartBeforeCheckout(cartItems = JSON.parse(localStorage.getItem('cart')) || []) {
  const stock = getClassicRailStock();
  const usage = {};

  for (const item of cartItems) {
    if (item.product !== 'classic-rail') continue;

    const qty = item.quantity || 1;
    const colorKey = item.colorKey;

    usage[colorKey] = (usage[colorKey] || 0) + qty;
  }

  for (const colorKey in usage) {
    const available = stock[colorKey] ?? 0;

    if (usage[colorKey] > available) {
      return {
        ok: false,
        message: `Stock insufficiente per ${colorKey}`
      };
    }
  }

  return { ok: true };
}

function consumeClassicRailStockFromCart(cartItems = JSON.parse(localStorage.getItem('cart')) || []) {
  const validation = validateClassicRailCartBeforeCheckout(cartItems);

  if (!validation.ok) {
    return validation;
  }

  const stock = getClassicRailStock();

  for (const item of cartItems) {
    if (item.product !== 'classic-rail') continue;

    const qty = item.quantity || 1;
    const colorKey = item.colorKey;

    if (stock[colorKey] !== undefined) {
      stock[colorKey] -= qty;
    }
  }

  saveClassicRailStock(stock);

  return {
    ok: true,
    message: 'Classic Rail stock aggiornato'
  };
}