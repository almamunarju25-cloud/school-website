import { getData, setData, json, validSession, newId } from "./_shared.mjs";

const arrays=new Set(["slides","gallery","staff","merit","committee","notices","holidays","documents","history","branches","classes","subjects","students","routines"]);

export default async (req) => {
  if (!validSession(req)) return json({error:"unauthorized"},401);
  if (req.method==="GET") return json(await getData());
  if (req.method!=="POST") return json({error:"method_not_allowed"},405);

  const body=await req.json().catch(()=>({}));
  const data=await getData();
  const action=body.action;

  if (action==="saveSchool") {
    data.school={...data.school,...(body.value||{})};
  } else if (action==="saveHeadteacher") {
    data.headteacher=body.value||null;
  } else if (action==="saveClassGroups") {
    data.classGroups={...data.classGroups,...(body.value||{})};
  } else if (action==="upsert") {
    const c=String(body.collection||"");
    if (!arrays.has(c)) return json({error:"bad_collection"},400);
    const item={...(body.item||{})};
    if (!item.id) item.id=newId(c.slice(0,3));
    const idx=(data[c]||[]).findIndex(x=>String(x.id)===String(item.id));
    if(idx>=0)data[c][idx]={...data[c][idx],...item}; else data[c].push(item);
  } else if (action==="delete") {
    const c=String(body.collection||"");
    if (!arrays.has(c)) return json({error:"bad_collection"},400);
    data[c]=(data[c]||[]).filter(x=>String(x.id)!==String(body.id));
  } else if (action==="replace") {
    const c=String(body.collection||"");
    if (!arrays.has(c)) return json({error:"bad_collection"},400);
    data[c]=Array.isArray(body.value)?body.value:[];
  } else {
    return json({error:"bad_action"},400);
  }

  await setData(data);
  return json({ok:true,data});
};
