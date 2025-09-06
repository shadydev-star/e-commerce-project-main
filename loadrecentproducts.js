import { db } from "./firebaseconfig.js";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const recentGrid = document.getElementById("recentProducts");

function formatPrice(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
}

function renderProduct(product) {
  return `
    <div class="product-card">
      <div class="product-image">
        <img class="product-pic" src="${product.img}" alt="${product.name}" />
      </div>
      <div class="product-info">
        <div class="product-title">${product.name}<div class="product-price">${formatPrice( product.price)}</div>
        <div class="product-stock"><span>Category:</span> <span>${product.category}</span></div>
      </div>
    </div>
  `;
}

function loadRecentProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(4));

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      recentGrid.innerHTML = "<p>No recent products found.</p>";
      return;
    }

    recentGrid.innerHTML = ""; // Clear existing
    snapshot.forEach(doc => {
      const product = doc.data();
      recentGrid.innerHTML += renderProduct(product);
    });
  }, (err) => {
    console.error("Error loading products:", err);
    recentGrid.innerHTML = "<p>Failed to load products.</p>";
  });
}

loadRecentProducts();
