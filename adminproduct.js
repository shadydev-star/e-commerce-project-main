// adminproduct.js
import { db, auth } from "./firebaseconfig.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Sidebar toggles (unchanged)
const menuToggle = document.getElementById("menuToggle");
const closeSidebar = document.getElementById("closeSidebar");
const sidebar = document.getElementById("side-bar");

menuToggle?.addEventListener("click", () => sidebar.classList.toggle("active"));
closeSidebar?.addEventListener("click", () => sidebar.classList.remove("active"));

// Modals (leave your existing ids in HTML)
const modal = document.getElementById("productModal");
const addBtn = document.getElementById("addProductBtn");
const closeBtn = document.getElementById("closeModal");
addBtn?.addEventListener("click", () => modal && (modal.style.display = "flex"));
closeBtn?.addEventListener("click", () => modal && (modal.style.display = "none"));
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

// Edit modal elements
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editProductForm");
const closeEditModal = document.getElementById("closeEditModal");
const editId = document.getElementById("editId");
const editName = document.getElementById("editName");
const editPrice = document.getElementById("editPrice");
const editCategory = document.getElementById("editCategory");

function formatPrice(amount) {
  if (amount == null || isNaN(amount)) return "₦0.00";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);
}

const productList = document.getElementById("productList");

function loadProducts() {
  productList.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

  const user = auth.currentUser;
  if (!user) {
    productList.innerHTML = "<tr><td colspan='5'>❌ Please log in to view products.</td></tr>";
    return;
  }

  // Read wholesaler's own products
  const productsRef = collection(db, "users", user.uid, "products");
  const q = query(productsRef, orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      productList.innerHTML = "<tr><td colspan='5'>No products found.</td></tr>";
      return;
    }

    let html = "";
    snapshot.forEach((docSnap) => {
      const product = docSnap.data() || {};
      const id = docSnap.id;
      const imgSrc = product.img || product.imageUrl || product.image || "placeholder.png";
      const priceFmt = formatPrice(product.price);

      html += `
        <tr>
          <td><img src="${imgSrc}" alt="${product.name || 'product'}" class="product-thumbnail" style="width:50px;height:50px;border-radius:6px;object-fit:cover" /></td>
          <td>${product.name || ""}</td>
          <td>${priceFmt}</td>
          <td>${product.category || ""}</td>
          <td class="action-buttons">
            <button class="manage-btn"  data-id="${id}" data-scope="user">Manage</button>
            <button class="edit-btn" data-id="${id}">Edit</button>
            <button class="delete-btn" data-id="${id}">Delete</button>
          </td>
        </tr>
      `;
    });

    productList.innerHTML = html;
    initButtons(user.uid);
  }, (err) => {
    console.error("Error loading products:", err);
    productList.innerHTML = `<tr><td colspan='5'>Error loading products: ${err.message}</td></tr>`;
  });
}

function initButtons(userUid) {
  // Manage
  document.querySelectorAll(".manage-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = e.target.getAttribute("data-id");
      const scope = e.target.getAttribute("data-scope") || "user";
      console.log("Manage click -> id:", productId, "scope:", scope);
      window.location.href = `product-details.html?id=${productId}&scope=${scope}`;
    });
  });

  // Delete
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const productId = e.target.getAttribute("data-id");
      if (!confirm("Are you sure you want to delete this product?")) return;
      try {
        await deleteDoc(doc(db, "users", userUid, "products", productId));
        alert("✅ Product deleted!");
      } catch (err) {
        console.error("Error deleting product:", err);
        alert("❌ Failed to delete product.");
      }
    });
  });

  // Edit
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const productId = e.target.getAttribute("data-id");
      try {
        const docRef = doc(db, "users", userUid, "products", productId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return alert("❌ Product not found.");
        const product = docSnap.data();
        editId.value = productId;
        editName.value = product.name || "";
        editPrice.value = product.price || "";
        editCategory.value = product.category || "";
        editModal.style.display = "flex";
      } catch (err) {
        console.error("Error loading product for edit:", err);
        alert("❌ Failed to load product.");
      }
    });
  });
}

editForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("❌ Not logged in");
  const id = editId.value;
  const updatedData = {
    name: editName.value.trim(),
    price: parseFloat(editPrice.value),
    category: editCategory.value,
  };
  try {
    const docRef = doc(db, "users", user.uid, "products", id);
    await updateDoc(docRef, updatedData);
    alert("✅ Product updated!");
    editModal.style.display = "none";
  } catch (err) {
    console.error("Error updating product:", err);
    alert("❌ Failed to update product.");
  }
});

closeEditModal?.addEventListener("click", () => { editModal.style.display = "none"; });

auth.onAuthStateChanged((user) => {
  if (user) loadProducts();
  else productList.innerHTML = "<tr><td colspan='5'>❌ Please log in to manage products.</td></tr>";
});
