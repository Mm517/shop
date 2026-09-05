/**
 * منطق لوحة تحكم الأدمن: حماية الصفحة، عرض الإحصائيات،
 * وإدارة المنتجات (إضافة / تعديل / حذف) والطلبات.
 */
let categoriesCache = [];

async function guardAdmin() {
  const user = await getCurrentUser();
  const admin = user ? await isCurrentUserAdmin() : false;

  if (!admin) {
    document.getElementById("admin-gate").style.display = "flex";
    document.getElementById("admin-app").style.display = "none";
    return false;
  }
  document.getElementById("admin-gate").style.display = "none";
  document.getElementById("admin-app").style.display = "block";
  return true;
}

async function loadCategoriesIntoSelect() {
  const { data } = await supabaseClient.from("categories").select("*").order("name");
  categoriesCache = data || [];
  const select = document.getElementById("p-category");
  select.innerHTML = categoriesCache.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
}

async function loadStats() {
  const [{ count: productCount }, { data: orders }] = await Promise.all([
    supabaseClient.from("products").select("*", { count: "exact", head: true }),
    supabaseClient.from("orders").select("total, status"),
  ]);
  document.getElementById("stat-products").textContent = productCount ?? 0;
  document.getElementById("stat-orders").textContent = orders?.length ?? 0;
  document.getElementById("stat-pending").textContent = orders?.filter((o) => o.status === "pending").length ?? 0;
  const revenue = orders?.reduce((sum, o) => sum + Number(o.total || 0), 0) ?? 0;
  document.getElementById("stat-revenue").textContent = formatPrice(revenue);
}

async function loadProductsTable() {
  const tbody = document.getElementById("products-tbody");
  const { data, error } = await supabaseClient
    .from("products")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  if (error || !data) {
    tbody.innerHTML = `<tr><td colspan="7">تعذر تحميل المنتجات.</td></tr>`;
    return;
  }
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">لا توجد منتجات بعد.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (p) => `
    <tr>
      <td><img src="${p.image_url}" alt=""></td>
      <td>${p.name}</td>
      <td>${p.categories?.name || "—"}</td>
      <td>${formatPrice(p.price)}</td>
      <td>${p.stock}</td>
      <td>${p.is_featured ? "نعم" : "لا"}</td>
      <td>
        <div class="row-actions">
          <button class="edit-btn" onclick="openEditProduct('${p.id}')">تعديل</button>
          <button class="del-btn" onclick="deleteProduct('${p.id}')">حذف</button>
        </div>
      </td>
    </tr>`
    )
    .join("");

  window.__productsCache = data;
}

async function loadOrdersTable() {
  const tbody = document.getElementById("orders-tbody");
  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">لا توجد طلبات بعد.</td></tr>`;
    return;
  }

  const statusOptions = ["pending", "paid", "shipped", "delivered", "cancelled"];
  const statusLabels = { pending: "قيد الانتظار", paid: "مدفوع", shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغي" };

  tbody.innerHTML = data
    .map(
      (o) => `
    <tr>
      <td>#${o.id.slice(0, 8)}</td>
      <td>${o.shipping_name || "—"}</td>
      <td>${o.shipping_phone || "—"}</td>
      <td>${formatPrice(o.total)}</td>
      <td>
        <select onchange="updateOrderStatus('${o.id}', this.value)">
          ${statusOptions.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${statusLabels[s]}</option>`).join("")}
        </select>
      </td>
      <td>${new Date(o.created_at).toLocaleDateString("ar-EG")}</td>
      <td>—</td>
    </tr>`
    )
    .join("");
}

async function updateOrderStatus(orderId, status) {
  await supabaseClient.from("orders").update({ status }).eq("id", orderId);
  loadStats();
}

function openAddProduct() {
  document.getElementById("modal-title").textContent = "إضافة منتج";
  document.getElementById("product-form").reset();
  document.getElementById("p-id").value = "";
  document.getElementById("modal-msg").className = "form-msg";
  document.getElementById("product-modal").classList.add("open");
}

function openEditProduct(id) {
  const p = (window.__productsCache || []).find((x) => x.id === id);
  if (!p) return;
  document.getElementById("modal-title").textContent = "تعديل منتج";
  document.getElementById("p-id").value = p.id;
  document.getElementById("p-name").value = p.name;
  document.getElementById("p-slug").value = p.slug;
  document.getElementById("p-description").value = p.description || "";
  document.getElementById("p-price").value = p.price;
  document.getElementById("p-compare").value = p.compare_at_price || "";
  document.getElementById("p-category").value = p.category_id || "";
  document.getElementById("p-image").value = p.image_url || "";
  document.getElementById("p-sizes").value = (p.sizes || []).join(",");
  document.getElementById("p-colors").value = (p.colors || []).join(",");
  document.getElementById("p-stock").value = p.stock;
  document.getElementById("p-featured").value = String(!!p.is_featured);
  document.getElementById("modal-msg").className = "form-msg";
  document.getElementById("product-modal").classList.add("open");
}

function closeModal() {
  document.getElementById("product-modal").classList.remove("open");
}

async function deleteProduct(id) {
  if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
  await supabaseClient.from("products").delete().eq("id", id);
  loadProductsTable();
  loadStats();
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById("modal-save");
  saveBtn.disabled = true;
  saveBtn.textContent = "جارِ الحفظ...";

  const id = document.getElementById("p-id").value;
  const payload = {
    name: document.getElementById("p-name").value.trim(),
    slug: document.getElementById("p-slug").value.trim(),
    description: document.getElementById("p-description").value.trim(),
    price: parseFloat(document.getElementById("p-price").value),
    compare_at_price: document.getElementById("p-compare").value ? parseFloat(document.getElementById("p-compare").value) : null,
    category_id: document.getElementById("p-category").value,
    image_url: document.getElementById("p-image").value.trim(),
    sizes: document.getElementById("p-sizes").value.split(",").map((s) => s.trim()).filter(Boolean),
    colors: document.getElementById("p-colors").value.split(",").map((s) => s.trim()).filter(Boolean),
    stock: parseInt(document.getElementById("p-stock").value || "0", 10),
    is_featured: document.getElementById("p-featured").value === "true",
  };

  let error;
  if (id) {
    ({ error } = await supabaseClient.from("products").update(payload).eq("id", id));
  } else {
    ({ error } = await supabaseClient.from("products").insert(payload));
  }

  saveBtn.disabled = false;
  saveBtn.textContent = "حفظ";

  if (error) {
    const msg = document.getElementById("modal-msg");
    msg.className = "form-msg show error";
    msg.textContent = "تعذر الحفظ. تأكد أن الرابط المختصر (slug) غير مكرر.";
    return;
  }

  closeModal();
  loadProductsTable();
  loadStats();
}

document.addEventListener("DOMContentLoaded", async () => {
  const ok = await guardAdmin();
  if (!ok) return;

  await loadCategoriesIntoSelect();
  await Promise.all([loadStats(), loadProductsTable(), loadOrdersTable()]);

  document.getElementById("add-product-btn").addEventListener("click", openAddProduct);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("product-form").addEventListener("submit", handleProductSubmit);

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  });

  const navOrders = document.getElementById("nav-orders");
  const navProducts = document.querySelector(".admin-side a.active");
  navOrders.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("products-panel").style.display = "none";
    document.getElementById("orders-panel").style.display = "block";
    document.getElementById("admin-head-title") && (document.getElementById("admin-head-title").textContent = "الطلبات");
    document.querySelector(".admin-head h1").textContent = "إدارة الطلبات";
    document.getElementById("add-product-btn").style.display = "none";
    navOrders.classList.add("active");
    navProducts.classList.remove("active");
  });
  navProducts.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("orders-panel").style.display = "none";
    document.getElementById("products-panel").style.display = "block";
    document.querySelector(".admin-head h1").textContent = "إدارة المنتجات";
    document.getElementById("add-product-btn").style.display = "inline-flex";
    navProducts.classList.add("active");
    navOrders.classList.remove("active");
  });
});
