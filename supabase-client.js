/**
 * إعدادات الاتصال بمشروع Supabase الخاص بالمتجر.
 * تم إنشاء المشروع وجدول المنتجات والتصنيفات والطلبات تلقائياً.
 */
const SUPABASE_URL = "https://lnivpzzdnorobkaxvwdl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KS9YfwntxnpBslwlT8uBbg_BpKQ3Fid";

// عميل Supabase مشترك لكل صفحات الموقع (يُستخدم بعد تحميل vendor/supabase.js)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** يرجع بيانات المستخدم الحالي (أو null) */
async function getCurrentUser() {
  const { data } = await supabaseClient.auth.getUser();
  return data?.user || null;
}

/** يتحقق هل المستخدم الحالي أدمن */
async function isCurrentUserAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (error || !data) return false;
  return data.role === "admin";
}

/** تنسيق السعر بالجنيه المصري */
function formatPrice(value) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}
