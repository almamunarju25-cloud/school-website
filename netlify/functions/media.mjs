import { getStore } from "@netlify/blobs";
import { MEDIA_STORE } from "./_shared.mjs";

export default async (req) => {
  const u=new URL(req.url),key=u.searchParams.get("key")||"";
  if(!key) return new Response("Not found",{status:404});
  const store=getStore({ name: MEDIA_STORE, consistency: "strong" });
  const entry=await store.getWithMetadata(key,{type:"blob",consistency:"strong"});
  if(!entry||!entry.data) return new Response("Not found",{status:404});
  const meta=entry.metadata||{};
  return new Response(entry.data,{headers:{
    "Content-Type":meta.contentType||entry.data.type||"application/octet-stream",
    "Cache-Control":"public, max-age=3600",
    "Content-Disposition":`inline; filename="${String(meta.filename||"file").replace(/"/g,"")}"`
  }});
};
