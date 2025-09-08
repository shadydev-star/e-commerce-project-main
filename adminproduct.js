import { db, auth } from "./firebaseconfig.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Sidebar toggle
const menuToggle = document.getElementById("menuToggle");
const closeSidebar = document.getElementById("closeSidebar");
const sidebar = document.getElementById("side-bar");

menuToggle?.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});
closeSidebar?.addEventListener("click", () => {
  sidebar.classList.remove("active");
});

// Modal logic (Add Product)
const modal = document.getElementById("productModal");
const addBtn = document.getElementById("addProductBtn");
const closeBtn = document.getElementById("closeModal");

addBtn?.addEventListener("click", () => {
  modal.style.display = "flex";
});
closeBtn?.addEventListener("click", () => {
  modal.style.display = "none";
});
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// Edit Product Modal elements
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editProductForm");
const closeEditModal = document.getElementById("closeEditModal");

const editId = document.getElementById("editId");
const editName = document.getElementById("editName");
const editPrice = document.getElementById("editPrice");
const editCategory = document.getElementById("editCategory");

// Price formatter (₦12,500.00)
function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN"
  }).format(amount);
}

// Product Table
const productList = document.getElementById("productList");

function loadProducts() {
  productList.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

  const user = auth.currentUser;
  if (!user) {
    productList.innerHTML = "<tr><td colspan='5'>❌ Please log in to view products.</td></tr>";
    return;
  }

  // ✅ Query wholesaler’s own products
  const productsRef = collection(doc(db, "users", user.uid), "products");
  const q = query(productsRef, orderBy("createdAt", "desc"));

  onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        productList.innerHTML = "<tr><td colspan='5'>No products found.</td></tr>";
        return;
      }

      let html = "";
      snapshot.forEach((docSnap) => {
        const product = docSnap.data();
        const id = docSnap.id;

        html += `
          <tr>
            <td><img src="${product.img}" alt="${product.name}" class="product-thumbnail" /></td>
            <td>${product.name}</td>
            <td>${formatPrice(product.price)}</td>
            <td>${product.category}</td>
            <td class="action-buttons">
              <button class="edit-btn" data-id="${id}">Edit</button>
              <button class="delete-btn" data-id="${id}">Delete</button>
            </td>
          </tr>
        `;
      });

      productList.innerHTML = html;
      initButtons(user.uid);
    },
    (error) => {
      console.error("Error loading products:", error);
      productList.innerHTML = `<tr><td colspan='5'>Error loading products: ${error.message}</td></tr>`;
    }
  );
}

// Add event listeners to Edit & Delete buttons
function initButtons(userUid) {
  // 🗑 DELETE
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const productId = e.target.getAttribute("data-id");
      const confirmDelete = confirm("Are you sure you want to delete this product?");
      if (!confirmDelete) return;

      try {
        await deleteDoc(doc(db, "users", userUid, "products", productId));
        alert("✅ Product deleted!");
      } catch (err) {
        console.error("Error deleting product:", err);
        alert("❌ Failed to delete product.");
      }
    });
  });

  // ✏️ EDIT
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const productId = e.target.getAttribute("data-id");
      try {
        const docRef = doc(db, "users", userUid, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const product = docSnap.data();
          editId.value = productId;
          editName.value = product.name;
          editPrice.value = product.price;
          editCategory.value = product.category;
          editModal.style.display = "flex";
        } else {
          alert("❌ Product not found.");
        }
      } catch (err) {
        console.error("Error loading product:", err);
        alert("❌ Failed to load product.");
      }
    });
  });
}

// Save edited product
editForm.addEventListener("submit", async (e) => {
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

// Close edit modal
closeEditModal.addEventListener("click", () => {
  editModal.style.display = "none";
});

// Start loading products after auth is ready
auth.onAuthStateChanged((user) => {
  if (user) {
    loadProducts();
  } else {
    productList.innerHTML = "<tr><td colspan='5'>❌ Please log in to manage products.</td></tr>";
  }
});
