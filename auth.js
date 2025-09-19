import { auth, db } from "./firebaseconfig.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

/**
 * 🔹 Sign Up (Retailer or Wholesaler)
 */
export async function registerUser(email, password, role) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role,
      createdAt: new Date(),
    });

    alert("✅ Account created successfully!");
    return user;
  } catch (error) {
    handleAuthError(error, "signup");
  }
}

/**
 * 🔹 Login
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      alert(`✅ Welcome back! You are logged in as ${role}.`);
    } else {
      alert("⚠️ Account missing role info. Please contact support.");
    }

    return user;
  } catch (error) {
    handleAuthError(error, "login");
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

/**
 * 🔹 Reset Password
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("📩 Password reset email sent! Check your inbox.");
  } catch (error) {
    handleAuthError(error, "reset");
  }
}

/**
 * 🔹 Google Login
 */
export async function googleLogin() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user already has a record in Firestore
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Default new Google users to "retailer" role (you can change this logic)
      await setDoc(userRef, {
        email: user.email,
        role: "retailer",
        createdAt: new Date(),
      });
      alert("✅ Google account registered as Retailer!");
    } else {
      alert("✅ Logged in with Google!");
    }

    return user;
  } catch (error) {
    handleAuthError(error, "google");
  }
}

/**
 * 🔹 Helper: error handler
 */
function handleAuthError(error, context) {
  let message = `❌ Something went wrong during ${context}.`;

  switch (error.code) {
    case "auth/email-already-in-use":
      message = "⚠️ Email already registered.";
      break;
    case "auth/invalid-email":
      message = "⚠️ Invalid email address.";
      break;
    case "auth/weak-password":
      message = "⚠️ Weak password (min 6 chars).";
      break;
    case "auth/user-not-found":
      message = "⚠️ No account found. Please sign up.";
      break;
    case "auth/wrong-password":
      message = "⚠️ Incorrect password.";
      break;
    case "auth/popup-closed-by-user":
      message = "⚠️ Google sign-in popup was closed.";
      break;
    default:
      message = "❌ " + error.message;
  }

  alert(message);
  console.error(`[${context}] error:`, error);
}
