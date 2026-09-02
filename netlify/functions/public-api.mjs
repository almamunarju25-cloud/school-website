import { getData, json } from "./_shared.mjs";

const active=x=>x?.is_active===undefined || x?.is_active===true || x?.is_active===1 || x?.is_active==="1";
const mediaUrl=v=>v&&typeof v==="object"?(v.url||""):(v||"");
const normalizeImage=x=>x?{...x,image:mediaUrl(x.image)}:x;
const normalizeRows=rows=>rows.map(normalizeImage);
const bySort=(a,b)=>(Number(a.sort_order||0)-Number(b.sort_order||0)) || String(a.id||"").localeCompare(String(b.id||""));

const media=v=>typeof v==="string"?v:(v&&typeof v==="object"?(v.url||""):"");
const normalize=x=>{ if(!x||typeof x!=="object")return x; const y={...x}; for(const k of ["image","file","schoolLogo","boardLogo"]){if(k in y)y[k]=media(y[k]);} return y; };
const classNo=v=>({"6":"6","৬":"6","ষষ্ঠ":"6","৬ষ্ঠ":"6","7":"7","৭":"7","সপ্তম":"7","৭ম":"7","8":"8","৮":"8","অষ্টম":"8","৮ম":"8","9":"9","৯":"9","নবম":"9","৯ম":"9","10":"10","১০":"10","দশম":"10","১০ম":"10"}[String(v||"").trim()]||String(v||"").trim());

export default async (req) => {
  const u=new URL(req.url),kind=u.searchParams.get("kind")||"";
  const d=await getData();

  if(kind==="school") return json({...d.school,schoolLogo:media(d.school.schoolLogo),boardLogo:media(d.school.boardLogo)});

  if(kind==="leadership"){
    const president=(d.committee||[]).filter(x=>x.member_type==="সভাপতি").sort(bySort)[0]||null;
    const secretary=(d.committee||[]).filter(x=>x.member_type==="সদস্য সচিব").sort(bySort)[0]||null;
    return json({headteacher:normalizeImage(d.headteacher||null),president:normalizeImage(president),secretary:normalizeImage(secretary),school:{name:d.school.nameBn,address:d.school.address}});
  }

  if(kind==="gallery") return json({data:normalizeRows([...(d.gallery||[])].filter(active).sort(bySort))});
  if(kind==="history") return json({data:[...(d.history||[])].filter(active).sort(bySort)});
  if(kind==="slides") return json({data:normalizeRows([...(d.slides||[])].filter(active).sort(bySort))});
  if(kind==="staff") return json({data:normalizeRows([...(d.staff||[])].filter(x=>active(x)&&!x.is_headteacher).sort(bySort))});
  if(kind==="merit") return json({data:normalizeRows([...(d.merit||[])].filter(active).sort(bySort))});

  if(kind==="committee"){
    const type=u.searchParams.get("type")||"";
    const id=u.searchParams.get("id")||"";
    let rows=normalizeRows([...(d.committee||[])].filter(active).sort(bySort));
    if(type)rows=rows.filter(x=>x.member_type===type);
    if(id)return json({data:normalize(rows.find(x=>String(x.id)===String(id))||null)});
    return json({data:rows.map(normalize)});
  }

  if(kind==="notices"){
    const rows=[...(d.notices||[])].filter(active).sort((a,b)=>String(b.publish_date||"").localeCompare(String(a.publish_date||"")));
    return json(rows.map(x=>({
      id:x.id,title:x.title||"",date:x.publish_date||"",details:x.body||x.details||"",
      has_file:Boolean(x.file),
      view_url:x.file?`/.netlify/functions/public-file?kind=notice&id=${encodeURIComponent(x.id)}`:"",
      download_url:x.file?`/.netlify/functions/public-file?kind=notice&id=${encodeURIComponent(x.id)}&download=1`:""
    })));
  }

  if(kind==="holidays"){
    const rows=[...(d.holidays||[])].filter(active).sort((a,b)=>String(b.start_date||"").localeCompare(String(a.start_date||"")));
    return json(rows.map(x=>({id:x.id,title:x.title||"",description:x.description||"",start_date:x.start_date||"",end_date:x.end_date||"",has_file:Boolean(x.file)})));
  }

  if(kind==="documents-status"){
    const types=["permission","recognition","first_mpo","branch_info","other"],out={};
    for(const type of types){
      const row=[...(d.documents||[])].filter(x=>active(x)&&x.doc_type===type&&x.file).sort((a,b)=>String(b.id||"").localeCompare(String(a.id||"")))[0];
      out[type]=row?{id:row.id,title:row.title||"",has_file:true}:{has_file:false};
    }
    return json({data:out});
  }

  if(kind==="students") return json([...(d.students||[])].filter(x=>Number(x.total||0)>0||Number(x.male||0)>0||Number(x.female||0)>0));

  if(kind==="routine"){
    const groups=d.classGroups||{},map={},classes=["ষষ্ঠ","সপ্তম","অষ্টম","নবম","দশম"];
    for(const r of (d.routines||[])){
      if(!active(r))continue;
      const configured=classes.find(c=>classNo(c)===classNo(r.class_name))||r.class_name;
      const g=String(r.group||r.branch_name||"").trim(),day=String(r.day_name||"").trim();
      if(!configured||!g||!day)continue;
      if(!map[configured])map[configured]={};
      if(!map[configured][g])map[configured][g]={};
      const periods=Array.isArray(r.periods)?r.periods.slice(0,8):[];
      while(periods.length<8)periods.push("");
      map[configured][g][day]=periods;
    }
    return json({classes,groups,data:map});
  }

  return json({error:"unknown_kind"},404);
};
