import { registerUser, loginUser, resetPassword } from "./auth.js";
import { auth, db } from "./firebaseconfig.js";
import {
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

/**
 * 🔹 Force session persistence
 */
setPersistence(auth, browserSessionPersistence)
  .then(() => console.log("✅ Session persistence set."))
  .catch((err) => console.error("❌ Persistence error:", err));

/**
 * 🔹 Always logout when opening auth.html
 */
signOut(auth).then(() => console.log("🔒 Signed out on auth page"));

/**
 * 🔹 Signup
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

  await registerUser(email, password, role);
});

/**
 * 🔹 Login
 */
document.getElementById("loginBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("⚠️ Enter both email and password.");
    return;
  }

  await loginUser(email, password);
});

/**
 * 🔹 Reset Password (form version)
 */
document.getElementById("resetBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("resetEmail").value.trim();

  if (!email) {
    alert("⚠️ Enter your email to reset password.");
    return;
  }

  await resetPassword(email);
});

/**
 * 🔹 Redirect after login
 */
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      alert("⚠️ Missing role info. Contact support.");
      return;
    }

    const { role } = userDoc.data();
    if (role === "retailer") {
      window.location.href = "retailer.html";
    } else if (role === "wholesaler") {
      window.location.href = "wholesaler.html";
    } else {
      alert("⚠️ Unknown role. Contact support.");
    }
  } catch (err) {
    console.error("❌ Fetch role error:", err);
    alert("❌ Failed to fetch user role.");
  }
});
