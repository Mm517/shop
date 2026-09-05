/**
 * سلة المشتريات: تُخزَّن محلياً في المتصفح (localStorage) وتُستخدم
 * لإنشاء الطلب النهائي في Supabase عند إتمام الشراء.
 */
const CART_KEY = "veloce_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(
    (i) => i.product_id === item.product_id && i.size === item.size && i.color === item.color
  );
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = cartCount();
  });
}

/** يبني عناصر السلة المنسدلة إن وجد الدرج في الصفحة */
function renderCartDrawer() {
  const list = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total-amount");
  if (!list) return;
  const cart = getCart();
  if (cart.length === 0) {
    list.innerHTML = `<div class="empty-state"><h3>السلة فارغة</h3><p>أضف منتجات من المتجر لتظهر هنا.</p></div>`;
  } else {
    list.innerHTML = cart
      .map(
        (item, idx) => `
        <div class="cart-line">
          <img src="${item.image_url || ""}" alt="${item.name}">
          <div class="cart-line-info">
            <div class="name">${item.name}</div>
            <div class="meta">${item.size ? "المقاس: " + item.size : ""} ${item.color ? "· اللون: " + item.color : ""} · الكمية: ${item.quantity}</div>
            <div class="price-now">${formatPrice(item.price * item.quantity)}</div>
          </div>
          <button class="cart-line-remove" onclick="removeFromCart(${idx}); renderCartDrawer();">إزالة</button>
        </div>`
      )
      .join("");
  }
  if (totalEl) totalEl.textContent = formatPrice(cartTotal());
}

function openCartDrawer() {
  renderCartDrawer();
  document.getElementById("cart-overlay")?.classList.add("open");
  document.getElementById("cart-drawer")?.classList.add("open");
}

function closeCartDrawer() {
  document.getElementById("cart-overlay")?.classList.remove("open");
  document.getElementById("cart-drawer")?.classList.remove("open");
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
