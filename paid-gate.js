/* Optional helper for a paid static tool page.
   It does NOT make a public HTML URL secret by itself.
   Use this only as a UI gate, while the actual calculations/API calls are also protected server-side.
*/
const MAHALCO_WORKER_BASE_URL = "https://REPLACE_ME.workers.dev";
const MAHALCO_TOKEN_KEY = "mahalco_access_token";

async function mahalcoRequirePaidAccess() {
  const token = localStorage.getItem(MAHALCO_TOKEN_KEY);
  if (!token) {
    location.href = "https://mahmoudalem95.github.io/mahalco/dashboard.html";
    return null;
  }
  const response = await fetch(`${MAHALCO_WORKER_BASE_URL}/api/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    localStorage.removeItem(MAHALCO_TOKEN_KEY);
    location.href = "https://mahmoudalem95.github.io/mahalco/dashboard.html";
    return null;
  }
  const data = await response.json();
  if (!data.license || !data.license.active) {
    location.href = "https://mahmoudalem95.github.io/mahalco/dashboard.html";
    return null;
  }
  return data;
}
