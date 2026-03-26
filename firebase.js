import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,GoogleAuthProvider,signInWithPopup  } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyCOfjNzzTzudMU3tMFSsiMgKcS-ILwY-UM",
  authDomain: "e-commerce-f90d7.firebaseapp.com",
  projectId: "e-commerce-f90d7",
  storageBucket: "e-commerce-f90d7.firebasestorage.app",
  messagingSenderId: "928726320293",
  appId: "1:928726320293:web:179902a66ac60d10d4794c",
  measurementId: "G-SLYS1VDF44"
};

const app = initializeApp(firebaseConfig);

document.addEventListener("DOMContentLoaded", () => {
    const signupBtn = document.getElementById("signupBtn");
    const signinBtn = document.getElementById("signup");

    if (signupBtn) {
        signupBtn.addEventListener("click", signup);
    }
    if (signinBtn) {
        signinBtn.addEventListener("click", signin);
    }
});


function signup(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const auth = getAuth();

    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert("Account created ✅");
            window.location.href = "login.html";
        })
        .catch((error) => {
            alert(error.message);
        });
}

function signin(e) {
    e.preventDefault();
    const semail = document.getElementById("semail").value;
    const spassword = document.getElementById("spassword").value;

    const auth = getAuth(); 

    signInWithEmailAndPassword(auth, semail, spassword)
        .then((userCredential) => {
            alert("Login successful ✅");
            window.location.href = "index.html";
        })
        .catch((error) => {
            alert(error.message);
        });
}

const provider = new GoogleAuthProvider();

const auth = getAuth();

document.addEventListener("DOMContentLoaded", () => {
    const googleBtn = document.getElementById("googleBtn");
    googleBtn.addEventListener("click", googleSignIn);
});

function googleSignIn(e) {
    e.preventDefault()
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;

            alert("Logged in with Google ✅");

            console.log(user);

            // redirect
            location.assign("index.html");
        })
        .catch((error) => {
            alert(error.message);
        });
}
