import { db } from "./js/firebase-config.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // Sidebar toggle logic
  const menuToggle = document.getElementById("menuToggle");
  const closeSidebar = document.getElementById("closeSidebar");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");

  menuToggle?.addEventListener("click", () => {
    sidebar.classList.add("active");
    mainContent.classList.add("shifted");
    closeSidebar.style.display = "block";
  });

  closeSidebar?.addEventListener("click", () => {
    sidebar.classList.remove("active");
    mainContent.classList.remove("shifted");
    closeSidebar.style.display = "none";
  });

  document.addEventListener("click", (e) => {
    if (
      sidebar.classList.contains("active") &&
      !sidebar.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      sidebar.classList.remove("active");
      mainContent.classList.remove("shifted");
      closeSidebar.style.display = "none";
    }
  });

  // Load recent products
  const productsGrid = document.querySelector(".products-grid");

  function renderProducts(products) {
    if (!productsGrid) return;

    productsGrid.innerHTML = ""; // Clear existing items

    products.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";

      productCard.innerHTML = `
        <div class="product-image">
          ${product.img ? `<img class="product-pic" src="${product.img}" alt="${product.name}">` : `<i class="fas fa-box"></i>`}
        </div>
        <div class="product-info">
          <div class="product-title">${product.name}</div>
          <div class="product-price">$${Number(product.price).toFixed(2)}</div>
          <div class="product-stock"><span>Category:</span> <span>${product.category}</span></div>
        </div>
      `;

      productsGrid.appendChild(productCard);
    });
  }

  function loadRecentProducts() {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
      const products = [];
      snapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      renderProducts(products.slice(0, 4)); // Show only the 4 most recent
    }, (err) => {
      console.error("Error loading products:", err);
    });
  }

  loadRecentProducts();
});
