import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual, scryptSync, randomBytes } from "node:crypto";

export const DATA_STORE = "ballovpur-site-data";
export const MEDIA_STORE = "ballovpur-media";
export const DATA_KEY = "site-data-v1";
export const TENANTS_KEY = "platform-tenants-v1";

// Every request is scoped to a school. A school slug may come from the
// x-school-slug header, ?school= query parameter, or the default tenant.
export function tenantSlug(req) {
  try {
    const u = new URL(req?.url || "http://localhost/");
    const raw = req?.headers?.get?.("x-school-slug") || u.searchParams.get("school") || process.env.DEFAULT_SCHOOL_SLUG || "ballovpur";
    return String(raw).toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "ballovpur";
  } catch { return process.env.DEFAULT_SCHOOL_SLUG || "ballovpur"; }
}

export async function getTenants() {
  const store = getStore({ name: DATA_STORE, consistency: "strong" });
  const rows = await store.get(TENANTS_KEY, { type: "json", consistency: "strong" });
  return Array.isArray(rows) ? rows : [{ slug: "ballovpur", nameBn: DEFAULT_DATA.school.nameBn, nameEn: DEFAULT_DATA.school.nameEn, status: "active", plan: "demo" }];
}
export async function setTenants(rows) {
  const store = getStore({ name: DATA_STORE, consistency: "strong" });
  await store.setJSON(TENANTS_KEY, rows);
}

export const DEFAULT_DATA = {
  school: {
    nameBn: "বল্লভপুর উচ্চ বিদ্যালয়",
    nameEn: "Ballovpur High School",
    address: "পোস্ট: নাগেশ্বরী, উপজেলা: নাগেশ্বরী, জেলা: কুড়িগ্রাম",
    shortAddress: "নাগেশ্বরী, কুড়িগ্রাম",
    phone: "01792838223",
    email: "ballovpurhighschool@gmail.com",
    established: "১৯৯১",
    schoolLogo: "sc.png",
    boardLogo: "sc.png",
    facebook: "",
    youtube: ""
  },
  headteacher: null,
  slides: [],
  gallery: [],
  staff: [],
  merit: [],
  committee: [],
  notices: [],
  holidays: [],
  documents: [],
  history: [],
  branches: [],
  classes: [],
  subjects: [],
  students: [],
  classGroups: {
    "ষষ্ঠ": [], "সপ্তম": [], "অষ্টম": [], "নবম": [], "দশম": []
  },
  routines: [],
  users: []
};

export function json(data, status=200, headers={}) {
  return Response.json(data, { status, headers: { "Cache-Control":"no-store", ...headers } });
}

export async function getData(req) {
  const slug = tenantSlug(req);
  const store = getStore({ name: DATA_STORE, consistency: "strong" });
  const dataKey = `${DATA_KEY}:${slug}`;
  const data = await store.get(dataKey, { type:"json", consistency:"strong" });
  if (!data) {
    await store.setJSON(dataKey, DEFAULT_DATA);
    return structuredClone(DEFAULT_DATA);
  }
  return { ...structuredClone(DEFAULT_DATA), ...data, school:{...DEFAULT_DATA.school,...(data.school||{})}, classGroups:{...DEFAULT_DATA.classGroups,...(data.classGroups||{})} };
}

export async function setData(data, req) {
  const slug = tenantSlug(req);
  const store = getStore({ name: DATA_STORE, consistency: "strong" });
  await store.setJSON(`${DATA_KEY}:${slug}`, data);
}

function secret() {
  return process.env.ADMIN_PASSWORD || "";
}
function hmac(value) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}
export function makeSession(req, role="admin", userId="") {
  const exp = Date.now() + 1000*60*60*12;
  const payload = Buffer.from(JSON.stringify({exp,tenant:tenantSlug(req),role,userId})).toString("base64url");
  return payload + "." + hmac(payload);
}
export function validSession(req, requiredRole="admin") {
  if (!secret()) return false;
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)bhs_admin=([^;]+)/);
  if (!m) return false;
  const token = decodeURIComponent(m[1]);
  const [payload,sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = hmac(payload);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const {exp,tenant,role}=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
    return Number(exp) > Date.now() && (!tenant || tenant === tenantSlug(req)) && (!requiredRole || role === requiredRole);
  } catch { return false; }
}
export function hashPassword(password){ const salt=randomBytes(16).toString("hex"); return `scrypt$${salt}$${scryptSync(String(password),salt,64).toString("hex")}`; }
export function verifyPassword(password,stored){ try { const [alg,salt,key]=String(stored||"").split("$"); if(alg!=="scrypt"||!salt||!key)return false; const actual=scryptSync(String(password),salt,64).toString("hex"); return actual.length===key.length && timingSafeEqual(Buffer.from(actual),Buffer.from(key)); } catch { return false; } }
export function sanitizeId(s){ return String(s||"").replace(/[^a-zA-Z0-9_-]/g,""); }
export function newId(prefix="x"){ return prefix+"_"+Date.now().toString(36)+"_"+crypto.randomUUID().slice(0,8); }

export function sessionPayload(req) { try { const c=req.headers.get("cookie")||""; const m=c.match(/(?:^|;\s*)bhs_admin=([^;]+)/); if(!m)return null; const [p]=decodeURIComponent(m[1]).split("."); return JSON.parse(Buffer.from(p,"base64url").toString("utf8")); } catch { return null; } }
