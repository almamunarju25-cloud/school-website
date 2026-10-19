import { getData, setData, json, validSession, sessionPayload } from "./_shared.mjs";
export default async (req) => {
  const p=sessionPayload(req); const role=p?.role;
  if(!role || !["teacher","student"].includes(role) || !validSession(req,role)) return json({error:"unauthorized"},401);
  const d=await getData(req); const id=String(p.userId||"");
  const user=(d.users||[]).find(x=>String(x.id)===id) || {};
  if(req.method==="POST" && role==="teacher") {
    const b=await req.json().catch(()=>({})); const action=String(b.action||"");
    if(action==="attendance") { const day=String(b.date||new Date().toISOString().slice(0,10)); const row={teacherId:id,date:day,className:String(b.className||""),records:Array.isArray(b.records)?b.records:[]}; d.attendance=[...(d.attendance||[]).filter(x=>!(x.teacherId===id&&x.date===day&&x.className===row.className)),row]; await setData(d,req); return json({ok:true,row}); }
    if(action==="marks") { const row={teacherId:id,exam:String(b.exam||""),className:String(b.className||""),subject:String(b.subject||user.subject||""),records:Array.isArray(b.records)?b.records:[]}; d.marks=[...(d.marks||[]).filter(x=>!(x.teacherId===id&&x.exam===row.exam&&x.className===row.className&&x.subject===row.subject)),row]; await setData(d,req); return json({ok:true,row}); }
    return json({error:"bad_action"},400);
  }
  if(role==="student") return json({role,user:{id:user.id,name:user.name,class:user.class,section:user.section},result:user.result||[],attendance:user.attendance||[],fees:user.fees||[],notices:(d.notices||[]).filter(x=>x.is_active!==false).slice(0,10)});
  return json({role,user:{id:user.id,name:user.name,subject:user.subject,classes:user.classes||[]},students:d.students||[],routines:d.routines||[],attendance:d.attendance||[],marks:d.marks||[],notices:(d.notices||[]).filter(x=>x.is_active!==false).slice(0,10)});
};
