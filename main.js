import { db } from "./firebaseconfig.js";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // Sidebar code here

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




  // Product loading code here



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
        <div class="product-title">${product.name}</div>
        <div class="product-price">${formatPrice( product.price)}</div>
        <div class="product-stock"><span>Category:</span> <span>${product.category}</span></div>
      </div>
    </div>
  `;
}

function loadRecentProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(5));

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


});
