import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual } from "node:crypto";

export const DATA_STORE = "ballovpur-site-data";
export const MEDIA_STORE = "ballovpur-media";
export const DATA_KEY = "site-data-v1";

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
  students: [],
  classGroups: {
    "ষষ্ঠ": [], "সপ্তম": [], "অষ্টম": [], "নবম": [], "দশম": []
  },
  routines: []
};

export function json(data, status=200, headers={}) {
  return Response.json(data, { status, headers: { "Cache-Control":"no-store", ...headers } });
}

export async function getData() {
  const store = getStore({ name: DATA_STORE, consistency: "strong" });
  const data = await store.get(DATA_KEY, { type:"json", consistency:"strong" });
  if (!data) {
    await store.setJSON(DATA_KEY, DEFAULT_DATA);
    return structuredClone(DEFAULT_DATA);
  }
  return { ...structuredClone(DEFAULT_DATA), ...data, school:{...DEFAULT_DATA.school,...(data.school||{})}, classGroups:{...DEFAULT_DATA.classGroups,...(data.classGroups||{})} };
}

export async function setData(data) {
  const store = getStore({ name: DATA_STORE, consistency: "strong" });
  await store.setJSON(DATA_KEY, data);
}

function secret() {
  return process.env.ADMIN_PASSWORD || "";
}
function hmac(value) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}
export function makeSession() {
  const exp = Date.now() + 1000*60*60*12;
  const payload = Buffer.from(JSON.stringify({exp})).toString("base64url");
  return payload + "." + hmac(payload);
}
export function validSession(req) {
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
    const {exp}=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
    return Number(exp) > Date.now();
  } catch { return false; }
}
export function sanitizeId(s){ return String(s||"").replace(/[^a-zA-Z0-9_-]/g,""); }
export function newId(prefix="x"){ return prefix+"_"+Date.now().toString(36)+"_"+crypto.randomUUID().slice(0,8); }
