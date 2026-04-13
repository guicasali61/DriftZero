


console.log("carrello si sta caricando");


const Cart = {
  items: JSON.parse(localStorage.getItem("cart")) || [],

  save(){
    localStorage.setItem("cart", JSON.stringify(this.items));
  },

  add(name, price, image){
    console.log("Sto aggiungendo:",name,price,image );
    this.items.push({ name, price, image });
    this.save();
    this.render();
    console.log("Carrello aggiornato:",name,price,image);
  },

  remove(index){
    this.items.splice(index, 1);
    this.save();
    this.render();
  },

  getTotal(){
    return this.items.reduce((sum, item) => sum + item.price, 0);
  },

  render(){
    const container = document.getElementById("cartItems");
    const badge = document.getElementById("cartCount");

    if(!container) return;

    container.innerHTML = "";

    if(this.items.length === 0){
      container.innerHTML = 
      `<div class="empty-cart">
      <h2>Il carrello è vuoto</h2>
      <p>Non hai ancora comprato nulla? D'haiun occhiata allo shop</p>
      <a href="index.html">Vai allo Shop</a>
       </div>`;
    } 
    
    else {
      this.items.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
          <span>${item.name}</span>
          <span>€${item.price.toFixed(2)}</span>
        `;

        div.onclick = () => this.remove(index);

        container.appendChild(div);
      });
    }

    if(badge){
      badge.innerText = this.items.length;
    }
  }
};
console.log("cart item iniziali:", Cart.items);

// inizializza al caricamento pagina
document.addEventListener("DOMContentLoaded", () => {
  Cart.render();
});