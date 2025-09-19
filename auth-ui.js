import { registerUser, loginUser } from "./auth.js";
import { auth, db } from "./firebaseconfig.js";
import {
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

import { googleLogin } from "./auth.js";

document.getElementById("googleLoginBtn")?.addEventListener("click", async () => {
  await googleLogin();
});


/**
 * 🔹 Force session persistence
 */
setPersistence(auth, browserSessionPersistence)
  .then(() => console.log("✅ Session persistence set"))
  .catch((err) => console.error("❌ Persistence error:", err));

/**
 * 🔹 Always log out when visiting auth.html
 */
signOut(auth).then(() => console.log("🔒 User signed out on auth.html"));

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
 * 🔹 Google Sign-In
 */
document.getElementById("googleSignInBtn")?.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user already has a Firestore record
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // Default role for Google sign-ins (can adjust logic)
      await setDoc(userRef, {
        email: user.email,
        role: "retailer",
        createdAt: new Date(),
      });
    }

    console.log("✅ Google login successful:", user.email);
  } catch (err) {
    console.error("❌ Google sign-in error:", err);
    alert(`Google Sign-In failed: ${err.message}`);
  }
});

/**
 * 🔹 Forgot Password
 */
document.getElementById("forgotPasswordBtn")?.addEventListener("click", async () => {
  const email = prompt("Enter your email to reset password:");
  if (!email) return;

  try {
    await sendPasswordResetEmail(auth, email);
    alert("✅ Password reset link sent to your email.");
  } catch (err) {
    console.error("❌ Password reset error:", err);
    alert(`❌ Failed to send reset email: ${err.message}`);
  }
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
      alert("⚠️ Missing role information. Please contact support.");
      return;
    }

    const { role } = userDoc.data();
    console.log("📄 User role:", role);

    if (role === "retailer") {
      window.location.href = "retailer.html?uid=" + user.uid;
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
