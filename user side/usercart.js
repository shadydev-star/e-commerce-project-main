const cartSection = document.getElementById("cartSection");

    function getCart() {
      return JSON.parse(localStorage.getItem("cart")) || [];
    }

    function saveCart(cart) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }

    function renderCart() {
      const cart = getCart();
      cartSection.innerHTML = "";

      if (cart.length === 0) {
        cartSection.innerHTML = "<p>Your cart is empty.</p>";
        document.querySelector(".cart-controls").style.display = "none";
        return;
      }

      let total = 0;

      cart.forEach((item, index) => {
        total += item.price * item.quantity;
        const card = document.createElement("div");
        card.className = "cart-item";
        card.innerHTML = `
          <img src="${item.img}" alt="${item.name}" />
          <div class="cart-details">
            <h3>${item.name}</h3>
            <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
            <button data-index="${index}" class="remove-btn">Remove</button>
          </div>
        `;
        cartSection.appendChild(card);
      });

      const totalEl = document.createElement("div");
      totalEl.className = "cart-total";
      totalEl.innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
      cartSection.appendChild(totalEl);
      document.querySelector(".cart-controls").style.display = "flex";
    }

    // Remove item
    cartSection.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-btn")) {
        const cart = getCart();
        const index = parseInt(e.target.dataset.index);
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
      }
    });

    // Clear cart
    document.getElementById("clearCartBtn").addEventListener("click", () => {
      localStorage.removeItem("cart");
      renderCart();
    });

    // Proceed to checkout
    document.getElementById("checkoutBtn").addEventListener("click", () => {
      alert("Proceeding to checkout... (Functionality coming soon)");
    });

    renderCart();