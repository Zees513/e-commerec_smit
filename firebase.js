import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
    getDatabase,
    onValue,
    push,
    ref
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCOfjNzzTzudMU3tMFSsiMgKcS-ILwY-UM",
    authDomain: "e-commerce-f90d7.firebaseapp.com",
    databaseURL: "https://e-commerce-f90d7-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "e-commerce-f90d7",
    storageBucket: "e-commerce-f90d7.firebasestorage.app",
    messagingSenderId: "928726320293",
    appId: "1:928726320293:web:179902a66ac60d10d4794c",
    measurementId: "G-SLYS1VDF44"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);
const productsRef = ref(database, "products");
let allProducts = [];
let activeFilter = "All";

document.addEventListener("DOMContentLoaded", () => {
    setupAuth();
    setupGoogleAuth();
    setupProductModal();
    setupProductForm();
    setupProductFilters();
    setupSaleCountdown();
    subscribeToProducts();
});

function setupAuth() {
    const signupBtn = document.getElementById("signupBtn");
    const signinBtn = document.getElementById("signup");

    if (signupBtn) {
        signupBtn.addEventListener("click", signup);
    }

    if (signinBtn) {
        signinBtn.addEventListener("click", signin);
    }
}

function setupGoogleAuth() {
    const googleBtn = document.getElementById("googleBtn");

    if (googleBtn) {
        googleBtn.addEventListener("click", googleSignIn);
    }
}

function setupProductModal() {
    const openBtn = document.getElementById("openAddProductModalBtn");
    const modal = document.getElementById("addProductModal");
    const closeBtn = modal?.querySelector(".close-modal");

    if (!openBtn || !modal || !closeBtn) {
        return;
    }

    openBtn.addEventListener("click", (event) => {
        event.preventDefault();
        modal.style.display = "block";
    });

    closeBtn.addEventListener("click", () => {
        closeProductModal();
    });

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeProductModal();
        }
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeProductModal();
        }
    });
}

function setupProductForm() {
    const form = document.getElementById("addProductForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const message = document.getElementById("productFormMessage");

        const product = {
            name: document.getElementById("prodName")?.value.trim(),
            price: Number(document.getElementById("prodPrice")?.value),
            description: document.getElementById("prodDesc")?.value.trim(),
            imageUrl: document.getElementById("prodImage")?.value.trim(),
            category: normalizeCategory(document.getElementById("prodCategory")?.value),
            createdAt: Date.now()
        };

        if (!product.name || !product.price || !product.description || !product.imageUrl || !product.category) {
            setMessage(message, "Please fill all product fields.", "error");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Saving...";
        setMessage(message, "Saving product...", "");

        try {
            await push(productsRef, product);
            form.reset();
            setMessage(message, "Product saved successfully.", "success");

            setTimeout(() => {
                closeProductModal();
                clearMessage(message);
            }, 800);
        } catch (error) {
            setMessage(message, error.message || "Failed to save product.", "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Add Product";
        }
    });
}

function setupProductFilters() {
    const filterButtons = document.querySelectorAll("[data-filter]");

    if (!filterButtons.length) {
        return;
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const nextFilter = normalizeCategory(button.dataset.filter || "All");
            activeFilter = nextFilter;
            syncFilterUI();
            renderProducts();
        });
    });

    syncFilterUI();
}

function setupSaleCountdown() {
    const daysValue = document.getElementById("daysValue");
    const hoursValue = document.getElementById("hoursValue");
    const minutesValue = document.getElementById("minutesValue");

    if (!daysValue || !hoursValue || !minutesValue) {
        return;
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 4);
    targetDate.setHours(23, 59, 0, 0);

    const updateCountdown = () => {
        const distance = targetDate.getTime() - Date.now();

        if (distance <= 0) {
            daysValue.textContent = "00";
            hoursValue.textContent = "00";
            minutesValue.textContent = "00";
            return;
        }

        const totalMinutes = Math.floor(distance / (1000 * 60));
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
        const minutes = totalMinutes % 60;

        daysValue.textContent = String(days).padStart(2, "0");
        hoursValue.textContent = String(hours).padStart(2, "0");
        minutesValue.textContent = String(minutes).padStart(2, "0");
    };

    updateCountdown();
    window.setInterval(updateCountdown, 60 * 1000);
}

function subscribeToProducts() {
    const container = document.getElementById("dynamic-products-container");
    const status = document.getElementById("productsStatus");

    if (!container || !status) {
        return;
    }

    status.textContent = "Loading products...";

    onValue(
        productsRef,
        (snapshot) => {
            allProducts = snapshot.exists()
                ? Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value }))
                : [];

            allProducts = allProducts
                .map((product) => ({
                    ...product,
                    category: normalizeCategory(product.category)
                }))
                .filter((product) => product.category === "Men" || product.category === "Women")
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

            renderProducts();
        },
        (error) => {
            status.textContent = error.message || "Unable to load products right now.";
            status.className = "products-status status-error";
        }
    );
}

function renderProducts() {
    const container = document.getElementById("dynamic-products-container");
    const status = document.getElementById("productsStatus");
    const filterLabel = document.getElementById("activeFilterLabel");

    if (!container || !status || !filterLabel) {
        return;
    }

    const filteredProducts = activeFilter === "All"
        ? allProducts
        : allProducts.filter((product) => product.category === activeFilter);

    filterLabel.textContent = activeFilter === "All"
        ? "Showing all products"
        : `Showing ${activeFilter} products`;

    status.className = "products-status";

    if (!allProducts.length) {
        container.innerHTML = "";
        status.textContent = "No products added yet. Use Add Product in the navbar to create your first item.";
        return;
    }

    if (!filteredProducts.length) {
        container.innerHTML = "";
        status.textContent = `No ${activeFilter.toLowerCase()} products found yet.`;
        return;
    }

    container.innerHTML = filteredProducts.map(createProductCard).join("");
    status.textContent = "";
}

function createProductCard(product) {
    const safeName = escapeHtml(product.name || "Untitled Product");
    const safeCategory = escapeHtml(product.category || "General");
    const safeDescription = escapeHtml(product.description || "");
    const safeImage = escapeAttribute(product.imageUrl || "");
    const price = Number(product.price || 0).toFixed(2);

    return `
        <div class="product-card">
            <div class="product-image-wrapper">
                <img src="${safeImage}" alt="${safeName}" class="product-img">
                <div class="product-badges">
                    <span class="badge new">${safeCategory}</span>
                </div>
                <div class="product-actions">
                    <button class="action-btn" aria-label="Add to Wishlist"><i class="far fa-heart"></i></button>
                    <button class="action-btn" aria-label="Quick View"><i class="far fa-eye"></i></button>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${safeCategory}</span>
                <h3 class="product-name"><a href="#">${safeName}</a></h3>
                <p class="product-description">${safeDescription}</p>
                <div class="product-price">$${price}</div>
                <button class="btn btn-block btn-cart" id="cart-btn">Add to Cart</button>
            </div>
        </div>
    `;
}

function closeProductModal() {
    const modal = document.getElementById("addProductModal");
    const message = document.getElementById("productFormMessage");

    if (modal) {
        modal.style.display = "none";
    }

    clearMessage(message);
}

function setMessage(element, text, type) {
    if (!element) {
        return;
    }

    element.textContent = text;
    element.className = "form-message";

    if (type === "success") {
        element.classList.add("status-success");
    }

    if (type === "error") {
        element.classList.add("status-error");
    }
}

function clearMessage(element) {
    if (!element) {
        return;
    }

    element.textContent = "";
    element.className = "form-message";
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function normalizeCategory(value) {
    const category = String(value || "").trim().toLowerCase();

    if (category === "men") {
        return "Men";
    }

    if (category === "women") {
        return "Women";
    }

    return "All";
}

function syncFilterUI() {
    const filterTargets = document.querySelectorAll("[data-filter]");

    filterTargets.forEach((element) => {
        const filterValue = normalizeCategory(element.dataset.filter || "All");
        const isActive = filterValue === activeFilter;

        if (element.classList.contains("filter-pill")) {
            element.classList.toggle("active", isActive);
        }

        if (element.tagName === "A") {
            element.classList.toggle("active-filter-link", isActive);
        }
    });
}

function signup(event) {
    event.preventDefault();

    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert("Account created successfully.");
            window.location.href = "login.html";
        })
        .catch((error) => {
            alert(error.message);
        });
}

function signin(event) {
    event.preventDefault();

    const email = document.getElementById("semail")?.value;
    const password = document.getElementById("spassword")?.value;

    if (!email || !password) {
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert("Login successful.");
            window.location.href = "index.html";
        })
        .catch((error) => {
            alert(error.message);
        });
}

function googleSignIn(event) {
    event.preventDefault();

    signInWithPopup(auth, provider)
        .then(() => {
            alert("Logged in with Google.");
            window.location.href = "index.html";
        })
        .catch((error) => {
            alert(error.message);
        });
}


