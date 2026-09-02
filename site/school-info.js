(function(){
  const defaults={
    nameBn:'বল্লভপুর উচ্চ বিদ্যালয়',
    nameEn:'Ballovpur High School',
    address:'পোস্ট: নাগেশ্বরী, উপজেলা: নাগেশ্বরী, জেলা: কুড়িগ্রাম',
    shortAddress:'নাগেশ্বরী, কুড়িগ্রাম',
    phone:'01792838223',
    email:'ballovpurhighschool@gmail.com',
    established:'১৯৯১',
    schoolLogo:'sc.png',
    boardLogo:'sc.png',
    facebook:'',
    youtube:''
  };
  let current=Object.assign({},defaults);

  const oldBnNames=['বল্লভপুর উচ্চ বিদ্যালয়','বল্লভপুর উচ্চ বিদ্যালয়'];
  const oldEnNames=['Ballovpur High School'];

  function replaceSchoolNames(value){
    if(value===null || value===undefined) return value;
    let out=String(value);
    oldBnNames.forEach(v=>{out=out.split(v).join(current.nameBn||defaults.nameBn)});
    oldEnNames.forEach(v=>{out=out.split(v).join(current.nameEn||defaults.nameEn)});
    return out;
  }

  function syncNode(root){
    if(!root) return;
    if(root.nodeType===Node.TEXT_NODE){
      const next=replaceSchoolNames(root.nodeValue);
      if(next!==root.nodeValue) root.nodeValue=next;
      return;
    }
    if(root.nodeType!==Node.ELEMENT_NODE && root.nodeType!==Node.DOCUMENT_NODE && root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE) return;

    if(root.nodeType===Node.ELEMENT_NODE){
      ['title','alt','placeholder','value','aria-label'].forEach(attr=>{
        if(root.hasAttribute && root.hasAttribute(attr)){
          const before=root.getAttribute(attr), after=replaceSchoolNames(before);
          if(after!==before) root.setAttribute(attr,after);
        }
      });
    }

    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let n;
    while((n=walker.nextNode())){
      const next=replaceSchoolNames(n.nodeValue);
      if(next!==n.nodeValue) n.nodeValue=next;
    }
    if(root.querySelectorAll){
      root.querySelectorAll('[title],[alt],[placeholder],[value],[aria-label]').forEach(el=>{
        ['title','alt','placeholder','value','aria-label'].forEach(attr=>{
          if(el.hasAttribute(attr)){
            const before=el.getAttribute(attr), after=replaceSchoolNames(before);
            if(after!==before) el.setAttribute(attr,after);
          }
        });
      });
    }
  }

  function apply(info){
    current=Object.assign({},defaults,info||{});
    document.querySelectorAll('[data-school]').forEach(el=>{
      const k=el.getAttribute('data-school');
      if(Object.prototype.hasOwnProperty.call(current,k)) el.textContent=current[k];
    });
    document.querySelectorAll('[data-school-logo="school"]').forEach(el=>{if(current.schoolLogo)el.src=current.schoolLogo});
    document.querySelectorAll('[data-school-logo="board"]').forEach(el=>{if(current.boardLogo)el.src=current.boardLogo});

    document.querySelectorAll('[data-school-link]').forEach(el=>{
      const key=el.getAttribute('data-school-link');
      if(key==='phone'){
        const phone=String(current.phone||'').replace(/\s+/g,'');
        if(phone) el.href='tel:'+phone;
      }else if(key==='email'){
        if(current.email){
          const existing=el.getAttribute('href')||'';
          const q=existing.includes('?') ? existing.substring(existing.indexOf('?')) : '';
          el.href='mailto:'+current.email+q;
        }
      }else if(key==='facebook'){
        if(current.facebook){el.href=current.facebook;el.style.display='flex';}
        else{el.href='#';el.style.display='none';}
      }else if(key==='youtube'){
        if(current.youtube){el.href=current.youtube;el.style.display='flex';}
        else{el.href='#';el.style.display='none';}
      }
    });

    // Replace every visible/form/title occurrence of the old school name across the page.
    syncNode(document.documentElement);
    document.dispatchEvent(new CustomEvent('schoolInfoUpdated',{detail:Object.assign({},current)}));
  }

  async function load(){
    try{
      const res=await fetch('/.netlify/functions/public-api?kind=school&_='+Date.now(),{cache:'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      apply(await res.json());
    }catch(e){
      apply(defaults);
    }
  }

  // Keep dynamically created form/print/modal content synchronized too.
  let observerStarted=false;
  function startObserver(){
    if(observerStarted || !document.documentElement) return;
    observerStarted=true;
    const observer=new MutationObserver(mutations=>{
      mutations.forEach(m=>{
        if(m.type==='characterData') syncNode(m.target);
        else m.addedNodes.forEach(syncNode);
      });
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  }

  window.getSchoolInfo=()=>Object.assign({},current);
  window.reloadSchoolInfo=load;
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{startObserver();load();});
  }else{startObserver();load();}
})();
