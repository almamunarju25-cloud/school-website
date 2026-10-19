import { json, makeSession, validSession, getData, verifyPassword, getTenants, tenantSlug } from "./_shared.mjs";

export default async (req) => {
  const url=new URL(req.url);
  if (url.searchParams.get("action")==="me") {
    return json({authenticated:validSession(req,"admin"), configured:Boolean(process.env.ADMIN_PASSWORD || true)});
  }
  if (url.searchParams.get("action")==="logout") {
    return json({ok:true},200,{"Set-Cookie":"bhs_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"});
  }
  if (req.method!=="POST") return json({error:"method_not_allowed"},405);
  const body=await req.json().catch(()=>({}));
  const role=String(body.role||"admin");
  if(role!=="admin") {
    const data=await getData(req); const identity=String(body.identity||"").trim().toLowerCase();
    const user=(data.users||[]).find(x=>String(x.role||"")===role && String(x.identity||x.email||x.username||"").toLowerCase()===identity && verifyPassword(body.password||"",x.passwordHash||x.password||"") && x.active!==false);
    if(!user) return json({error:"invalid_credentials"},401);
    const token=makeSession(req,role,String(user.id||identity));
    return json({ok:true,role,user:{id:user.id,name:user.name||"",role}},200,{"Set-Cookie":`bhs_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`});
  }
  const slug=tenantSlug(req); const tenants=await getTenants();
  const tenant=tenants.find(x=>x.slug===slug);
  if(tenant?.status==="suspended") return json({error:"school_suspended"},403);
  const validTenantPassword=tenant?.adminPasswordHash && verifyPassword(body.password||"",tenant.adminPasswordHash);
  const validLegacyPassword=process.env.ADMIN_PASSWORD && String(body.password||"")===String(process.env.ADMIN_PASSWORD);
  if(!validTenantPassword && !validLegacyPassword) return json({error:"invalid_password"},401);
  const token=makeSession(req,"admin",`admin:${slug}`);
  return json({ok:true,school:slug},200,{"Set-Cookie":`bhs_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`});
};
