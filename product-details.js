// retailer.js
import { db } from './firebaseconfig.js';
import {
  doc,
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  runTransaction,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// === Initial Setup ===
let cart = JSON.parse(localStorage.getItem('cart')) || {};
updateCartCount();

const urlParams = new URLSearchParams(window.location.search);
const wholesalerUid = urlParams.get("uid");

if (!wholesalerUid) {
  document.querySelector(".product-grid").innerHTML = `
    <p style="text-align:center; padding:20px;">❌ No wholesaler selected. Please use a valid retail link.</p>
  `;
  document.getElementById("loading").style.display = "none";
} else {
  fetchProducts(wholesalerUid);
}

// === Fetch Products ===
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
          <button class="view-detail">View Details</button>
        </div>
      `;
      card.querySelector('.view-detail').addEventListener('click', () => openProductModal(product));
      productGrid.appendChild(card);

      // Scroll animation
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      observer.observe(card);
    });
  }, (err) => {
    console.error("❌ Error fetching products:", err);
    if (loader) loader.style.display = "none";
    productGrid.innerHTML = `<p class="no-products">Failed to load products.</p>`;
  });
}

// === Product Detail Modal ===
const productDetailModal = document.getElementById('productDetailModal');
const closeProductModal = document.getElementById('closeProductModal');
let selectedProduct = null;
let selectedColor = null;
let selectedSize = null;

function openProductModal(product) {
  selectedProduct = product;

  document.getElementById('detailImage').src = product.img;
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailPrice').textContent = Number(product.price).toFixed(2);
  document.getElementById('detailCategory').textContent = product.category;

  // Clear old variants
  document.getElementById('variantColors').innerHTML = '';
  document.getElementById('variantSizes').innerHTML = '';
  document.getElementById('variantStock').textContent = '';

  // Load variants subcollection
  const variantsRef = collection(doc(db, "users", wholesalerUid, "products", product.id), "variants");

  onSnapshot(variantsRef, (snapshot) => {
    const colorsSet = new Set();
    const sizesSet = new Set();

    snapshot.forEach(docSnap => {
      const variant = docSnap.data();
      if (variant.color) colorsSet.add(variant.color);
      if (variant.size) sizesSet.add(variant.size);
    });

    // Render color badges
    colorsSet.forEach(color => {
      const badge = document.createElement('div');
      badge.className = 'color-badge';
      badge.textContent = color;
      badge.addEventListener('click', () => {
        selectedColor = color;
        document.querySelectorAll('.color-badge').forEach(el => el.classList.remove('selected'));
        badge.classList.add('selected');
        updateStockDisplay(snapshot);
      });
      document.getElementById('variantColors').appendChild(badge);
    });

    // Render size badges
    sizesSet.forEach(size => {
      const badge = document.createElement('div');
      badge.className = 'size-badge';
      badge.textContent = size;
      badge.addEventListener('click', () => {
        selectedSize = size;
        document.querySelectorAll('.size-badge').forEach(el => el.classList.remove('selected'));
        badge.classList.add('selected');
        updateStockDisplay(snapshot);
      });
      document.getElementById('variantSizes').appendChild(badge);
    });
  });

  productDetailModal.style.display = 'flex';
}

function updateStockDisplay(snapshot) {
  let stockMsg = "Select color and size";
  snapshot.forEach(docSnap => {
    const variant = docSnap.data();
    if (variant.color === selectedColor && variant.size === selectedSize) {
      stockMsg = variant.status === "available"
        ? `In stock (${variant.stock} left)`
        : "Out of stock";
    }
  });
  document.getElementById('variantStock').textContent = stockMsg;
}

closeProductModal.addEventListener('click', () => {
  productDetailModal.style.display = 'none';
  selectedProduct = null;
  selectedColor = null;
  selectedSize = null;
});

// === Add Variant to Cart ===
document.getElementById('addVariantToCart').addEventListener('click', () => {
  if (!selectedProduct || !selectedColor || !selectedSize) {
    alert("Please select color and size.");
    return;
  }

  const key = `${selectedProduct.name} (${selectedColor}, ${selectedSize})`;

  if (cart[key]) {
    cart[key].quantity += 1;
  } else {
    cart[key] = {
      quantity: 1,
      price: selectedProduct.price,
      image: selectedProduct.img,
      color: selectedColor,
      size: selectedSize,
      productId: selectedProduct.id // ✅ Save productId for checkout
    };
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showToast(`${selectedProduct.name} (${selectedColor}, ${selectedSize}) added to cart`);
  productDetailModal.style.display = 'none';
});

// === Cart Logic ===
function updateCartCount() {
  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;
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

// Render Cart Items
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
        <img class="checkoutpic" src="${item.image}">
        <div class="item-details">
          <strong>${currentProductName(name)}</strong>
          <small>Color: ${item.color} | Size: ${item.size}</small>
        </div>
      </div>
      <div class="item-price">₦${item.price.toFixed(2)} each</div>
      <div class="quantity-controls">
        <button onclick="updateQuantity('${name}', -1)">-</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity('${name}', 1)">+</button>
      </div>
      <div class="item-total">₦${(item.price * item.quantity).toFixed(2)}</div>
      <button class="removebtn" onclick="removeFromCart('${name}')">Remove</button>
    `;
    container.appendChild(div);
  });
}

function currentProductName(fullName) {
  return fullName.split(" (")[0];
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

// Totals
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

// === Place Order with Transaction ===
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

  try {
    await runTransaction(db, async (transaction) => {
      for (const [name, item] of Object.entries(cart)) {
        const productRef = doc(db, "users", wholesalerUid, "products", item.productId);
        const variantsRef = collection(productRef, "variants");

        const variantSnap = await getDocs(query(
          variantsRef,
          where("color", "==", item.color),
          where("size", "==", item.size)
        ));
        if (variantSnap.empty) throw new Error(`Variant not found for ${name}`);

        const variantDoc = variantSnap.docs[0];
        const variantRef = variantDoc.ref;
        const variantData = (await transaction.get(variantRef)).data();

        if (!variantData) throw new Error(`Variant ${name} not found`);
        if (variantData.stock < item.quantity) {
          throw new Error(`❌ Not enough stock for ${name}. Only ${variantData.stock} left.`);
        }

        // Deduct stock (only applied if whole transaction succeeds)
        transaction.update(variantRef, {
          stock: variantData.stock - item.quantity,
          status: variantData.stock - item.quantity > 0 ? "available" : "out"
        });
      }

      // Save order document
      const ordersRef = collection(db, 'orders');
      transaction.set(doc(ordersRef), {
        customer: formData,
        cart,
        total: document.getElementById('total').textContent,
        wholesalerUid,
        createdAt: serverTimestamp()
      });
    });

    alert('✅ Order placed!');
    cart = {};
    localStorage.removeItem('cart');
    updateCartCount();
    closeCheckout();
    inputs.forEach(input => input.value = '');

  } catch (err) {
    console.error("❌ Order failed:", err);
    alert(`❌ Order failed: ${err.message}`);
  }
};

// Toast
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

// Scroll Animation
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
