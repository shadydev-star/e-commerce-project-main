import { db } from './firebaseconfig.js';
import { collection, onSnapshot, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// === Initial Setup ===
let cart = JSON.parse(localStorage.getItem('cart')) || {};
updateCartCount();

// === Loading Animation ===
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loading').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('loading').style.display = 'none';
    }, 500);
  }, 1500);
});

// === Navbar Scroll Shadow ===
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar.classList.toggle('scrolled', window.scrollY > 100);
});

// === Hero Slider ===
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');

setInterval(() => {
  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add('active');
}, 4000);

// === Featured Product Slider ===
let currentFeatured = 0;
const featuredSlides = document.querySelectorAll('.featured-slide');
const featuredDots = document.querySelectorAll('.slider-dot');

window.changeFeaturedSlide = function (index) {
  featuredSlides[currentFeatured].classList.remove('active');
  featuredDots[currentFeatured].classList.remove('active');
  currentFeatured = index;
  featuredSlides[currentFeatured].classList.add('active');
  featuredDots[currentFeatured].classList.add('active');
};

setInterval(() => {
  const nextIndex = (currentFeatured + 1) % featuredSlides.length;
  changeFeaturedSlide(nextIndex);
}, 5000);

// === Fetch Products from Firestore ===
function fetchProducts() {
  const productGrid = document.querySelector('.product-grid');
  const productsRef = collection(db, 'products');

  onSnapshot(productsRef, (snapshot) => {
    productGrid.innerHTML = '';
    snapshot.forEach(doc => {
      const product = doc.data();
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-image">
          <img class="product-pic" src="${product.img}" alt="${product.name}">
        </div>
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-price">$${product.price.toFixed(2)}</p>
          <button class="add-to-cart">Add to Cart</button>
        </div>
      `;
      card.querySelector('.add-to-cart').addEventListener('click', () => addToCart(product));
      productGrid.appendChild(card);

      // Animate on scroll
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      observer.observe(card);
    });
  });
}
fetchProducts();

// === Add to Cart ===
function addToCart(product) {
  if (cart[product.name]) {
    cart[product.name].quantity += 1;
  } else {
    cart[product.name] = {
      quantity: 1,
      price: product.price,
      image: product.img
    };
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  animateCart();
  showToast(`${product.name} added to cart`);
}

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

// === Cart Modal ===
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

// === Render Cart Items ===
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
        <div class="item-name"><img class="checkoutpic" src="${item.image}" > ${name}</div>
        <div class="item-price">$${item.price.toFixed(2)} each</div>
      </div>
      <div class="quantity-controls">
        <button class="creasebtn" onclick="updateQuantity('${name}', -1)">-</button>
        <span>${item.quantity}</span>
        <button class="creasebtn" onclick="updateQuantity('${name}', 1)">+</button>
      </div>
      <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
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

// === Totals ===
function calculateTotal() {
  const subtotal = Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.085;
  const shipping = subtotal > 0 ? 9.99 : 0;
  const total = subtotal + tax + shipping;

  document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('shipping').textContent = subtotal > 0 ? `$${shipping.toFixed(2)}` : 'Free';
  document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// === Place Order ===
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
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, 'orders'), order);
    alert('Order placed!');
    cart = {};
    localStorage.removeItem('cart');
    updateCartCount();
    closeCheckout();
    inputs.forEach(input => input.value = '');
  } catch (err) {
    console.error(err);
    alert('Order failed!');
  }
};

// === Toast Notification ===
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

// === Smooth Scroll ===
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    target?.scrollIntoView({ behavior: 'smooth' });
  });
});

// === Product Scroll Animation ===
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
