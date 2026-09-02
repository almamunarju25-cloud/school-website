import { json, makeSession, validSession } from "./_shared.mjs";

export default async (req) => {
  const url=new URL(req.url);
  if (url.searchParams.get("action")==="me") {
    return json({authenticated:validSession(req), configured:Boolean(process.env.ADMIN_PASSWORD)});
  }
  if (url.searchParams.get("action")==="logout") {
    return json({ok:true},200,{"Set-Cookie":"bhs_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"});
  }
  if (req.method!=="POST") return json({error:"method_not_allowed"},405);
  if (!process.env.ADMIN_PASSWORD) return json({error:"admin_password_not_configured"},503);
  const body=await req.json().catch(()=>({}));
  if (String(body.password||"")!==String(process.env.ADMIN_PASSWORD)) return json({error:"invalid_password"},401);
  const token=makeSession();
  return json({ok:true},200,{"Set-Cookie":`bhs_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`});
};
