import { getStore } from "@netlify/blobs";
import { json, validSession, MEDIA_STORE } from "./_shared.mjs";

export default async (req) => {
  if (!validSession(req)) return json({error:"unauthorized"},401);
  if (req.method!=="POST") return json({error:"method_not_allowed"},405);
  const form=await req.formData();
  const file=form.get("file");
  if (!(file instanceof File)) return json({error:"file_required"},400);
  if (file.size>5.5*1024*1024) return json({error:"file_too_large_max_5_5mb"},413);
  const ext=(file.name.split(".").pop()||"bin").replace(/[^a-z0-9]/gi,"").toLowerCase();
  const key=`uploads/${Date.now()}-${crypto.randomUUID().slice(0,8)}.${ext||"bin"}`;
  const store=getStore({ name: MEDIA_STORE, consistency: "strong" });
  const bytes=await file.arrayBuffer();
  await store.set(key,bytes,{metadata:{contentType:file.type||"application/octet-stream",filename:file.name}});
  return json({ok:true,key,url:`/.netlify/functions/media?key=${encodeURIComponent(key)}`});
};
