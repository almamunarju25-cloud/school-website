(function(){
  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function formatDate(s){
    if(!s)return '';
    const parts=String(s).split('-');
    if(parts.length!==3)return s;
    const map={'01':'জানুয়ারি','02':'ফেব্রুয়ারি','03':'মার্চ','04':'এপ্রিল','05':'মে','06':'জুন','07':'জুলাই','08':'আগস্ট','09':'সেপ্টেম্বর','10':'অক্টোবর','11':'নভেম্বর','12':'ডিসেম্বর'};
    const bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
    return bn(parseInt(parts[2],10))+' '+(map[parts[1]]||parts[1]);
  }
  function render(rows){
    const track=document.querySelector('[data-holiday-track]');
    if(!track)return;
    if(!Array.isArray(rows)||!rows.length){
      track.innerHTML='<span class="holiday-empty-public">বর্তমানে কোনো ছুটির নোটিশ নেই</span>';
      return;
    }
    track.innerHTML=rows.map(n=>{
      const view=n.has_file?`/.netlify/functions/public-file?kind=holiday&id=${encodeURIComponent(n.id)}`:'#';
      const down=n.has_file?`/.netlify/functions/public-file?kind=holiday&id=${encodeURIComponent(n.id)}&download=1`:'#';
      const label=formatDate(n.start_date)||'ছুটির নোটিশ';
      return `<div class="holiday-public-item">
        <a class="holiday-public-view${n.has_file?'':' disabled'}" href="${view}" ${n.has_file?'target="_blank" rel="noopener"':'aria-disabled="true"'}>
          <strong>${esc(label)}</strong><span>${esc(n.title||'ছুটির নোটিশ')}</span>
        </a>
        ${n.has_file?`<a class="holiday-public-download" href="${down}" title="ডাউনলোড করুন" aria-label="ছুটির নোটিশ ডাউনলোড করুন"><i class="fa-solid fa-download"></i></a>`:''}
      </div>`;
    }).join('');
  }
  async function load(){
    try{
      const r=await fetch('/.netlify/functions/public-api?kind=holidays',{cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const data=await r.json();
      render(data);
    }catch(e){
      render([]);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);
  else load();
})();