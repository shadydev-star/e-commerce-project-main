import { auth, db } from "./firebaseconfig.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

/**
 * 🔹 Sign Up (Retailer or Wholesaler)
 */
export async function registerUser(email, password, role) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Always save role in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: role, // "retailer" or "wholesaler"
      createdAt: new Date(),
    });

    alert("✅ Account created successfully!");
    return user;
  } catch (error) {
    let message = "❌ Something went wrong. Please try again.";

    switch (error.code) {
      case "auth/email-already-in-use":
        message = "⚠️ This email is already registered. Please log in instead.";
        break;
      case "auth/invalid-email":
        message = "⚠️ Invalid email address. Please check and try again.";
        break;
      case "auth/weak-password":
        message = "⚠️ Password is too weak. Use at least 6 characters.";
        break;
      default:
        message = "❌ " + error.message;
    }

    alert(message);
    console.error("Signup error:", error);
  }
}

/**
 * 🔹 Login
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch role from Firestore (must exist since Option 1 is enforced)
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      console.log("Logged in as:", role);
      alert(`✅ Welcome back! You are logged in as ${role}.`);
    } else {
      console.warn("⚠️ User logged in but has no Firestore record.");
      alert("⚠️ Account is missing role information. Please contact support.");
    }

    return user;
  } catch (error) {
    let message = "❌ Failed to log in. Please try again.";

    switch (error.code) {
      case "auth/user-not-found":
        message = "⚠️ No account found with this email. Please sign up first.";
        break;
      case "auth/wrong-password":
        message = "⚠️ Incorrect password. Please try again.";
        break;
      case "auth/invalid-email":
        message = "⚠️ Invalid email format.";
        break;
      default:
        message = "❌ " + error.message;
    }

    alert(message);
    console.error("Login error:", error);
  }
}

/**
 * 🔹 Logout
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    alert("👋 Logged out successfully!");
  } catch (error) {
    console.error("Logout error:", error);
    alert("❌ Failed to log out. Please try again.");
  }
}
