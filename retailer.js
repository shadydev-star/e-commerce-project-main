import { db } from './firebaseconfig.js';
import { doc, collection, onSnapshot, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// === CART STATE ===
let cart = JSON.parse(localStorage.getItem('cart')) || {};
updateCartCount();

// ✅ Get wholesaler uid from URL
const urlParams = new URLSearchParams(window.location.search);
const wholesalerUid = urlParams.get("uid");

// === PRODUCT FETCH ===
if (!wholesalerUid) {
  document.querySelector("#productGrid").innerHTML = `
    <p style="text-align:center; padding:20px;">❌ No wholesaler selected. Please use a valid retail link.</p>
  `;
  document.getElementById("loading").style.display = "none";
} else {
  fetchProducts(wholesalerUid);
}

function fetchProducts(wholesalerUid) {
  const productGrid = document.getElementById('productGrid');
  const loader = document.getElementById("loading");

  const productsRef = collection(doc(db, "users", wholesalerUid), "products");

  onSnapshot(productsRef, (snapshot) => {
    productGrid.innerHTML = '';
    if (loader) loader.style.display = "none";

    if (snapshot.empty) {
      productGrid.innerHTML = `<p class="no-products">No products available yet.</p>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const product = { id: docSnap.id, ...docSnap.data() };

      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-image">
          <img class="product-pic" src="${product.img}" alt="${product.name}">
        </div>
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-price">₦${Number(product.price).toFixed(2)}</p>
          <button class="view-btn">View Details</button>
        </div>
      `;

      card.querySelector('.view-btn').addEventListener('click', () => openProductModal(product));
      productGrid.appendChild(card);

      // Animate
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      observer.observe(card);
    });
  }, (err) => {
    console.error("❌ Error fetching products:", err);
    if (loader) loader.style.display = "none";
    productGrid.innerHTML = `<p class="no-products">Failed to load products. Try again later.</p>`;
  });
}

// === PRODUCT MODAL ===
const productModal = document.getElementById("productDetailModal");
const closeProductModal = document.getElementById("closeProductModal");
const detailName = document.getElementById("detailName");
const detailPrice = document.getElementById("detailPrice");
const detailCategory = document.getElementById("detailCategory");
const detailImage = document.getElementById("detailImage");
const variantColorsContainer = document.getElementById("variantColors");
const variantSize = document.getElementById("variantSize");
const variantStock = document.getElementById("variantStock");
const addVariantToCart = document.getElementById("addVariantToCart");

let currentProduct = null;
let currentVariants = [];

async function openProductModal(product) {
  currentProduct = product;
  detailName.textContent = product.name;
  detailPrice.textContent = Number(product.price).toFixed(2);
  detailCategory.textContent = product.category;
  detailImage.src = product.img;

  variantColorsContainer.innerHTML = '';
  variantSize.innerHTML = `<option value="">Select size</option>`;
  variantStock.textContent = '';

  // Fetch variants
  const variantsRef = collection(doc(db, "users", wholesalerUid, "products", product.id), "variants");
  const snap = await getDocs(variantsRef);

  currentVariants = [];
  snap.forEach(docSnap => currentVariants.push({ id: docSnap.id, ...docSnap.data() }));

  // Populate color badges with labels
  const colors = [...new Set(currentVariants.map(v => v.color))];
  colors.forEach(c => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "4px";

    const badge = document.createElement("div");
    badge.className = "color-badge";
    badge.style.backgroundColor = c.toLowerCase();
    badge.dataset.color = c;

    badge.addEventListener("click", () => {
      document.querySelectorAll(".color-badge").forEach(b => b.classList.remove("selected"));
      badge.classList.add("selected");
      updateSizesForColor(c);
    });

    const label = document.createElement("span");
    label.textContent = c;
    label.style.fontSize = "0.8rem";
    label.style.color = "#333";

    wrapper.appendChild(badge);
    wrapper.appendChild(label);

    variantColorsContainer.appendChild(wrapper);
  });

  productModal.style.display = "flex";
}

// Close modal
closeProductModal.addEventListener("click", () => {
  productModal.style.display = "none";
});

// Update sizes when color selected
function updateSizesForColor(color) {
  variantSize.innerHTML = `<option value="">Select size</option>`;
  variantStock.textContent = '';

  const sizes = currentVariants.filter(v => v.color === color).map(v => v.size);
  sizes.forEach(s => {
    let opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    variantSize.appendChild(opt);
  });
}

// Update stock when size selected
variantSize.addEventListener("change", () => {
  const selectedColorBadge = document.querySelector(".color-badge.selected");
  if (!selectedColorBadge) return;

  const selectedColor = selectedColorBadge.dataset.color;
  const selectedSize = variantSize.value;

  const variant = currentVariants.find(v => v.color === selectedColor && v.size === selectedSize);
  if (variant) {
    variantStock.textContent = `Stock: ${variant.stock} (${variant.status})`;
  } else {
    variantStock.textContent = '';
  }
});

// === ADD VARIANT TO CART ===
addVariantToCart.addEventListener("click", () => {
  const selectedColorBadge = document.querySelector(".color-badge.selected");
  const color = selectedColorBadge ? selectedColorBadge.dataset.color : null;
  const size = variantSize.value;

  if (!color || !size) {
    alert("❌ Please select color and size");
    return;
  }

  const variant = currentVariants.find(v => v.color === color && v.size === size);
  if (!variant) {
    alert("❌ Invalid variant selection");
    return;
  }

  const key = `${currentProduct.name} (${color}, ${size})`;

  if (cart[key]) {
    cart[key].quantity += 1;
  } else {
    cart[key] = {
      quantity: 1,
      price: currentProduct.price,
      image: currentProduct.img,
      color,
      size
    };
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  animateCart();
  showToast(`${currentProduct.name} (${color}, ${size}) added to cart`);
  productModal.style.display = "none";
});

// === CART FUNCTIONS ===
function updateCartCount() {
  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;
}

function animateCart() {
  const cartIcon = document.querySelector('.cart-icon');
  cartIcon.style.animation = 'none';
  setTimeout(() => {
    cartIcon.style.animation = 'bounce 0.5s ease';
  }, 10);
}

window.openCheckout = function () {
  document.getElementById('checkoutModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  renderCartItems();
  calculateTotal();
};

window.closeCheckout = function () {
  document.getElementById('checkoutModal').classList.remove('active');
  document.body.style.overflow = 'auto';
};

function renderCartItems() {
  const container = document.getElementById('cartItems');
  container.innerHTML = '';

  if (Object.keys(cart).length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started!</p>
      </div>`;
    return;
  }

  Object.entries(cart).forEach(([name, item]) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="item-info">
        <div class="item-name"><img class="checkoutpic" src="${item.image}"> ${name}</div>
        <div class="item-price">₦${item.price.toFixed(2)} each</div>
      </div>
      <div class="quantity-controls">
        <button class="creasebtn" onclick="updateQuantity('${name}', -1)">-</button>
        <span>${item.quantity}</span>
        <button class="creasebtn" onclick="updateQuantity('${name}', 1)">+</button>
      </div>
      <div class="item-total">₦${(item.price * item.quantity).toFixed(2)}</div>
      <button class="removebtn" onclick="removeFromCart('${name}')">Remove</button>`;
    container.appendChild(div);
  });
}

window.updateQuantity = function (name, change) {
  if (cart[name]) {
    cart[name].quantity += change;
    if (cart[name].quantity <= 0) delete cart[name];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    calculateTotal();
  }
};

window.removeFromCart = function (name) {
  delete cart[name];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCartItems();
  calculateTotal();
  showToast(`${name} removed from cart`, true);
};

function calculateTotal() {
  const subtotal = Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.085;
  const shipping = subtotal > 0 ? 2000 : 0;
  const total = subtotal + tax + shipping;

  document.getElementById('subtotal').textContent = `₦${subtotal.toFixed(2)}`;
  document.getElementById('tax').textContent = `₦${tax.toFixed(2)}`;
  document.getElementById('shipping').textContent = subtotal > 0 ? `₦${shipping.toFixed(2)}` : 'Free';
  document.getElementById('total').textContent = `₦${total.toFixed(2)}`;
}

window.placeOrder = async function () {
  if (Object.keys(cart).length === 0) {
    alert('Cart is empty!');
    return;
  }

  const inputs = document.querySelectorAll('.form-input');
  let isValid = true;
  let formData = {};
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = 'red';
      isValid = false;
    } else {
      input.style.borderColor = '#ccc';
      formData[input.placeholder.toLowerCase()] = input.value.trim();
    }
  });

  if (!isValid) {
    alert('Fill in all fields!');
    return;
  }

  const order = {
    customer: formData,
    cart,
    total: document.getElementById('total').textContent,
    wholesalerUid,
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, 'orders'), order);
    alert('✅ Order placed!');
    cart = {};
    localStorage.removeItem('cart');
    updateCartCount();
    closeCheckout();
    inputs.forEach(input => input.value = '');
  } catch (err) {
    console.error(err);
    alert('❌ Order failed!');
  }
};

function showToast(text, error = false) {
  const toast = document.createElement('div');
  toast.textContent = text;
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${error ? '#ff6b6b' : '#4ecdc4'};
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    z-index: 10000;
    font-weight: bold;
    animation: slideInRight 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// === Animation Observer ===
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
    }
  });
}, { threshold: 0.1 });

const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to   { transform: translateX(100%); opacity: 0; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
