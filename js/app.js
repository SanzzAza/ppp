const API_M='https://api.sonzaix.indevs.in/melolo';
const API_F='https://aio-api.botraiki.biz/api/flickreels';
const PX=['https://api.codetabs.com/v1/proxy?quest=','https://corsproxy.io/?url=','https://api.allorigins.win/raw?url='];
const PH='https://placehold.co/300x450/1a1a2e/555?text=No+Image';
const PH_EP='https://placehold.co/200x120/1a1a2e/e50914?text=EP+';
const PH_BAN='https://placehold.co/900x350/1a1a2e/e50914?text=DramaCina';

let src='melolo',lang=6,pg=1,heroD=[],heroI=0,heroT=null,view='home',sq='';

const posterCache={};

function cachePoster(d){
    const id=getId(d);
    const raw=rawPoster(d);
    if(id&&raw&&!raw.includes('placehold'))posterCache[id]=raw;
}

function getCachedPoster(id){
    return posterCache[String(id)]||'';
}

function fixImg(url,w){
    if(!url||typeof url!=='string'||url.includes('placehold'))return'';
    if(!url.includes('.heic'))return url;
    const params=w?`&w=${w}&q=80`:'&q=80';
    return`https://wsrv.nl/?url=${encodeURIComponent(url)}&output=webp${params}`;
}

function imgErr(el){
    const orig=el.dataset.orig||'';
    const retry=parseInt(el.dataset.retry||'0');
    const ph=el.dataset.ph||PH;

    if(!orig||!orig.includes('.heic')||retry>=4){
        el.onerror=null;
        el.src=ph;
        return;
    }

    el.dataset.retry=String(retry+1);

    switch(retry){
        case 0:el.src=orig.replace(/\.heic/gi,'.webp');break;
        case 1:el.src=orig.replace(/\.heic/gi,'.jpeg');break;
        case 2:el.src=orig.replace(/\.heic/gi,'.jpg');break;
        case 3:el.src=`https://wsrv.nl/?url=${encodeURIComponent(orig)}&output=jpg&n=-1`;break;
        default:el.src=ph;
    }
}

function imgTag(rawUrl,alt,cls,placeholder,width){
    const ph=placeholder||PH;
    if(!rawUrl||rawUrl.includes('placehold'))return`<img src="${ph}" alt="${alt}" class="${cls||''}" loading="lazy">`;
    const primary=rawUrl.includes('.heic')?fixImg(rawUrl,width):rawUrl;
    return`<img src="${primary}" alt="${alt}" class="${cls||''}" loading="lazy" data-orig="${esc(rawUrl)}" data-ph="${ph}" onerror="imgErr(this)">`;
}

async function api(url){
    console.log('🌐',url);
    try{const r=await fetch(url,{headers:{'Accept':'application/json'}});if(r.ok){const j=await r.json();console.log('✅ Direct');return j}}catch(e){console.warn('⚠️',e.message)}
    for(let i=0;i<PX.length;i++){try{const r=await fetch(PX[i]+encodeURIComponent(url));if(r.ok){let t=await r.text(),j;try{j=JSON.parse(t)}catch{continue}if(j.contents&&typeof j.contents==='string')try{j=JSON.parse(j.contents)}catch{continue}console.log(`✅ P${i+1}`);return j}}catch(e){console.warn(`❌ P${i+1}:`,e.message)}}
    toast('Gagal memuat data');return null;
}

const ML={
    home:p=>api(`${API_M}/home?page=${p}`),
    populer:p=>api(`${API_M}/populer?page=${p}`),
    search:(q,p)=>api(`${API_M}/search?q=${encodeURIComponent(q)}&result=20&page=${p}`),
    detail:id=>api(`${API_M}/detail/${id}`),
    stream:id=>api(`${API_M}/stream/${id}`)
};
const FL={
    home:p=>api(`${API_F}/nexthome?lang=${lang}&page=${p}`),
    trending:()=>api(`${API_F}/trending?lang=${lang}`),
    search:q=>api(`${API_F}/search?q=${encodeURIComponent(q)}&lang=${lang}`),
    detail:id=>api(`${API_F}/drama/${id}?lang=${lang}`)
};

function gv(d,...k){for(const x of k)if(d[x]!==undefined&&d[x]!==null&&d[x]!=='')return d[x];return '';}
function getId(d){return String(gv(d,'drama_id','playlet_id','id','movie_id','vid','_id','slug')||'');}
function getTitle(d){return gv(d,'drama_name','title','name','drama_title','original_title')||'Untitled';}

function rawPoster(d){
    return gv(d,'thumb_url','cover','coverUrl','cover_url','poster','image','thumbnail','poster_url','img','thumb','photo','banner');
}

function getBanner(d){
    const id=getId(d);
    const raw=gv(d,'banner','backdrop','background','thumb_url','cover','poster','image')||rawPoster(d)||getCachedPoster(id);
    if(!raw)return PH_BAN;
    return raw.includes('.heic')?fixImg(raw,900):raw;
}

function getViews(d){return gv(d,'watch_value','hot_num','popularity','views','view_count','play_count');}
function getEpCnt(d){return gv(d,'episode_count','upload_num','total_episodes','episodes_count','ep_count','total_ep');}
function getDesc(d){return gv(d,'description','introduce','synopsis','overview','desc','story','summary','intro');}
function getStatus(d){return gv(d,'status','drama_status','state');}
function getRating(d){return gv(d,'rating','score','star','vote_average');}
function getYear(d){const c=gv(d,'create_time','year','release_year','aired','release_date');if(!c)return'';if(typeof c==='string'&&c.includes('-'))return c.split('-')[0];return c;}
function isNew(d){return d.is_new_book==='1'||d.is_new_book===1||d.isNew===true;}
function getLang(d){return gv(d,'language','lang','region','country');}
function getGenres(d){
    const tl=d.tag_list||d.tagList,tn=d.tag_name||d.tagName||d.tags,g=d.genres||d.genre;
    if(tl&&Array.isArray(tl))return tl.map(t=>typeof t==='string'?t:(t.name||'')).filter(Boolean);
    if(tn){if(typeof tn==='string')return tn.split(/[,|\/、]/).map(s=>s.trim()).filter(Boolean);if(Array.isArray(tn))return tn.map(t=>typeof t==='string'?t:(t.name||'')).filter(Boolean);}
    if(g){if(Array.isArray(g))return g.map(x=>typeof x==='string'?x:(x.name||'')).filter(Boolean);if(typeof g==='string')return g.split(/[,|\/]/).map(s=>s.trim()).filter(Boolean);}
    return[];
}

function getEpVid(ep){return String(gv(ep,'video_id','id','episode_id','ep_id','vid','episodeId','videoId','_id','item_id')||'');}
function getEpNum(ep,i){return gv(ep,'episode','number','episode_number','ep_number','ep','sort','order','section','index')||(i+1);}
function getEpThumb(ep){return gv(ep,'cover','thumbnail','thumb','image','poster','img','pic','thumb_url')||'';}
function getEpUrl(ep){return gv(ep,'url','video_url','stream_url','link','src','source','play_url','file','mp4','hls','embed');}
function fmtDur(s){if(!s)return'';s=parseInt(s);if(isNaN(s))return'';const m=Math.floor(s/60),r=s%60;return`${m}:${r<10?'0':''}${r}`;}

function isDrama(o){
    if(!o||typeof o!=='object'||Array.isArray(o))return false;
    return !!(o.drama_id||o.playlet_id||(o.id&&(o.drama_name||o.title)))||!!((o.drama_name||o.title||o.name)&&(o.thumb_url||o.cover||o.poster||o.image||o.thumbnail));
}
function findDramas(data,dep=0){
    if(dep>6)return[];
    if(Array.isArray(data)){let r=[];for(const i of data){if(isDrama(i))r.push(i);else if(typeof i==='object'&&i!==null)r=r.concat(findDramas(i,dep+1));}return r;}
    if(data&&typeof data==='object'){if(isDrama(data)&&dep>0)return[data];let r=[];for(const k in data){const v=data[k];if(Array.isArray(v)||(typeof v==='object'&&v!==null))r=r.concat(findDramas(v,dep+1));}return r;}
    return[];
}
function extractOne(data){
    if(!data)return null;
    if(data.drama_id||data.playlet_id)return data;
    if(isDrama(data))return data;
    for(const k of['data','drama','result','playlet','detail','info']){if(data[k]&&typeof data[k]==='object'&&!Array.isArray(data[k])&&isDrama(data[k]))return data[k];}
    const f=findDramas(data);return f.length?f[0]:data;
}
function findEps(d){
    if(!d)return[];
    const ek=['video_list','episodes','episode','ep_list','episode_list','eps','sources','videos','sections','play_list','playlist','series','list','items'];
    for(const k of ek){if(d[k]&&Array.isArray(d[k])&&d[k].length>0)return d[k];}
    if(d.data&&typeof d.data==='object'){for(const k of ek){if(d.data[k]&&Array.isArray(d.data[k])&&d.data[k].length>0)return d.data[k];}}
    return[];
}

function esc(s){if(!s)return'';const d=document.createElement('div');d.textContent=String(s);return d.innerHTML;}
function escA(s){return s?String(s).replace(/'/g,"\\'").replace(/"/g,'&quot;'):'';}
function toast(m){document.getElementById('toastTxt').textContent=m;const t=document.getElementById('toast');t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3500);}
function switchSrc(s){src=s;document.querySelectorAll('.src-btn').forEach(b=>b.classList.toggle('active',b.dataset.src===s));if(view==='home')goHome();else if(view==='populer')showPopuler();else if(view==='browse')showBrowse();else if(view==='search')doSearch(sq);}
function setNav(n){document.querySelectorAll('.nav-link[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===n));}
async function goHome(){view='home';pg=1;setNav('home');await renderHome();}
async function showPopuler(){view='populer';pg=1;setNav('populer');await renderPop(1);}
async function showBrowse(){view='browse';pg=1;setNav('browse');await renderBrowse(1);}
function toggleSearch(){const b=document.getElementById('searchBox'),i=document.getElementById('searchInput');if(b.classList.contains('active')){if(i.value.trim())doSearch();else b.classList.remove('active');}else{b.classList.add('active');i.focus();}}
async function doSearch(v){const q=v||document.getElementById('searchInput').value.trim()||document.getElementById('mobileSearchInput').value.trim();if(!q)return;sq=q;view='search';pg=1;setNav('');await renderSearch(q,1);}
function toggleMM(){document.getElementById('mobileMenu').classList.toggle('show');}
function closeMM(){document.getElementById('mobileMenu').classList.remove('show');}

function card(d,s){
    const id=getId(d);if(!id)return'';
    cachePoster(d);
    const title=getTitle(d),views=getViews(d),eps=getEpCnt(d),nw=isNew(d),yr=getYear(d),lg=getLang(d),rating=getRating(d);
    const rawP=rawPoster(d);
    s=s||src;
    return`<div class="d-card" onclick="openDrama('${escA(id)}','${escA(s)}')">
        <div class="c-poster">
            ${imgTag(rawP,esc(title),'',PH,400)}
            <div class="c-badge">
                <span class="${s==='melolo'?'b-src-m':'b-src-f'}">${s==='melolo'?'MLO':'FLK'}</span>
                ${nw?'<span class="b-new">NEW</span>':''}
                ${eps?`<span class="b-eps"><i class="fas fa-play"></i> ${eps}</span>`:''}
                ${views?`<span class="b-views"><i class="fas fa-eye"></i> ${esc(String(views))}</span>`:''}
                ${rating?`<span class="b-views"><i class="fas fa-star"></i> ${rating}</span>`:''}
            </div>
            <div class="c-ov"><div class="play-i"><i class="fas fa-play"></i></div></div>
        </div>
        <div class="c-info">
            <h3 class="c-title">${esc(title)}</h3>
            <p class="c-sub">
                ${eps?`<span><i class="fas fa-film"></i> ${eps} Ep</span>`:''}
                ${yr?`<span><i class="far fa-calendar"></i> ${yr}</span>`:''}
                ${lg?`<span><i class="fas fa-globe"></i> ${esc(lg)}</span>`:''}
            </p>
        </div>
    </div>`;
}

function heroMeta(d){
    return`${getViews(d)?`<span class="gold"><i class="fas fa-eye"></i> ${esc(String(getViews(d)))}</span>`:''}${getRating(d)?`<span class="gold"><i class="fas fa-star"></i> ${getRating(d)}</span>`:''}${getEpCnt(d)?`<span><i class="fas fa-film"></i> ${getEpCnt(d)} Episode</span>`:''}${getYear(d)?`<span><i class="far fa-calendar"></i> ${getYear(d)}</span>`:''}`;
}
function heroHTML(items,s){
    if(!items||!items.length)return'';
    const d=items[0],id=getId(d);
    const dots=items.map((_,i)=>`<div class="h-dot ${i===0?'active':''}" onclick="goSlide(${i})"></div>`).join('');
    return`<section class="hero">
        <div class="hero-bg" id="hBg" style="background-image:url('${getBanner(d)}')"></div>
        <div class="hero-overlay"></div>
        <div class="hero-content" id="hC">
            <div class="hero-badges"><span class="h-badge red"><i class="fas fa-fire"></i> Populer</span><span class="h-badge blue">${s==='melolo'?'Melolo':'FlickReels'}</span></div>
            <h1 class="hero-title" id="hT">${esc(getTitle(d))}</h1>
            <div class="hero-meta" id="hM">${heroMeta(d)}</div>
            <p class="hero-desc" id="hD">${esc(getDesc(d)||'Saksikan drama terbaru dengan subtitle Indonesia.')}</p>
            <div class="hero-buttons" id="hB">
                <button class="btn btn-primary" onclick="openDrama('${escA(id)}','${escA(s)}')"><i class="fas fa-play"></i> Tonton</button>
                <button class="btn btn-secondary" onclick="openDrama('${escA(id)}','${escA(s)}')"><i class="fas fa-info-circle"></i> Detail</button>
            </div>
        </div>
        <div class="hero-ind">${dots}</div>
    </section>`;
}
function startH(){if(heroT)clearInterval(heroT);if(heroD.length<=1)return;heroI=0;heroT=setInterval(()=>{heroI=(heroI+1)%heroD.length;updH(heroI);},5000);}
function goSlide(i){heroI=i;updH(i);if(heroT)clearInterval(heroT);startH();}
function updH(i){
    const d=heroD[i];if(!d)return;const id=getId(d);
    const bg=document.getElementById('hBg');if(bg){bg.style.opacity='0';setTimeout(()=>{bg.style.backgroundImage=`url('${getBanner(d)}')`;bg.style.opacity='1';},300);}
    const t=document.getElementById('hT');if(t)t.textContent=getTitle(d);
    const m=document.getElementById('hM');if(m)m.innerHTML=heroMeta(d);
    const desc=document.getElementById('hD');if(desc)desc.textContent=getDesc(d)||'Saksikan drama terbaru.';
    const b=document.getElementById('hB');if(b)b.innerHTML=`<button class="btn btn-primary" onclick="openDrama('${escA(id)}','${escA(src)}')"><i class="fas fa-play"></i> Tonton</button><button class="btn btn-secondary" onclick="openDrama('${escA(id)}','${escA(src)}')"><i class="fas fa-info-circle"></i> Detail</button>`;
    document.querySelectorAll('.h-dot').forEach((dot,idx)=>dot.classList.toggle('active',idx===i));
}

function pagHTML(p,more,fn){
    let h='<div class="pag">';
    h+=`<button class="pg-btn" onclick="${fn}(${p-1})" ${p<=1?'disabled':''}><i class="fas fa-chevron-left"></i></button>`;
    const s=Math.max(1,p-3),e=p+3;
    if(s>1){h+=`<button class="pg-btn" onclick="${fn}(1)">1</button>`;if(s>2)h+=`<span class="pg-dots">...</span>`;}
    for(let i=s;i<=e;i++)h+=`<button class="pg-btn ${i===p?'act':''}" onclick="${fn}(${i})">${i}</button>`;
    if(more)h+=`<span class="pg-dots">...</span>`;
    h+=`<button class="pg-btn" onclick="${fn}(${p+1})" ${!more?'disabled':''}><i class="fas fa-chevron-right"></i></button></div>`;
    return h;
}
function emptyEl(m){return`<div class="empty"><i class="fas fa-search"></i><h3>Oops!</h3><p>${m}</p></div>`;}
function loadEl(t){return`<div class="ld"><div class="sp"></div><span class="ld-t">${t}</span></div>`;}
function footerEl(){return`<footer class="footer"><div class="footer-b">DramaCina</div><p>Nonton drama China & Asia subtitle Indonesia terlengkap.</p><div class="footer-l"><a href="#" onclick="goHome();return false">Beranda</a><a href="#" onclick="showPopuler();return false">Populer</a><a href="#" onclick="showBrowse();return false">Jelajahi</a></div><p style="margin-top:14px;opacity:.4;font-size:10px">&copy; 2025 DramaCina</p></footer>`;}

async function renderHome(){
    const main=document.getElementById('main');main.innerHTML=loadEl('Memuat drama terbaik...');
    let pop=[],home=[];
    if(src==='melolo'){const[a,b]=await Promise.all([ML.populer(1),ML.home(1)]);pop=findDramas(a);home=findDramas(b);}
    else{const[a,b]=await Promise.all([FL.trending(),FL.home(1)]);pop=findDramas(a);home=findDramas(b);}
    pop.forEach(d=>cachePoster(d));
    home.forEach(d=>cachePoster(d));
    heroD=pop.slice(0,5);let html='';
    if(heroD.length)html+=heroHTML(heroD,src);
    if(pop.length){html+=`<section class="section"><div class="sec-h"><h2 class="sec-t"><span class="bar"></span><i class="fas fa-fire" style="color:var(--primary)"></i> Populer</h2><a class="sec-more" onclick="showPopuler()">Lihat Semua <i class="fas fa-arrow-right"></i></a></div><div class="sw"><button class="sc-btn l" onclick="scrollR(this,-1)"><i class="fas fa-chevron-left"></i></button><div class="d-scroll">${pop.map(d=>card(d,src)).join('')}</div><button class="sc-btn r" onclick="scrollR(this,1)"><i class="fas fa-chevron-right"></i></button></div></section>`;}
    if(home.length){html+=`<section class="section"><div class="sec-h"><h2 class="sec-t"><span class="bar"></span> Drama Terbaru</h2><a class="sec-more" onclick="showBrowse()">Lihat Semua <i class="fas fa-arrow-right"></i></a></div><div class="d-grid">${home.map(d=>card(d,src)).join('')}</div></section>`;}
    if(!pop.length&&!home.length)html+=emptyEl('Tidak bisa memuat drama.');
    html+=footerEl();main.innerHTML=html;startH();
}

async function renderPop(p){
    pg=p||1;const main=document.getElementById('main');main.innerHTML=loadEl('Memuat drama populer...');
    let list=[];if(src==='melolo')list=findDramas(await ML.populer(pg));else list=findDramas(await FL.trending());
    list.forEach(d=>cachePoster(d));
    const more=list.length>=8;
    let html=`<section class="section" style="padding-top:22px"><div class="sec-h"><h2 class="sec-t"><span class="bar"></span><i class="fas fa-fire" style="color:var(--primary)"></i> Populer</h2><span class="ep-badge">${list.length} drama &bull; Hal. ${pg}</span></div>${list.length?`<div class="d-grid">${list.map(d=>card(d,src)).join('')}</div>`:emptyEl('Tidak ada.')}${list.length?pagHTML(pg,more,'renderPop'):''}</section>`;
    html+=footerEl();main.innerHTML=html;window.scrollTo({top:0,behavior:'smooth'});
}

async function renderBrowse(p){
    if(p<1)return;pg=p;const main=document.getElementById('main');main.innerHTML=loadEl(`Memuat halaman ${p}...`);
    let list=[];if(src==='melolo')list=findDramas(await ML.home(p));else list=findDramas(await FL.home(p));
    list.forEach(d=>cachePoster(d));
    const more=list.length>=6;
    let html=`<section class="section" style="padding-top:22px"><div class="sec-h"><h2 class="sec-t"><span class="bar"></span> Jelajahi</h2><span class="ep-badge">Hal. ${p} &bull; ${list.length}</span></div>${list.length?`<div class="d-grid">${list.map(d=>card(d,src)).join('')}</div>${pagHTML(p,more,'renderBrowse')}`:emptyEl('Tidak ada.')+(p>1?pagHTML(p,false,'renderBrowse'):'')}</section>`;
    html+=footerEl();main.innerHTML=html;window.scrollTo({top:0,behavior:'smooth'});
}

async function renderSearch(q,p){
    pg=p||1;const main=document.getElementById('main');main.innerHTML=loadEl(`Mencari "${q}"...`);
    let list=[];if(src==='melolo')list=findDramas(await ML.search(q,pg));else list=findDramas(await FL.search(q));
    list.forEach(d=>cachePoster(d));
    const more=list.length>=8;
    let html=`<section class="section" style="padding-top:22px"><div class="sr-h"><h2>Hasil: <span>"${esc(q)}"</span></h2><p>${list.length} drama</p></div>${list.length?`<div class="d-grid" style="margin-top:16px">${list.map(d=>card(d,src)).join('')}</div>${src==='melolo'?pagHTML(pg,more,'renderSP'):''}`:emptyEl(`Tidak ditemukan "${esc(q)}"`)} </section>`;
    html+=footerEl();main.innerHTML=html;window.scrollTo({top:0,behavior:'smooth'});
}
function renderSP(p){renderSearch(sq,p);}

async function openDrama(id,s){
    id=String(id).trim();s=s||src;
    if(!id||id==='undefined'||id==='null'){toast('ID tidak valid');return;}

    const modal=document.getElementById('dramaModal'),inner=document.getElementById('modalInner');
    modal.classList.add('show');document.body.style.overflow='hidden';
    inner.innerHTML=loadEl('Memuat detail...');

    const data=s==='melolo'?await ML.detail(id):await FL.detail(id);
    if(!data){inner.innerHTML=`<div class="empty" style="min-height:300px"><i class="fas fa-exclamation-triangle"></i><h3>Gagal Memuat</h3><button class="btn btn-primary" style="margin-top:12px" onclick="openDrama('${escA(id)}','${escA(s)}')"><i class="fas fa-redo"></i> Coba Lagi</button></div>`;return;}

    const d=extractOne(data);
    const eps=findEps(d)||findEps(data);

    if(!d){inner.innerHTML=`<div class="empty" style="min-height:300px"><i class="fas fa-exclamation-triangle"></i><h3>Data Tidak Ditemukan</h3></div>`;return;}

    const title=getTitle(d),desc=getDesc(d),genres=getGenres(d),
          epCnt=getEpCnt(d),views=getViews(d),status=getStatus(d),
          rating=getRating(d),yr=getYear(d),lg=getLang(d);

    const rawP=rawPoster(d)||getCachedPoster(id);
    const firstEpCover=eps.length>0?getEpThumb(eps[0],1):'';
    const posterRaw=rawP||firstEpCover;
    const bannerRaw=rawP||firstEpCover;

    inner.innerHTML=`
        <div class="mod-ban">
            ${imgTag(bannerRaw,esc(title),'',PH_BAN,900)}
            <div class="mod-ban-ov"></div>
            <div class="mod-pa">
                <div class="mod-poster">${imgTag(posterRaw,esc(title),'',PH,400)}</div>
                <div class="mod-ta">
                    <h2>${esc(title)}</h2>
                    <div class="meta-r">
                        ${rating?`<span style="color:var(--gold)"><i class="fas fa-star"></i> ${rating}</span>`:''}
                        ${views?`<span style="color:var(--gold)"><i class="fas fa-eye"></i> ${esc(String(views))}</span>`:''}
                        ${epCnt?`<span><i class="fas fa-film"></i> ${epCnt} Ep</span>`:''}
                        ${yr?`<span><i class="far fa-calendar"></i> ${yr}</span>`:''}
                        ${status?`<span><i class="fas fa-circle" style="font-size:6px;color:var(--green)"></i> ${esc(status)}</span>`:''}
                        ${lg?`<span><i class="fas fa-globe"></i> ${esc(lg)}</span>`:''}
                        <span style="color:var(--blue)">${s==='melolo'?'Melolo':'FlickReels'}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="mod-body">
            ${desc?`<p class="mod-desc">${esc(desc)}</p>`:''}
            ${genres.length?`<div class="mod-tags">${genres.map(g=>`<span class="mod-tag">${esc(g)}</span>`).join('')}</div>`:''}
            <div class="info-grid">
                ${epCnt?`<div class="info-item"><div class="lbl">Episode</div><div class="val">${epCnt}</div></div>`:''}
                ${views?`<div class="info-item"><div class="lbl">Views</div><div class="val"><i class="fas fa-eye" style="color:var(--primary);font-size:11px"></i> ${esc(String(views))}</div></div>`:''}
                ${yr?`<div class="info-item"><div class="lbl">Tahun</div><div class="val">${yr}</div></div>`:''}
                ${lg?`<div class="info-item"><div class="lbl">Bahasa</div><div class="val">${esc(lg)}</div></div>`:''}
                <div class="info-item"><div class="lbl">Sumber</div><div class="val">${s==='melolo'?'🎬 Melolo':'🎞️ FlickReels'}</div></div>
            </div>
            <div class="ep-sec">
                <div class="ep-h">
                    <h3><i class="fas fa-list-ol"></i> Daftar Episode</h3>
                    ${eps.length?`<span class="ep-badge">${eps.length} Episode</span>`:''}
                </div>
                ${eps.length>0
                    ?`<div class="ep-grid">${eps.map((ep,i)=>epCard(ep,i,title,s)).join('')}</div>`
                    :`<div class="empty" style="padding:30px 12px"><i class="fas fa-video" style="font-size:32px"></i><h3>Episode Belum Tersedia</h3></div>`
                }
            </div>
        </div>`;
}

function epCard(ep,i,dTitle,s){
    const num=getEpNum(ep,i),rawThumb=getEpThumb(ep,num),dur=ep.duration,vidId=getEpVid(ep),url=getEpUrl(ep);
    const durStr=dur?fmtDur(dur):'';
    let oc;
    if(s==='melolo'&&vidId)oc=`streamML('${escA(vidId)}','${escA(dTitle)} - Episode ${num}')`;
    else if(url)oc=`playVid('${escA(url)}','${escA(dTitle)} - Episode ${num}')`;
    else oc=`toast('Link tidak tersedia')`;
    return`<div class="ep-card" onclick="${oc}">
        <div class="ep-num">${num}</div>
        <div class="ep-thumb">
            ${imgTag(rawThumb,'Ep '+num,'',PH_EP+num,200)}
            <div class="ep-pl"><i class="fas fa-play-circle"></i></div>
        </div>
        <div class="ep-inf">
            <h4>Episode ${num}</h4>
            <p>${durStr?`<i class="far fa-clock"></i> ${durStr}`:`Episode ke-${num}`}</p>
        </div>
        ${durStr?`<div class="ep-dur"><i class="far fa-clock"></i> ${durStr}</div>`:''}
    </div>`;
}

async function streamML(vidId,title){
    if(!vidId||vidId==='undefined'){toast('ID tidak valid');return;}
    toast('Memuat video...');
    const data=await ML.stream(vidId);
    if(!data){toast('Gagal memuat stream');return;}

    let url='';
    url=gv(data,'url','video_url','stream_url','playUrl','streamUrl','src','link','file','mp4','hls','play_url','videoUrl','stream','video');
    if(!url&&data.data){
        if(typeof data.data==='string'&&data.data.startsWith('http'))url=data.data;
        else if(typeof data.data==='object')url=gv(data.data,'url','video_url','stream_url','playUrl','streamUrl','src','link','file','mp4','hls','play_url','videoUrl','stream','video');
    }
    if(!url&&data.result){
        if(typeof data.result==='string'&&data.result.startsWith('http'))url=data.result;
        else if(typeof data.result==='object')url=gv(data.result,'url','video_url','stream_url','playUrl','src','link','file');
    }
    if(!url){
        const find=(o,d=0)=>{
            if(url||d>4||!o||typeof o!=='object')return;
            for(const k in o){
                const v=o[k];
                if(typeof v==='string'&&v.startsWith('http')&&(v.includes('.mp4')||v.includes('.m3u8')||v.includes('video')||v.includes('stream')||v.includes('play')||v.includes('media'))){url=v;return;}
                if(typeof v==='object')find(v,d+1);
            }
        };
        find(data);
    }
    if(!url){
        const find2=(o,d=0)=>{
            if(url||d>3||!o||typeof o!=='object')return;
            for(const k in o){
                const v=o[k];
                if(typeof v==='string'&&v.startsWith('http')&&!v.includes('.heic')&&!v.includes('.jpg')&&!v.includes('.png')&&!v.includes('.webp')&&!v.includes('.jpeg')&&!v.includes('novel-images')&&!v.includes('placehold')){url=v;return;}
                if(typeof v==='object')find2(v,d+1);
            }
        };
        find2(data);
    }
    if(url){
        playVid(url,title);
    }else{
        toast('URL video tidak ditemukan');
    }
}

function playVid(url,title){
    if(!url||url==='#'||url==='undefined'||url===''){toast('Link tidak tersedia');return;}
    const ov=document.getElementById('playerOv'),area=document.getElementById('plArea');
    document.getElementById('plTitle').textContent=title;
    document.getElementById('plInfo').textContent=`Sumber: ${src==='melolo'?'Melolo':'FlickReels'}`;
    if(url.match(/\.(mp4|webm|ogg)(\?|$)/i)){
        area.innerHTML=`<video src="${url}" controls autoplay playsinline></video>`;
    }else if(url.includes('.m3u8')){
        area.innerHTML=`<video id="hlsV" controls autoplay playsinline></video>`;
        const v=document.getElementById('hlsV');
        if(v.canPlayType('application/vnd.apple.mpegurl'))v.src=url;
        else area.innerHTML=`<iframe src="${url}" frameborder="0" allowfullscreen allow="autoplay;encrypted-media;picture-in-picture"></iframe>`;
    }else{
        area.innerHTML=`<iframe src="${url}" frameborder="0" allowfullscreen allow="autoplay;encrypted-media;picture-in-picture"></iframe>`;
    }
    ov.classList.add('show');document.body.style.overflow='hidden';
}

function closePl(){
    document.getElementById('plArea').innerHTML='';
    document.getElementById('playerOv').classList.remove('show');
    if(!document.getElementById('dramaModal').classList.contains('show'))document.body.style.overflow='';
}

function closeModal(){
    document.getElementById('dramaModal').classList.remove('show');
    document.body.style.overflow='';
}

function scrollR(b,d){
    b.parentElement.querySelector('.d-scroll').scrollBy({left:450*d,behavior:'smooth'});
}

window.addEventListener('scroll',()=>{
    document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>50);
    document.getElementById('btt').classList.toggle('show',window.scrollY>500);
});

document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
        if(document.getElementById('playerOv').classList.contains('show'))closePl();
        else if(document.getElementById('dramaModal').classList.contains('show'))closeModal();
    }
    if((e.ctrlKey||e.metaKey)&&e.key==='k'){
        e.preventDefault();
        document.getElementById('searchBox').classList.add('active');
        document.getElementById('searchInput').focus();
    }
});

(async()=>{
    await goHome();
})();
