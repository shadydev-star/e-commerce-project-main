// admin-add-product.js
import { db, auth, storage } from "./firebaseconfig.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import {
  ref as storageRefFn,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

const addProductForm = document.getElementById("addProductForm");
const statusEl = document.getElementById("status");
const imageInput = document.getElementById("image");
const imagePreviewBox = document.getElementById("imagePreviewBox");
const removeImageBtn = document.getElementById("removeImageBtn");

// Image preview handlers (keep your existing behavior)
imagePreviewBox?.addEventListener("click", () => imageInput.click());
imageInput?.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // graceful fallback if the span is not present
      const span = imagePreviewBox.querySelector("span");
      if (span) span.style.display = "none";
      imagePreviewBox.style.backgroundImage = `url(${e.target.result})`;
      removeImageBtn.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});
removeImageBtn?.addEventListener("click", () => {
  imageInput.value = "";
  imagePreviewBox.style.backgroundImage = "none";
  const span = imagePreviewBox.querySelector("span");
  if (span) span.style.display = "block";
  removeImageBtn.style.display = "none";
});

// Submit handler
addProductForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "Adding product...";

  try {
    const user = auth.currentUser;
    if (!user) {
      statusEl.textContent = "Please log in to add products.";
      return window.location.href = "auth.html";
    }

    const nameEl = document.getElementById("name");
    const priceEl = document.getElementById("price");
    const categoryEl = document.getElementById("category");

    const name = nameEl?.value?.trim();
    const price = parseFloat(priceEl?.value);
    const category = categoryEl?.value;
    const imageFile = imageInput.files[0];

    if (!name || isNaN(price) || !category || !imageFile) {
      statusEl.textContent = "Please fill all fields and add an image.";
      return;
    }

    statusEl.textContent = "Uploading image...";
    const storagePath = `users/${user.uid}/products/${Date.now()}_${imageFile.name}`;
    const sRef = storageRefFn(storage, storagePath);
    await uploadBytes(sRef, imageFile);
    const imgUrl = await getDownloadURL(sRef);

    statusEl.textContent = "Saving product to Firestore...";

    // Save under the wholesaler's subcollection: users/{uid}/products
    const productsRef = collection(db, "users", user.uid, "products");
    const docRef = await addDoc(productsRef, {
      name,
      price,
      category,
      img: imgUrl,
      createdAt: serverTimestamp(),
    });

    statusEl.textContent = `✅ Product added (ID: ${docRef.id})`;
    addProductForm.reset();
    imagePreviewBox.style.backgroundImage = "none";
    const span = imagePreviewBox.querySelector("span");
    if (span) span.style.display = "block";
    removeImageBtn.style.display = "none";

    // redirect back to products page
    setTimeout(() => {
      window.location.href = "admin-products.html";
    }, 1200);
  } catch (err) {
    console.error("Error adding product:", err);
    statusEl.textContent = `❌ Error: ${err.message || err}`;
  }
});
