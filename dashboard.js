// Set this to the deployed Cloudflare Worker URL before publishing.
const WORKER_BASE_URL = "https://REPLACE_ME.workers.dev";
const TOKEN_KEY = "mahalco_access_token";

const FREE_TOOLS = [
  ["MahAlCo Tools Hub", "https://mahmoudalem95.github.io/mahalco/apis-ar.html"],
  ["Critical Lane Volume & LOS", "https://mahmoudalem95.github.io/mahalco/critical-lane-volume-ar.html"],
  ["Sight Distance Triangles", "https://mahmoudalem95.github.io/mahalco/SD-ar.html"],
  ["Typical Section", "https://mahmoudalem95.github.io/mahalco/typical-section-ar.html"],
  ["Temporary Section", "https://mahmoudalem95.github.io/mahalco/temporary-section-ar.html"],
  ["Work Log", "https://mahmoudalem95.github.io/mahalco/wroklog-ar.html"],
  ["Alignment Builder", "https://mahmoudalem95.github.io/mahalco/alignment-builder-ar.html"],
];

const $ = (id) => document.getElementById(id);

function setMessage(text, kind = "") {
  const el = $("message");
  el.textContent = text;
  el.className = `message ${kind}`;
}

async function api(path, options = {}) {
  if (WORKER_BASE_URL.includes("REPLACE_ME")) throw new Error("Dashboard is not configured: set WORKER_BASE_URL in dashboard.js.");
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${WORKER_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function renderFreeTools() {
  $("free-tools").innerHTML = FREE_TOOLS.map(([name, url]) => `
    <div class="tool">
      <h3>${escapeHtml(name)}</h3>
      <p>Free / trial tool</p>
      <a href="${url}" target="_blank" rel="noopener">Open tool →</a>
    </div>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

async function requestCode() {
  const email = $("email").value.trim().toLowerCase();
  if (!email || !email.includes("@")) return setMessage("Enter a valid email address.", "error");
  $("request-code").disabled = true;
  try {
    await api("/auth/request-code", { method: "POST", body: JSON.stringify({ email }) });
    $("code-section").classList.remove("hidden");
    setMessage("A sign-in code has been sent to your email.", "success");
  } catch (e) {
    setMessage(e.message, "error");
  } finally {
    $("request-code").disabled = false;
  }
}

async function verifyCode() {
  const email = $("email").value.trim().toLowerCase();
  const code = $("code").value.trim();
  if (!email || code.length < 6) return setMessage("Enter the email and six-digit code.", "error");
  $("verify-code").disabled = true;
  try {
    const result = await api("/auth/verify-code", { method: "POST", body: JSON.stringify({ email, code }) });
    localStorage.setItem(TOKEN_KEY, result.token);
    $("login-card").classList.add("hidden");
    $("dashboard-card").classList.remove("hidden");
    await loadDashboard();
  } catch (e) {
    setMessage(e.message, "error");
  } finally {
    $("verify-code").disabled = false;
  }
}

async function loadDashboard() {
  const result = await api("/api/me");
  const license = result.license;
  $("customer-email").textContent = result.email;
  $("plan").textContent = license ? license.plan.toUpperCase() : "FREE";
  $("status").textContent = license ? license.status.toUpperCase() : "NO PAID LICENSE";
  $("expiry").textContent = license ? new Date(license.expires_at).toLocaleString() : "—";

  const paid = Boolean(license && license.active);
  $("paid-section").classList.toggle("hidden", !paid);

  if (paid) {
    const gateway = result.gateway;
    $("signalized-url").textContent = gateway.signalized;
    $("unsignalized-url").textContent = gateway.unsignalized;
    $("api-examples").textContent = `Authorization: Bearer <your dashboard access token>\nGET ${gateway.signalized}\nGET ${gateway.unsignalized}`;
  }
}

async function logout() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    try { await api("/auth/logout", { method: "POST" }); } catch (_) {}
  }
  localStorage.removeItem(TOKEN_KEY);
  location.reload();
}

async function boot() {
  renderFreeTools();
  $("request-code").addEventListener("click", requestCode);
  $("verify-code").addEventListener("click", verifyCode);
  $("logout").addEventListener("click", logout);

  if (localStorage.getItem(TOKEN_KEY)) {
    try {
      $("login-card").classList.add("hidden");
      $("dashboard-card").classList.remove("hidden");
      await loadDashboard();
    } catch (_) {
      localStorage.removeItem(TOKEN_KEY);
      $("dashboard-card").classList.add("hidden");
      $("login-card").classList.remove("hidden");
    }
  }
}

document.addEventListener("DOMContentLoaded", boot);
