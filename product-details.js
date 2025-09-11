// product-details.js
import { db, auth } from "./firebaseconfig.js";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// URL params
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
let scope = params.get("scope"); // "user" or "top"

if (!productId) {
  alert("❌ No product selected.");
  window.location.href = "admin-products.html";
}

// DOM elements
const productNameEl = document.getElementById("productName");
const productCategoryEl = document.getElementById("productCategory");
const productPriceEl = document.getElementById("productPrice");
const productImageEl = document.getElementById("productImage");
const variantListEl = document.getElementById("variantList");

// Variant form + modal
const variantForm = document.getElementById("variantForm");
const variantColor = document.getElementById("variantColor");
const variantSize = document.getElementById("variantSize");
const variantStock = document.getElementById("variantStock");
const variantStatus = document.getElementById("variantStatus");

const addVariantBtn = document.getElementById("addVariantBtn");
const variantModal = document.getElementById("variantModal");
const closeVariantModal = document.getElementById("closeVariantModal");
const variantModalTitle = document.getElementById("variantModalTitle");

let productDocRef = null;
let variantsCollectionRef = null;

function logDebug(...args) {
  console.debug("[product-details]", ...args);
}

// === Modal controls ===
addVariantBtn?.addEventListener("click", () => {
  variantModalTitle.textContent = "Add Variant";
  variantForm.reset();
  variantModal.style.display = "flex";
});

closeVariantModal?.addEventListener("click", () => {
  variantModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === variantModal) {
    variantModal.style.display = "none";
  }
});

// === Load product + variants ===
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    alert("❌ Please log in to manage products.");
    window.location.href = "auth.html";
    return;
  }

  if (!scope) scope = "user";

  try {
    if (scope === "user") {
      productDocRef = doc(db, "users", user.uid, "products", productId);
      variantsCollectionRef = collection(
        db,
        "users",
        user.uid,
        "products",
        productId,
        "variants"
      );
    } else {
      productDocRef = doc(db, "products", productId);
      variantsCollectionRef = collection(db, "products", productId, "variants");
    }

    logDebug("Trying productRef path:", productDocRef.path);
    const snap = await getDoc(productDocRef);

    if (!snap.exists()) {
      if (scope === "user") {
        console.warn("Not found under user scope; trying top-level...");
        productDocRef = doc(db, "products", productId);
        variantsCollectionRef = collection(db, "products", productId, "variants");
        const snap2 = await getDoc(productDocRef);
        if (!snap2.exists()) {
          alert("❌ Product not found.");
          window.location.href = "admin-products.html";
          return;
        }
        displayProduct(snap2.data());
      } else {
        alert("❌ Product not found.");
        window.location.href = "admin-products.html";
        return;
      }
    } else {
      displayProduct(snap.data());
    }

    startListeningVariants();
  } catch (err) {
    console.error("Error loading product details:", err);
    alert("❌ Failed to load product details. See console for details.");
  }
});

function displayProduct(product) {
  const imgSrc = product.img || product.imageUrl || "placeholder.png";
  logDebug("Displaying product:", productId, product);

  if (productNameEl) productNameEl.textContent = product.name || "Unnamed";
  if (productCategoryEl) productCategoryEl.textContent = product.category || "";
  if (productPriceEl)
    productPriceEl.textContent =
      product.price != null ? Number(product.price).toLocaleString() : "";
  if (productImageEl) productImageEl.src = imgSrc;
}

// === Variants ===
function startListeningVariants() {
  if (!variantsCollectionRef) return;

  onSnapshot(
    variantsCollectionRef,
    (snap) => {
      if (snap.empty) {
        variantListEl.innerHTML =
          "<tr><td colspan='5'>No variants yet.</td></tr>";
        return;
      }

      let html = "";
      snap.forEach((vsnap) => {
        const v = vsnap.data();
        const vid = vsnap.id;
        html += `
          <tr>
            <td>${v.color || ""}</td>
            <td>${v.size || ""}</td>
            <td>${v.stock != null ? v.stock : ""}</td>
            <td>${v.status || ""}</td>
            <td>
              <button class="edit-variant" data-id="${vid}">Edit</button>
              <button class="delete-variant" data-id="${vid}">Delete</button>
            </td>
          </tr>
        `;
      });

      variantListEl.innerHTML = html;
      attachVariantButtons();
    },
    (err) => {
      console.error("Error listening to variants:", err);
    }
  );
}

// Add variant
variantForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!variantsCollectionRef) return alert("Product not loaded yet.");

  const color = variantColor.value.trim();
  const size = variantSize.value.trim();
  const stock = parseInt(variantStock.value, 10);
  const status = variantStatus.value;

  if (!color || !size || isNaN(stock)) {
    return alert("Please fill all fields.");
  }

  try {
    await addDoc(variantsCollectionRef, {
      color,
      size,
      stock,
      status,
    });
    variantForm.reset();
    variantModal.style.display = "none"; // ✅ Close after save
    alert("✅ Variant added!");
  } catch (err) {
    console.error("Error adding variant:", err);
    alert("❌ Failed to add variant.");
  }
});

// Attach buttons for edit/delete
function attachVariantButtons() {
  document.querySelectorAll(".delete-variant").forEach((btn) => {
    btn.onclick = handleDeleteVariant;
  });

  document.querySelectorAll(".edit-variant").forEach((btn) => {
    btn.onclick = handleEditVariant;
  });
}

async function handleDeleteVariant(e) {
  const id = e.target.getAttribute("data-id");
  if (!confirm("Delete this variant?")) return;

  try {
    const variantDocRef =
      scope === "user"
        ? doc(
            db,
            "users",
            auth.currentUser.uid,
            "products",
            productId,
            "variants",
            id
          )
        : doc(db, "products", productId, "variants", id);

    await deleteDoc(variantDocRef);
    alert("✅ Variant deleted!");
  } catch (err) {
    console.error("Error deleting variant:", err);
    alert("❌ Failed to delete variant.");
  }
}

async function handleEditVariant(e) {
  const id = e.target.getAttribute("data-id");
  const newStock = prompt("Enter new stock value:");
  if (!newStock || isNaN(newStock)) return;

  try {
    const variantDocRef =
      scope === "user"
        ? doc(
            db,
            "users",
            auth.currentUser.uid,
            "products",
            productId,
            "variants",
            id
          )
        : doc(db, "products", productId, "variants", id);

    await updateDoc(variantDocRef, { stock: parseInt(newStock, 10) });
    alert("✅ Variant updated!");
  } catch (err) {
    console.error("Error updating variant:", err);
    alert("❌ Failed to update variant.");
  }
}
