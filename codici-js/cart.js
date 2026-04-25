const Cart = {
  key: "cart",

  getItems() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || [];
    } catch {
      return [];
    }
  },

  saveItems(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
  },

  fixImagePath(image) {
    if (!image) return "";

    const isInsidePagine = window.location.pathname.includes("/pagine/");
    const isRemote = image.startsWith("http") || image.startsWith("data:");

    if (isRemote) return image;

    const cleanImage = image.replace(/^(\.\.\/)+/, "");

    return isInsidePagine ? `../${cleanImage}` : cleanImage;
  },

  normalizeProduct(product) {
    return {
      ...product,
      key: product.key || product.id || crypto.randomUUID(),
      id: product.id || product.key || crypto.randomUUID(),
      name: product.name || "Unnamed product",
      price: Number(product.price) || 0,
      image: product.image || product.pairImage || "",
      quantity: Number(product.quantity) || 1
    };
  },

  add(product) {
    const cart = this.getItems();
    const normalizedProduct = this.normalizeProduct(product);

    const existingItem = cart.find(item => item.key === normalizedProduct.key);

    if (existingItem) {
      const newQuantity =
        (Number(existingItem.quantity) || 1) + normalizedProduct.quantity;

      Object.assign(existingItem, {
        ...existingItem,
        ...normalizedProduct,
        quantity: newQuantity
      });
    } else {
      cart.push(normalizedProduct);
    }

    this.saveItems(cart);
    this.render();
  },

  remove(index) {
    const cart = this.getItems();
    cart.splice(index, 1);
    this.saveItems(cart);
    this.render();
  },

  clear() {
    this.saveItems([]);
    this.render();
  },

  open() {
    const cartWrapper = document.getElementById("cartWrapper");
    const cartToggle = document.getElementById("cartToggle");

    if (!cartWrapper) return;

    cartWrapper.classList.add("open");

    if (cartToggle) {
      cartToggle.setAttribute("aria-expanded", "true");
    }
  },

  close() {
    const cartWrapper = document.getElementById("cartWrapper");
    const cartToggle = document.getElementById("cartToggle");

    if (!cartWrapper) return;

    cartWrapper.classList.remove("open");

    if (cartToggle) {
      cartToggle.setAttribute("aria-expanded", "false");
    }
  },

  toggle() {
    const cartWrapper = document.getElementById("cartWrapper");
    const cartToggle = document.getElementById("cartToggle");

    if (!cartWrapper) return;

    cartWrapper.classList.toggle("open");

    if (cartToggle) {
      cartToggle.setAttribute(
        "aria-expanded",
        cartWrapper.classList.contains("open") ? "true" : "false"
      );
    }
  },

  getQuantity(cart = this.getItems()) {
    return cart.reduce((total, item) => {
      return total + (Number(item.quantity) || 1);
    }, 0);
  },

  getSubtotal(cart = this.getItems()) {
    return cart.reduce((total, item) => {
      return total + Number(item.price) * (Number(item.quantity) || 1);
    }, 0);
  },

  formatPrice(value) {
    return `€${Number(value).toFixed(2)}`;
  },

  getCheckoutItems() {
    return this.getItems().map(item => ({
      id: item.id,
      key: item.key,
      product: item.product || null,
      productName: item.productName || null,
      type: item.type || null,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
      color: item.color || null,
      colorKey: item.colorKey || null,
      leftColor: item.leftColor || null,
      rightColor: item.rightColor || null,
      leftKey: item.leftKey || null,
      rightKey: item.rightKey || null,
      patternKey: item.patternKey || null,
      isPatternPair: item.isPatternPair || false
    }));
  },

  async checkout() {
    const items = this.getCheckoutItems();

    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    try {
      const response = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (!data.url) {
        throw new Error("Stripe checkout URL missing");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout error. Check the console.");
    }
  },

  render() {
    const cart = this.getItems();

    const badge = document.getElementById("cartBadge");
    const dropdownCount = document.getElementById("cartDropdownCount");
    const cartItems = document.getElementById("cartItems");
    const subtotal = document.getElementById("cartSubtotal");

    if (!cartItems) return;

    const count = this.getQuantity(cart);
    const total = this.getSubtotal(cart);

    if (badge) {
      badge.textContent = count;
    }

    if (dropdownCount) {
      dropdownCount.textContent = `${count} item${count === 1 ? "" : "s"}`;
    }

    if (subtotal) {
      subtotal.textContent = this.formatPrice(total);
    }

    if (cart.length === 0) {
      cartItems.innerHTML = `<div class="cart-empty">Your cart is empty.</div>`;
      return;
    }

    cartItems.innerHTML = cart.map((item, index) => {
      const quantity = Number(item.quantity) || 1;
      const itemTotal = Number(item.price) * quantity;
      const imagePath = this.fixImagePath(item.pairImage || item.image);

      let meta = `Qty: ${quantity}`;

      if (item.leftColor && item.rightColor) {
        meta += ` • ${item.leftColor} / ${item.rightColor}`;
      } else if (item.color) {
        meta += ` • ${item.color}`;
      }

      return `
        <div class="cart-item">
          <div class="cart-item-image">
            <img src="${imagePath}" alt="${item.name}">
          </div>

          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-meta">${meta}</div>
            <div class="cart-item-price">${this.formatPrice(itemTotal)}</div>
          </div>

          <button class="cart-item-remove" type="button" data-remove-index="${index}">
            ×
          </button>
        </div>
      `;
    }).join("");

    cartItems.querySelectorAll("[data-remove-index]").forEach(button => {
      button.addEventListener("click", () => {
        this.remove(Number(button.dataset.removeIndex));
      });
    });
  },

  init() {
    this.render();

    const cartWrapper = document.getElementById("cartWrapper");
    const cartToggle = document.getElementById("cartToggle");
    const clearCartBtn = document.getElementById("clearCartBtn");
    const checkoutBtn = document.getElementById("checkoutBtn");

    if (cartToggle && cartWrapper) {
      cartToggle.addEventListener("click", event => {
        event.stopPropagation();
        this.toggle();
      });

      document.addEventListener("click", event => {
        if (!cartWrapper.contains(event.target)) {
          this.close();
        }
      });

      document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
          this.close();
        }
      });
    }

    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", () => {
        this.clear();
      });
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        this.checkout();
      });
    }

    window.addEventListener("storage", event => {
      if (event.key === this.key) {
        this.render();
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Cart.init();
});