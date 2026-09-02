import { getStore } from "@netlify/blobs";
import { getData, MEDIA_STORE } from "./_shared.mjs";

async function serve(ref,download){
  if(!ref?.key) return new Response("ফাইল পাওয়া যায়নি।",{status:404,headers:{"Content-Type":"text/plain; charset=utf-8"}});
  const store=getStore(MEDIA_STORE);
  const entry=await store.getWithMetadata(ref.key,{type:"blob"});
  if(!entry?.data)return new Response("ফাইল পাওয়া যায়নি।",{status:404});
  const meta=entry.metadata||{};
  const filename=String(ref.name||meta.filename||"file").replace(/"/g,"");
  return new Response(entry.data,{headers:{
    "Content-Type":ref.type||meta.contentType||entry.data.type||"application/octet-stream",
    "Content-Disposition":`${download?"attachment":"inline"}; filename="${filename}"`,
    "Cache-Control":"no-store"
  }});
}

export default async (req) => {
  const u=new URL(req.url),kind=u.searchParams.get("kind")||"",id=u.searchParams.get("id")||"",download=u.searchParams.get("download")==="1";
  const d=await getData();
  let item=null;
  if(kind==="notice")item=(d.notices||[]).find(x=>String(x.id)===String(id));
  else if(kind==="holiday")item=(d.holidays||[]).find(x=>String(x.id)===String(id));
  else if(kind==="document"){
    const type=u.searchParams.get("type")||"";
    item=[...(d.documents||[])].filter(x=>x.doc_type===type&&x.file).sort((a,b)=>String(b.id||"").localeCompare(String(a.id||"")))[0];
  }
  return serve(item?.file,download);
};
