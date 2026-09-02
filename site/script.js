document.addEventListener("DOMContentLoaded", function(){
    // ===== Main slider — supports Web Management dynamic slides =====
    let slides=[],dots=[],current=0,timer;
    function bindDots(){
        dots.forEach((d,i)=>{d.onclick=()=>{showSlide(i);startSlider()};});
    }
    function refreshSlides(){
        slides=[...document.querySelectorAll(".slide")];
        dots=[...document.querySelectorAll(".slider-dots .dot")];
        current=0; bindDots(); showSlide(0); startSlider();
    }
    function showSlide(i){
        if(!slides.length)return;
        current=(i+slides.length)%slides.length;
        slides.forEach((s,n)=>s.classList.toggle("active",n===current));
        dots.forEach((d,n)=>d.classList.toggle("active",n===current));
    }
    function startSlider(){clearInterval(timer);if(slides.length>1)timer=setInterval(()=>showSlide(current+1),5000)}
    document.getElementById("prevSlide")?.addEventListener("click",()=>{showSlide(current-1);startSlider()});
    document.getElementById("nextSlide")?.addEventListener("click",()=>{showSlide(current+1);startSlider()});
    window.addEventListener("slidesUpdated",refreshSlides);
    refreshSlides();

    // ===== Menu bar: click-to-open dropdowns (stay open after mouse leaves) =====
    const menuBtn=document.getElementById("mobileMenuBtn"),menu=document.querySelector(".main-menu"),mainMenu=document.getElementById("mainMenu");
    menuBtn?.addEventListener("click",()=>menu.classList.toggle("menu-open"));

    const submenuParents=[...document.querySelectorAll("#mainMenu > .has-submenu")];
    function closeSubmenus(except=null){
        submenuParents.forEach(item=>{
            if(item!==except){
                item.classList.remove("open");
                const a=item.querySelector(":scope > a");
                if(a) a.setAttribute("aria-expanded","false");
            }
        });
    }
    submenuParents.forEach(item=>{
        const link=item.querySelector(":scope > a");
        if(!link)return;
        link.setAttribute("aria-haspopup","true");
        link.setAttribute("aria-expanded","false");
        link.addEventListener("click",function(e){
            // Parent menu links open/close the submenu. They do not navigate away.
            e.preventDefault();
            const willOpen=!item.classList.contains("open");
            closeSubmenus(willOpen?item:null);
            item.classList.toggle("open",willOpen);
            this.setAttribute("aria-expanded",willOpen?"true":"false");
        });
    });

    // Clicking anywhere outside the menu closes the currently open dropdown.
    // Moving the mouse away does NOT close it.
    document.addEventListener("click",function(e){
        if(!mainMenu?.contains(e.target) && !menuBtn?.contains(e.target)) closeSubmenus();
    });

    // Escape closes the open dropdown.
    document.addEventListener("keydown",function(e){
        if(e.key==="Escape") closeSubmenus();
    });

    // ===== Real-time Bangladesh clock =====
    const clock=document.getElementById("liveClock");
    function updateClock(){
        if(!clock)return;
        const now=new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Dhaka"}));
        let h=now.getHours(),m=now.getMinutes(),s=now.getSeconds();
        const ap=h>=12?"PM":"AM";h=h%12||12;
        clock.querySelector("span").textContent=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} ${ap}`;
    }
    updateClock();setInterval(updateClock,1000);

    // ===== Canvas charts with contained hover tooltips =====
    const bn=s=>String(s).replace(/\d/g,d=>"০১২৩৪৫৬৭৮৯"[d]);
    function setupCanvas(id,type,data){
        const canvas=document.getElementById(id);if(!canvas)return;
        if(canvas._studentChartSetData){canvas._studentChartSetData(data);return;}
        let currentData=data;
        const ctx=canvas.getContext("2d");
        const card=canvas.closest(".chart-card");
        const tooltip=document.getElementById(id+"Tooltip");
        let slices=[];

        function draw(){
            const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
            canvas.width=Math.max(1,Math.round(rect.width*dpr));
            canvas.height=Math.max(1,Math.round(rect.height*dpr));
            ctx.setTransform(dpr,0,0,dpr,0,0);
            const w=rect.width,h=rect.height;
            ctx.clearRect(0,0,w,h);
            slices=[];
            ctx.font='12px Kalpurush, sans-serif';
            ctx.textAlign='center';ctx.textBaseline='middle';

            if(type==='pie'){
                const total=currentData.reduce((a,x)=>a+x.value,0),cx=w/2,cy=h/2,r=Math.min(w,h)*.31;
                let angle=-Math.PI/2;
                currentData.forEach((x,i)=>{
                    const part=x.value/total,end=angle+part*Math.PI*2;
                    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,end);ctx.closePath();
                    ctx.fillStyle=["#006b42","#ed7600","#2a9d70","#8b5e3c","#5b62b8"][i%5];ctx.fill();
                    ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();
                    // Keep labels inside the canvas only.
                    const mid=(angle+end)/2;
                    const tx=cx+Math.cos(mid)*r*.62,ty=cy+Math.sin(mid)*r*.62;
                    if(part>.10){
                        ctx.fillStyle="#fff";ctx.font='bold 11px Kalpurush, sans-serif';
                        ctx.fillText(x.label,tx,ty-7);
                        ctx.font='bold 12px "Times New Roman", serif';
                        ctx.fillText(bn(x.value),tx,ty+9);
                    }
                    slices.push({start:angle,end,x,percent:Math.round(part*100)});
                    angle=end;
                });
            }
        }
        function normalize(a){while(a<0)a+=Math.PI*2;while(a>=Math.PI*2)a-=Math.PI*2;return a}
        function inSlice(angle,start,end){
            start=normalize(start);end=normalize(end);angle=normalize(angle);
            return start<=end ? angle>=start&&angle<=end : angle>=start||angle<=end;
        }
        canvas.addEventListener("mousemove",e=>{
            if(type!=='pie'||!slices.length||!tooltip)return;
            const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
            const cx=r.width/2,cy=r.height/2,dx=x-cx,dy=y-cy,dist=Math.sqrt(dx*dx+dy*dy),angle=Math.atan2(dy,dx);
            const hit=slices.find(s=>dist<=Math.min(r.width,r.height)*.36 && inSlice(angle,s.start,s.end));
            if(hit){
                tooltip.innerHTML=`<strong>${hit.x.label}</strong>${bn(hit.x.value)} জন &nbsp; (${bn(hit.percent)}%)`;
                tooltip.style.display="block";
            }else tooltip.style.display="none";
        });
        canvas.addEventListener("mouseleave",()=>{if(tooltip)tooltip.style.display="none"});
        canvas._studentChartSetData=function(next){currentData=Array.isArray(next)&&next.length?next:[{label:"তথ্য নেই",value:1}];draw();};
        draw();window.addEventListener("resize",draw);
    }
    function refreshStudentCharts(){
        const studentRows=typeof getStudentStats==="function"?getStudentStats():[];
        if(studentRows.length){
            const totals=studentTotals(studentRows);
            setupCanvas("religionChart","pie",[{label:"মুসলিম",value:totals.muslim},{label:"হিন্দু",value:totals.hindu},{label:"খ্রিস্টান",value:totals.christian},{label:"বৌদ্ধ",value:totals.buddhist},{label:"অন্যান্য",value:totals.other}].filter(x=>x.value>0));
            setupCanvas("genderChart","pie",[{label:"ছাত্র",value:totals.male},{label:"ছাত্রী",value:totals.female}].filter(x=>x.value>0));
            setupCanvas("classChart","pie",studentRows.map(r=>({label:r.className,value:(+r.total||((+r.male||0)+(+r.female||0)))})).filter(x=>x.value>0));
        }else{
            setupCanvas("religionChart","pie",[{label:"তথ্য নেই",value:1}]);
            setupCanvas("genderChart","pie",[{label:"তথ্য নেই",value:1}]);
            setupCanvas("classChart","pie",[{label:"তথ্য নেই",value:1}]);
        }
    }
    refreshStudentCharts();
    window.addEventListener('studentStatsUpdated',refreshStudentCharts);
});

// ===== Smooth ping-pong scrolling =====
document.addEventListener("DOMContentLoaded", function(){
    function pingPongScroll(selector,speed){
        const el=document.querySelector(selector);if(!el)return;
        let direction=1,paused=false,last=performance.now();
        const pause=()=>paused=true,resume=()=>paused=false;
        el.addEventListener("mouseenter",pause);el.addEventListener("mouseleave",resume);
        el.addEventListener("focusin",pause);el.addEventListener("focusout",resume);
        el.addEventListener("touchstart",pause,{passive:true});
        el.addEventListener("touchend",()=>setTimeout(resume,900),{passive:true});
        function frame(now){
            const dt=Math.min(32,now-last);last=now;
            if(!paused && el.dataset.manualPause !== "1"){
                const max=Math.max(0,el.scrollWidth-el.clientWidth);
                if(max>2){
                    el.scrollLeft+=direction*speed*(dt/16.67);
                    if(el.scrollLeft>=max){el.scrollLeft=max;direction=-1}
                    if(el.scrollLeft<=0){el.scrollLeft=0;direction=1}
                }
            }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }
    pingPongScroll(".person-scroll",0.65);
    pingPongScroll(".achiever-scroll",0.62);
    pingPongScroll(".gallery-scroll",0.85);
});

// ===== Manual carousel buttons: reliable left/right controls =====
document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll(".carousel-btn").forEach(btn=>{
        btn.addEventListener("click",function(e){
            e.preventDefault();
            e.stopPropagation();

            const target=this.dataset.target;
            const el=document.querySelector("."+target);
            if(!el)return;

            // Pause the automatic ping-pong animation briefly so the manual
            // click always wins and the user can inspect the next cards.
            el.dataset.manualPause="1";
            clearTimeout(el._manualResumeTimer);
            el._manualResumeTimer=setTimeout(()=>{
                el.dataset.manualPause="0";
            },1400);

            const cards=el.querySelectorAll(".person-card, .achiever-card");
            const firstCard=cards[0];
            const gap=parseFloat(getComputedStyle(el).gap)||12;
            const step=firstCard ? Math.round(firstCard.getBoundingClientRect().width + gap) : Math.round(el.clientWidth*.72);
            const visibleStep=Math.max(step,Math.round(el.clientWidth*.72));
            const max=Math.max(0,el.scrollWidth-el.clientWidth);
            const isNext=this.classList.contains("carousel-next");
            const current=el.scrollLeft;
            const next=isNext ? Math.min(max,current+visibleStep) : Math.max(0,current-visibleStep);

            // scrollBy() can be ignored in some embedded/local preview engines;
            // assigning scrollLeft is universally reliable.
            el.scrollTo({left:next,behavior:"smooth"});
            setTimeout(()=>{
                if(Math.abs(el.scrollLeft-next)>3) el.scrollLeft=next;
            },420);
        });
    });
});

// ===== V17: dedicated achiever carousel controls =====
document.addEventListener("DOMContentLoaded", function(){
    const wrap=document.querySelector(".achiever-carousel-wrap");
    const track=document.querySelector(".achiever-scroll");
    if(!wrap || !track) return;
    const prev=wrap.querySelector(".carousel-prev");
    const next=wrap.querySelector(".carousel-next");
    let resumeTimer;

    function move(dir){
        const card=track.querySelector(".achiever-card");
        if(!card) return;
        const gap=parseFloat(getComputedStyle(track).gap)||12;
        const step=card.getBoundingClientRect().width+gap;
        const max=Math.max(0, track.scrollWidth-track.clientWidth);
        let target=track.scrollLeft + dir*step;
        target=Math.max(0,Math.min(max,target));

        track.dataset.manualPause="1";
        clearTimeout(resumeTimer);
        track.scrollTo({left:target,behavior:"smooth"});
        resumeTimer=setTimeout(()=>{track.dataset.manualPause="0";},1800);
    }

    if(prev){
        prev.onclick=function(e){e.preventDefault();e.stopPropagation();move(-1);};
    }
    if(next){
        next.onclick=function(e){e.preventDefault();e.stopPropagation();move(1);};
    }
});
