const Cart = {
  key: "cart",

  getItems() {
    return JSON.parse(localStorage.getItem(this.key)) || [];
  },

  saveItems(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
  },

  fixImagePath(image) {
    if (!image) return "";

    const isInsidePagine = window.location.pathname.includes("/pagine/");

    if (image.startsWith("http")) return image;

    const cleanImage = image.replace("../", "");

    return isInsidePagine ? `../${cleanImage}` : cleanImage;
  },

  add(product) {
    const cart = this.getItems();

    const existingItem = cart.find(item => item.key === product.key);

    if (existingItem) {
      existingItem.quantity += product.quantity || 1;
    } else {
      cart.push({
        key: product.key,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        quantity: product.quantity || 1
      });
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

  getQuantity(cart) {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  },

  getSubtotal(cart) {
    return cart.reduce((total, item) => {
      return total + Number(item.price) * (item.quantity || 1);
    }, 0);
  },

  formatPrice(value) {
    return `€${value.toFixed(2)}`;
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

    if (badge) badge.textContent = count;

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
      const quantity = item.quantity || 1;
      const itemTotal = Number(item.price) * quantity;
      const imagePath = this.fixImagePath(item.image);

      return `
        <div class="cart-item">
          <div class="cart-item-image">
            <img src="${imagePath}" alt="${item.name}">
          </div>

          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-meta">Qty: ${quantity}</div>
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
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Cart.render();

  const cartWrapper = document.getElementById("cartWrapper");
  const cartToggle = document.getElementById("cartToggle");
  const clearCartBtn = document.getElementById("clearCartBtn");

  // TOGGLE DROPDOWN
  if (cartToggle && cartWrapper) {
    cartToggle.addEventListener("click", (e) => {
      e.stopPropagation();

      cartWrapper.classList.toggle("open");

      const isOpen = cartWrapper.classList.contains("open");
      cartToggle.setAttribute("aria-expanded", isOpen);
    });

    // CLICK FUORI = CHIUDI
    document.addEventListener("click", (e) => {
      if (!cartWrapper.contains(e.target)) {
        cartWrapper.classList.remove("open");
        cartToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // CLEAR CART
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      Cart.clear();
    });
  }
});