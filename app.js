const STORAGE_KEY = "exeShopData";

const defaultData = {
  adminPassword: "admin123",
  products: [
    {
      id: crypto.randomUUID(),
      title: "Архиватор FastPack.exe",
      description: "Упаковывает и распаковывает папки в 1 клик.",
      price: 299,
    },
  ],
  orders: [],
  feedback: [],
};

let data = loadData();

const storeSection = document.getElementById("storeSection");
const adminSection = document.getElementById("adminSection");
const viewStoreBtn = document.getElementById("viewStoreBtn");
const viewAdminBtn = document.getElementById("viewAdminBtn");

const storeProducts = document.getElementById("storeProducts");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackList = document.getElementById("feedbackList");

const adminLock = document.getElementById("adminLock");
const adminContent = document.getElementById("adminContent");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");

const productForm = document.getElementById("productForm");
const adminProducts = document.getElementById("adminProducts");
const ordersList = document.getElementById("ordersList");
const profitSummary = document.getElementById("profitSummary");
const settingsForm = document.getElementById("settingsForm");

const productCardTemplate = document.getElementById("productCardTemplate");

let isAdminLogged = false;

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultData),
      ...parsed,
      products: parsed.products || [],
      orders: parsed.orders || [],
      feedback: parsed.feedback || [],
    };
  } catch {
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function openStore() {
  storeSection.classList.remove("hidden");
  adminSection.classList.add("hidden");
}

function openAdmin() {
  storeSection.classList.add("hidden");
  adminSection.classList.remove("hidden");
}

function renderStoreProducts() {
  storeProducts.innerHTML = "";

  if (!data.products.length) {
    storeProducts.innerHTML = "<p>Пока нет товаров. Продавец скоро добавит!</p>";
    return;
  }

  data.products.forEach((product) => {
    const fragment = productCardTemplate.content.cloneNode(true);
    fragment.querySelector(".product-title").textContent = product.title;
    fragment.querySelector(".product-description").textContent = product.description || "Без описания";
    fragment.querySelector(".product-price").textContent = `${product.price} ₽`;

    const buyForm = fragment.querySelector(".buy-form");
    buyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const fd = new FormData(buyForm);
      const buyer = String(fd.get("buyer") || "").trim();
      if (!buyer) return;

      data.orders.unshift({
        id: crypto.randomUUID(),
        productId: product.id,
        productTitle: product.title,
        buyer,
        price: Number(product.price),
        date: new Date().toLocaleString("ru-RU"),
      });
      saveData();
      renderAdmin();
      buyForm.reset();
      alert(`Спасибо за покупку, ${buyer}! Продавец увидит ваш заказ в админке.`);
    });

    storeProducts.appendChild(fragment);
  });
}

function renderFeedback() {
  feedbackList.innerHTML = "";
  data.feedback.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${escapeHtml(item.name)}:</strong> ${escapeHtml(item.message)}`;
    feedbackList.appendChild(li);
  });
}

function renderAdminProducts() {
  adminProducts.innerHTML = "";
  data.products.forEach((product) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="row">
        <div>
          <strong>${escapeHtml(product.title)}</strong><br/>
          <span>${product.price} ₽</span>
        </div>
        <button class="delete-btn" type="button">Удалить</button>
      </div>
    `;
    li.querySelector("button").addEventListener("click", () => {
      data.products = data.products.filter((p) => p.id !== product.id);
      saveData();
      renderStoreProducts();
      renderAdminProducts();
    });
    adminProducts.appendChild(li);
  });
}

function renderOrders() {
  ordersList.innerHTML = "";
  const total = data.orders.reduce((sum, item) => sum + Number(item.price), 0);
  profitSummary.textContent = `Общая прибыль: ${total} ₽`;

  data.orders.forEach((order) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${escapeHtml(order.productTitle)}</strong><br/>
      Покупатель: ${escapeHtml(order.buyer)}<br/>
      Цена: ${order.price} ₽<br/>
      Дата: ${escapeHtml(order.date)}
    `;
    ordersList.appendChild(li);
  });

  if (!data.orders.length) {
    ordersList.innerHTML = "<li>Пока покупок нет.</li>";
  }
}

function renderAdmin() {
  renderAdminProducts();
  renderOrders();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

viewStoreBtn.addEventListener("click", openStore);
viewAdminBtn.addEventListener("click", openAdmin);

adminLoginBtn.addEventListener("click", () => {
  const inputPassword = adminPasswordInput.value;
  if (inputPassword === data.adminPassword) {
    isAdminLogged = true;
    adminLock.classList.add("hidden");
    adminContent.classList.remove("hidden");
    renderAdmin();
  } else {
    alert("Неверный пароль");
  }
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdminLogged) return;

  const fd = new FormData(productForm);
  const title = String(fd.get("title") || "").trim();
  const description = String(fd.get("description") || "").trim();
  const price = Number(fd.get("price"));

  if (!title || Number.isNaN(price)) return;

  data.products.unshift({
    id: crypto.randomUUID(),
    title,
    description,
    price,
  });

  saveData();
  productForm.reset();
  renderStoreProducts();
  renderAdminProducts();
});

feedbackForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fd = new FormData(feedbackForm);
  const name = String(fd.get("name") || "").trim();
  const message = String(fd.get("message") || "").trim();
  if (!name || !message) return;

  data.feedback.unshift({ name, message });
  saveData();
  feedbackForm.reset();
  renderFeedback();
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdminLogged) return;

  const fd = new FormData(settingsForm);
  const newPassword = String(fd.get("newPassword") || "").trim();
  if (newPassword.length < 4) {
    alert("Пароль должен быть хотя бы 4 символа");
    return;
  }
  data.adminPassword = newPassword;
  saveData();
  settingsForm.reset();
  alert("Пароль обновлен");
});

renderStoreProducts();
renderFeedback();
