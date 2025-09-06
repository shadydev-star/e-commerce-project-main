import { registerUser, loginUser } from "./auth.js";
import { auth, db } from "./firebaseconfig.js";
import {
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

/**
 * 🔹 Force session persistence (no auto-login on page reload)
 */
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("✅ Session persistence set. Users must log in manually.");
  })
  .catch((err) => console.error("❌ Persistence error:", err));

/**
 * 🔹 (Optional) Force logout when visiting auth.html
 *    This ensures users always start fresh here
 */
signOut(auth).then(() => {
  console.log("🔒 User signed out when visiting auth.html");
});

/**
 * 🔹 Handle Signup
 */
document.getElementById("signupBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const role = document.getElementById("signupRole").value;

  if (!email || !password || !role) {
    alert("⚠️ Please fill in all signup fields.");
    return;
  }

  console.log("🟢 Signing up:", email, "as", role);
  await registerUser(email, password, role);
});

/**
 * 🔹 Handle Login
 */
document.getElementById("loginBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("⚠️ Please enter both email and password.");
    return;
  }

  console.log("🟢 Attempting login:", email);
  await loginUser(email, password);
});

/**
 * 🔹 Redirect after login
 */
onAuthStateChanged(auth, async (user) => {
  console.log("👀 Auth state changed:", user ? user.email : "No user");

  if (!user) return; // not logged in

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      alert("⚠️ Your account is missing role information. Please contact support.");
      console.warn("⚠️ No Firestore record for user:", user.uid);
      return;
    }

    const { role } = userDoc.data();
    console.log("📄 User role:", role);

    if (role === "retailer") {
      console.log("➡️ Redirecting to retailer.html");
      window.location.href = "retailer.html";
    } else if (role === "wholesaler") {
      console.log("➡️ Redirecting to wholesaler.html");
      window.location.href = "wholesaler.html";
    } else {
      alert("⚠️ Unknown role. Please contact support.");
      console.error("❌ Invalid role for user:", role);
    }
  } catch (err) {
    console.error("❌ Error fetching user role:", err);
    alert("❌ Failed to fetch your role. Please try again.");
  }
});
