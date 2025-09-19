import { auth, db } from "./firebaseconfig.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
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
      role,
      createdAt: new Date(),
    });

    alert("✅ Account created successfully!");
    return user;
  } catch (error) {
    let message;
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
 * 🔹 Login with Email + Password
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      console.log("Logged in as:", role);
      alert(`✅ Welcome back! You are logged in as ${role}.`);
    } else {
      alert("⚠️ Account missing role info. Please contact support.");
    }

    return user;
  } catch (error) {
    let message;
    switch (error.code) {
      case "auth/user-not-found":
        message = "⚠️ No account found with this email.";
        break;
      case "auth/wrong-password":
        message = "⚠️ Incorrect password.";
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
 * 🔹 Google Sign-In
 */
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("✅ Google login success:", user.email);

    // Check Firestore for user doc
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Default new Google users as retailers (can be updated later)
      await setDoc(userDocRef, {
        email: user.email,
        role: "retailer",
        createdAt: new Date(),
      });
      console.log("🆕 New Google user saved to Firestore.");
    }

    return user;
  } catch (error) {
    console.error("❌ Google login error:", error);
    alert("❌ " + error.message);
  }
}

/**
 * 🔹 Password Reset
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("📩 Password reset email sent! Check your inbox.");
  } catch (error) {
    console.error("❌ Reset error:", error);
    alert("❌ " + error.message);
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
