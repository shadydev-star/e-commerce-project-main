import { db, auth } from "./firebaseconfig.js";
import {
  doc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Cloudinary config
const CLOUD_NAME = "dhaxvswrr";
const UPLOAD_PRESET = "unsigned_ecommerce";

// DOM elements
const form = document.getElementById("addProductForm");
const statusText = document.getElementById("status");
const imageInput = document.getElementById("image");
const previewBox = document.getElementById("imagePreviewBox");
const removeBtn = document.getElementById("removeImageBtn");

let currentFile = null;

// 🖼️ Image Preview & Drag-and-Drop
previewBox.addEventListener("dragover", (e) => {
  e.preventDefault();
  previewBox.style.borderColor = "#3498db";
});

previewBox.addEventListener("dragleave", () => {
  previewBox.style.borderColor = "#ccc";
});

previewBox.addEventListener("drop", (e) => {
  e.preventDefault();
  previewBox.style.borderColor = "#ccc";
  const file = e.dataTransfer.files[0];
  if (file) {
    imageInput.files = e.dataTransfer.files;
    showPreview(file);
  }
});

previewBox.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) showPreview(file);
});

removeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  imageInput.value = "";
  currentFile = null;
  previewBox.innerHTML = `<span>Click or drag image here</span>`;
  removeBtn.style.display = "none";
});

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewBox.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    previewBox.appendChild(removeBtn);
    removeBtn.style.display = "block";
  };
  reader.readAsDataURL(file);
  currentFile = file;
}

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed (${res.status})`);

  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload failed - no URL returned");

  return data.secure_url;
}

// 🧠 Submit Handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = form.name.value.trim();
  const price = parseFloat(form.price.value);
  const category = form.category.value;
  const imageFile = imageInput.files[0];

  if (!name || isNaN(price) || !category || !imageFile) {
    statusText.textContent = "❌ Please fill all fields and add an image.";
    statusText.style.color = "red";
    return;
  }

  try {
    statusText.textContent = "⏳ Uploading image to Cloudinary...";
    statusText.style.color = "#000";

    const imageUrl = await uploadToCloudinary(imageFile);

    statusText.textContent = "⏳ Saving product to database...";

    // ✅ Ensure user is logged in
    const user = auth.currentUser;
    if (!user) throw new Error("You must be logged in to upload products");

    // ✅ Reference wholesaler's products subcollection
    const productsRef = collection(doc(db, "users", user.uid), "products");

    await addDoc(productsRef, {
      name,
      price,
      category,
      img: imageUrl,
      createdAt: serverTimestamp()
    });

    statusText.innerHTML = `
      ✅ Product added successfully!
      <div class="spinner" style="margin-top:10px;"></div>
    `;
    statusText.style.color = "green";

    form.reset();
    previewBox.innerHTML = `<span>Click or drag image here</span>`;
    removeBtn.style.display = "none";

    // Optional: disable form during redirect
    form.querySelectorAll("input, select, button").forEach(el => el.disabled = true);

    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "admin-products.html";
    }, 1800);

  } catch (error) {
    console.error("Error adding product:", error);
    statusText.textContent = `❌ Error: ${error.message}`;
    statusText.style.color = "red";
  }
});
