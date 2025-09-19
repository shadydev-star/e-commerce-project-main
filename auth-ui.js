import { 
  registerUser, 
  loginUser, 
  resetPassword 
} from "./auth.js";
import { auth, db } from "./firebaseconfig.js";
import {
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

/**
 * 🔹 Session persistence (no auto-login on reload)
 */
setPersistence(auth, browserSessionPersistence)
  .then(() => console.log("✅ Session persistence set. Users must log in manually."))
  .catch((err) => console.error("❌ Persistence error:", err));

/**
 * 🔹 Auto sign-out when visiting auth.html
 */
signOut(auth).then(() => {
  console.log("🔒 User signed out when visiting auth.html");
});

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
    alert("⚠️ Please enter both email and password.");
    return;
  }

  await loginUser(email, password);
});

/**
 * 🔹 Forgot Password
 */
document.getElementById("forgotPasswordLink")?.addEventListener("click", () => {
  const email = prompt("Enter your email to reset password:");
  if (email) resetPassword(email);
});

/**
 * 🔹 Redirect after login
 */
onAuthStateChanged(auth, async (user) => {
  console.log("👀 Auth state changed:", user ? user.email : "No user");

  if (!user) return;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      alert("⚠️ Account missing role information. Please contact support.");
      return;
    }

    const { role } = userDoc.data();
    console.log("📄 User role:", role);

    if (role === "retailer") {
      window.location.href = "retailer.html";
    } else if (role === "wholesaler") {
      window.location.href = "wholesaler.html";
    } else {
      alert("⚠️ Unknown role. Please contact support.");
    }
  } catch (err) {
    console.error("❌ Error fetching role:", err);
    alert("❌ Failed to fetch your role. Please try again.");
  }
});
