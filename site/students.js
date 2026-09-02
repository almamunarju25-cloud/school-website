(function(){
  const KEY='ballovpur_student_statistics_v1';
  const defaults=[];
  let serverRows=null;
  function num(v){v=parseInt(v,10);return Number.isFinite(v)&&v>=0?v:0}
  function normalize(r){
    const male=num(r.male),female=num(r.female);
    return {className:String(r.className||'').trim(),total:num(r.total||male+female),male,female,muslim:num(r.muslim),hindu:num(r.hindu),christian:num(r.christian),buddhist:num(r.buddhist),other:num(r.other)};
  }
  function localRows(){try{const x=JSON.parse(localStorage.getItem(KEY));return Array.isArray(x)&&x.length?x.map(normalize):defaults.map(normalize)}catch(e){return defaults.map(normalize)}}
  window.getStudentStats=function(){return Array.isArray(serverRows)?serverRows.map(normalize):localRows()};
  window.saveStudentStats=function(rows){localStorage.setItem(KEY,JSON.stringify((rows||[]).map(normalize).filter(x=>x.className)));window.dispatchEvent(new Event('studentStatsUpdated'));return getStudentStats()};
  window.studentTotals=function(rows){rows=rows||getStudentStats();return rows.reduce((a,r)=>{a.total+=num(r.total||num(r.male)+num(r.female));a.male+=num(r.male);a.female+=num(r.female);a.muslim+=num(r.muslim);a.hindu+=num(r.hindu);a.christian+=num(r.christian);a.buddhist+=num(r.buddhist);a.other+=num(r.other);return a},{total:0,male:0,female:0,muslim:0,hindu:0,christian:0,buddhist:0,other:0})};
  async function loadServer(){
    try{
      const res=await fetch('/.netlify/functions/public-api?kind=students',{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      const data=await res.json();
      if(Array.isArray(data)){
        serverRows=data.map(normalize);
        try{localStorage.setItem(KEY,JSON.stringify(serverRows));}catch(e){}
        window.dispatchEvent(new Event('studentStatsUpdated'));
      }
    }catch(e){serverRows=null;}
  }
  window.reloadStudentStats=loadServer;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadServer); else loadServer();
})();
