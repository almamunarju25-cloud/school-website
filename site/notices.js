(function(){
  const defaults=[
    {id:1,title:'বিদ্যালয়ের জরুরি নোটিশ',date:'১৮ আগস্ট ২০২৬',details:'বিদ্যালয়ের জরুরি নোটিশের বিস্তারিত তথ্য।',has_file:false},
    {id:2,title:'শিক্ষার্থীদের জন্য গুরুত্বপূর্ণ ঘোষণা',date:'২০ আগস্ট ২০২৬',details:'শিক্ষার্থীদের জন্য গুরুত্বপূর্ণ ঘোষণার বিস্তারিত তথ্য।',has_file:false},
    {id:3,title:'নতুন নোটিশ এখানে প্রকাশিত হবে',date:'',details:'নতুন নোটিশ প্রকাশিত হলে এখানে দেখা যাবে।',has_file:false}
  ];
  let serverRows=null;

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function getLocalNotices(){
    try{
      const x=JSON.parse(localStorage.getItem('ballovpurNotices')||'null');
      return Array.isArray(x)?x:defaults;
    }catch(e){return defaults;}
  }
  function getNotices(){ return Array.isArray(serverRows)?serverRows:getLocalNotices(); }
  window.getNotices=getNotices;
  window.saveNotices=function(rows){
    localStorage.setItem('ballovpurNotices',JSON.stringify(rows||[]));
    if(!serverRows)renderAll();
  };

  function viewUrl(n){
    return n && n.has_file ? `/.netlify/functions/public-file?kind=notice&id=${encodeURIComponent(n.id)}` : '#';
  }
  function downloadUrl(n){
    return n && n.has_file ? `/.netlify/functions/public-file?kind=notice&id=${encodeURIComponent(n.id)}&download=1` : '#';
  }

  function renderAll(){
    const rows=getNotices();
    document.querySelectorAll('[data-notice-count]').forEach(x=>x.textContent=rows.length);

    const board=document.querySelector('[data-notice-board]');
    if(board){
      board.innerHTML=rows.slice(0,6).map((n,i)=>{
        const href=viewUrl(n);
        const disabled=!n.has_file;
        return `<a class="notice-item premium-notice-item${disabled?' notice-no-file':''}" href="${href}" ${disabled?'aria-disabled="true"':''}>
          <span class="notice-number">${i+1}</span>
          <span class="notice-copy"><strong>${esc(n.title)}</strong><small><i class="fa-regular fa-calendar"></i> ${esc(n.date||'তারিখ প্রকাশিত হয়নি')}</small></span>
          <span class="notice-row-arrow"><i class="fa-solid fa-angle-right"></i></span>
        </a>`;
      }).join('');
    }

    const track=document.querySelector('.notice-track');
    if(track){
      track.innerHTML=rows.slice(0,6).map(n=>{
        const href=viewUrl(n);
        return `<a href="${href}" ${!n.has_file?'aria-disabled="true"':''}>${esc(n.title)}</a>`;
      }).join('');
    }

    const list=document.querySelector('[data-all-notices]');
    if(list){
      const search=document.getElementById('noticeSearch');
      const sizeSelect=document.getElementById('noticePageSize');
      const q=(search?.value||'').trim().toLowerCase();
      const filtered=rows.filter(n=>(String(n.title||'')+' '+String(n.date||'')+' '+String(n.details||'')).toLowerCase().includes(q));
      const perPage=Math.max(1,parseInt(sizeSelect?.value||'10',10));
      const totalPages=Math.max(1,Math.ceil(filtered.length/perPage));
      let page=parseInt(list.dataset.page||'1',10);
      if(!Number.isFinite(page)||page<1)page=1;
      if(page>totalPages)page=totalPages;
      list.dataset.page=String(page);
      const start=(page-1)*perPage;
      const pageRows=filtered.slice(start,start+perPage);

      list.innerHTML=pageRows.length?pageRows.map((n,i)=>{
        const serial=start+i+1;
        const snippet=String(n.details||'').replace(/\s+/g,' ').trim();
        const canOpen=!!n.has_file;
        return `<div class="notice-row">
          <div class="notice-serial"><span class="serial-badge">${serial}</span></div>
          <div class="notice-main">
            ${canOpen
              ? `<a class="notice-title-link" href="${viewUrl(n)}">${esc(n.title)}</a>`
              : `<span class="notice-title-link">${esc(n.title)}</span>`}
            <span class="notice-snippet">${esc(snippet||'নোটিশের সংযুক্ত ফাইল সরাসরি দেখুন')}</span>
          </div>
          <div class="notice-date"><span class="notice-date-chip"><i class="fa-regular fa-calendar-days"></i>${esc(n.date||'তারিখ নেই')}</span></div>
          <div class="notice-actions">
            ${canOpen
              ? `<a class="action-btn view-btn" href="${viewUrl(n)}"><i class="fa-regular fa-eye"></i> দেখুন</a>
                 <a class="action-btn download-btn" href="${downloadUrl(n)}"><i class="fa-solid fa-download"></i> ডাউনলোড</a>`
              : `<span class="action-btn view-btn disabled"><i class="fa-regular fa-eye-slash"></i> ফাইল নেই</span>
                 <span class="action-btn download-btn disabled"><i class="fa-solid fa-download"></i> ডাউনলোড</span>`}
          </div>
        </div>`;
      }).join(''):'<div class="empty-notice"><i class="fa-regular fa-bell-slash"></i>কোনো নোটিশ পাওয়া যায়নি।</div>';

      const summary=document.querySelector('[data-notice-summary]');
      if(summary){
        const from=filtered.length?start+1:0;
        const to=filtered.length?Math.min(start+perPage,filtered.length):0;
        summary.textContent=`${filtered.length}টির মধ্যে ${from}–${to} দেখানো হচ্ছে`;
      }

      const pager=document.querySelector('[data-pagination]');
      if(pager){
        let buttons=`<button class="page-btn notice-prev" ${page<=1?'disabled':''}>আগে</button>`;
        const first=Math.max(1,page-2), last=Math.min(totalPages,first+4);
        for(let p=first;p<=last;p++)buttons+=`<button class="page-btn notice-page-number ${p===page?'active':''}" data-page="${p}">${p}</button>`;
        buttons+=`<button class="page-btn notice-next" ${page>=totalPages?'disabled':''}>পরবর্তী</button>`;
        pager.innerHTML=buttons;
      }
    }
  }

  function bindNoticeArchive(){
    const list=document.querySelector('[data-all-notices]');
    if(!list)return;
    const search=document.getElementById('noticeSearch');
    const size=document.getElementById('noticePageSize');
    if(search)search.addEventListener('input',()=>{list.dataset.page='1';renderAll();});
    if(size)size.addEventListener('change',()=>{list.dataset.page='1';renderAll();});
    document.addEventListener('click',e=>{
      const num=e.target.closest('.notice-page-number');
      const prev=e.target.closest('.notice-prev');
      const next=e.target.closest('.notice-next');
      if(num){list.dataset.page=num.dataset.page;renderAll();}
      else if(prev&&!prev.disabled){list.dataset.page=String(Math.max(1,parseInt(list.dataset.page||'1',10)-1));renderAll();}
      else if(next&&!next.disabled){list.dataset.page=String(parseInt(list.dataset.page||'1',10)+1);renderAll();}
    });
  }

  async function loadServerNotices(){
    try{
      const res=await fetch('/.netlify/functions/public-api?kind=notices',{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      const data=await res.json();
      if(Array.isArray(data)){
        serverRows=data.map(n=>({
          id:n.id,title:n.title||'',date:n.date||'',details:n.details||'',has_file:!!n.has_file
        }));
      }
    }catch(e){
      serverRows=null;
    }
    renderAll();
  }

  function start(){
    renderAll();
    bindNoticeArchive();
    loadServerNotices();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
  window.addEventListener('storage',()=>{if(!serverRows)renderAll();});
})();