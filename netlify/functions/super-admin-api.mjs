import { getTenants, setTenants, json, hashPassword } from "./_shared.mjs";

function authorized(req) {
  const configured = process.env.SUPER_ADMIN_PASSWORD || "";
  const header = req.headers.get("x-super-admin-password") || "";
  return Boolean(configured && header === configured);
}

export default async (req) => {
  if (!authorized(req)) return json({ error: "super_admin_unauthorized" }, 401);
  if (req.method === "GET") return json({ tenants: await getTenants() });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const body = await req.json().catch(() => ({}));
  const rows = await getTenants();
  const action = String(body.action || "");
  if (action === "upsertTenant") {
    const slug = String(body.tenant?.slug || "").toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!slug) return json({ error: "invalid_slug" }, 400);
    const password = String(body.tenant?.adminPassword || "");
    if (!rows.some(x => x.slug === slug) && password.length < 8) {
      return json({ error: "admin_password_min_8_chars" }, 400);
    }
    const i = rows.findIndex(x => x.slug === slug);
    const existing = i >= 0 ? rows[i] : null;
    const item = {
      ...(existing || {}),
      slug,
      nameBn: String(body.tenant?.nameBn || existing?.nameBn || slug),
      nameEn: String(body.tenant?.nameEn || existing?.nameEn || slug),
      status: body.tenant?.status || existing?.status || "active",
      plan: body.tenant?.plan || existing?.plan || "basic",
      updatedAt: new Date().toISOString()
    };
    if (password) {
      if (password.length < 8) return json({ error: "admin_password_min_8_chars" }, 400);
      item.adminPasswordHash = hashPassword(password);
    }
    if (i >= 0) rows[i] = item;
    else rows.push({ ...item, createdAt: new Date().toISOString() });
  } else if (action === "setStatus") {
    const item = rows.find(x => x.slug === body.slug);
    if (!item) return json({ error: "tenant_not_found" }, 404);
    item.status = body.status === "suspended" ? "suspended" : "active";
  } else if (action === "deleteTenant") {
    if (String(body.slug) === "ballovpur") return json({ error: "default_tenant_protected" }, 400);
    const next = rows.filter(x => x.slug !== String(body.slug));
    await setTenants(next);
    return json({ ok: true, tenants: next });
  } else return json({ error: "bad_action" }, 400);
  await setTenants(rows);
  return json({ ok: true, tenants: rows });
};
