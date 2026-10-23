'use strict';

const CATEGORIES = [
  {id:'animals',title:'حیوانات',icon:'🐾',color:'lavender',words:['گربه','سگ','شیر','فیل','زرافه','پنگوئن','خرگوش','اسب','دلفین','روباه','لاک‌پشت','طوطی','میمون','خرس','گرگ']},
  {id:'food',title:'خوراکی‌ها',icon:'🍓',color:'peach',words:['پیتزا','بستنی','قرمه‌سبزی','هندوانه','فلافل','کباب','شکلات','آش رشته','پاپ‌کورن','ماکارونی','انار','دونات','املت','چیپس','باقلوا']},
  {id:'places',title:'مکان‌ها',icon:'🗺️',color:'mint',words:['کتابخانه','فرودگاه','سینما','بیمارستان','مدرسه','موزه','پارک آبی','ایستگاه قطار','رستوران','هتل','استادیوم','مزرعه','جزیره','بازار','قلعه']},
  {id:'jobs',title:'مشاغل',icon:'🧑‍🚀',color:'lavender',words:['پزشک','معلم','آتش‌نشان','آشپز','فضانورد','عکاس','بازیگر','خلبان','نجار','کارآگاه','باغبان','نقاش','دامپزشک','خبرنگار','موسیقی‌دان']},
  {id:'home',title:'وسایل خانه',icon:'🛋️',color:'peach',words:['یخچال','جاروبرقی','مبل','آینه','کتری','چراغ مطالعه','ماشین لباس‌شویی','بالش','ساعت دیواری','پنکه','تخت‌خواب','قابلمه','اتو','تلویزیون','گلدان']},
  {id:'tech',title:'تکنولوژی',icon:'🎧',color:'mint',words:['گوشی هوشمند','ربات','هواپیمای بدون سرنشین','هدفون','کنسول بازی','لپ‌تاپ','چاپگر سه‌بعدی','ماهواره','دوربین دیجیتال','واقعیت مجازی','صفحه‌کلید','فلش مموری','هوش مصنوعی','ساعت هوشمند','تلسکوپ']},
  {id:'sports',title:'ورزش‌ها',icon:'⚽',color:'peach',words:['فوتبال','والیبال','بسکتبال','شنا','تنیس','دوچرخه‌سواری','کشتی','کوهنوردی','بدمینتون','اسکی','بوکس','ژیمناستیک','شطرنج','قایق‌رانی','تیراندازی']},
  {id:'nature',title:'طبیعت',icon:'🌿',color:'mint',words:['آبشار','رنگین‌کمان','آتشفشان','کویر','جنگل','دریاچه','یخچال طبیعی','غار','رعدوبرق','گل آفتابگردان','چشمه','کوهستان','شفق قطبی','مرجان','ماه کامل']},
  {id:'vehicles',title:'وسایل نقلیه',icon:'🚲',color:'lavender',words:['قطار','هلیکوپتر','اتوبوس','زیردریایی','موتورسیکلت','تاکسی','کشتی','بالن','تراکتور','اسکوتر','کامیون','مترو','قایق پارویی','ماشین مسابقه','تراموا']},
  {id:'arts',title:'سرگرمی و هنر',icon:'🎨',color:'peach',words:['گیتار','عروسک‌گردانی','نقاشی','شعبده‌بازی','فیلم سینمایی','بازی فکری','کارائوکه','داستان مصور','اوریگامی','سفالگری','شعر','عکاسی','بازی ویدیویی','رقص','ساز سنتی']}
];
const DEFAULT_SETTINGS = {players:6,spies:1,duration:180,categoryIds:['all'],voteMode:'group',roundLimit:5,guessEnabled:true,soundEnabled:false};
const DEFAULT_PREFS = {theme:'light',reduceMotion:false};
const STORE_KEY = 'jasoos-pwa-state-v1';
let appData = loadData();
let revealOpen = false;
let rolePeek = false;
let toastTimer = null;
let tickTimer = null;
let installPrompt = null;
let modalState = null;
let timerPaintAt = 0;
let beepContext = null;

function loadData(){
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return {settings:{...DEFAULT_SETTINGS},prefs:{...DEFAULT_PREFS},names:[],customWords:{},history:[],game:null,screen:'home'};
    const parsed = JSON.parse(raw);
    return {settings:{...DEFAULT_SETTINGS,...parsed.settings},prefs:{...DEFAULT_PREFS,...parsed.prefs},names:Array.isArray(parsed.names)?parsed.names:[],customWords:parsed.customWords||{},history:Array.isArray(parsed.history)?parsed.history:[],game:parsed.game||null,screen:parsed.screen||'home'};
  } catch(e) { return {settings:{...DEFAULT_SETTINGS},prefs:{...DEFAULT_PREFS},names:[],customWords:{},history:[],game:null,screen:'home'}; }
}
function saveData(){
  try {
    const copy = JSON.parse(JSON.stringify(appData));
    localStorage.setItem(STORE_KEY,JSON.stringify(copy));
  } catch(e) { console.warn('ذخیره‌سازی محلی انجام نشد.',e); }
}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function normalizeFa(s){return String(s||'').normalize('NFC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ۀة]/g,'ه').replace(/[\u064B-\u065F\u0670]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('fa');}
function categoryWords(id){const cat=CATEGORIES.find(c=>c.id===id);return (appData.customWords[id]&&appData.customWords[id].length?appData.customWords[id]:cat?.words)||[];}
function allSelectedWords(){
  let ids=appData.settings.categoryIds||['all'];
  const categories=ids.includes('all')?CATEGORIES:CATEGORIES.filter(c=>ids.includes(c.id));
  const unique=new Map();
  categories.forEach(cat=>categoryWords(cat.id).forEach(word=>{const clean=String(word).trim();if(clean) unique.set(normalizeFa(clean),{id:normalizeFa(clean),text:clean,categoryId:cat.id,categoryTitle:cat.title});}));
  return [...unique.values()];
}
function randInt(max){if(max<=1)return 0;try{const arr=new Uint32Array(1);crypto.getRandomValues(arr);return arr[0]%max;}catch(e){return Math.floor(Math.random()*max);}}
function shuffle(list){const out=[...list];for(let i=out.length-1;i>0;i--){const j=randInt(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
function uuid(prefix='p'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;}
function getGame(){return appData.game;}
function setScreen(screen){appData.screen=screen;saveData();render();}
function toast(message){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2500);}
function currentPlayer(id){return appData.game?.players?.find(p=>p.id===id)||appData.game?.allPlayers?.find(p=>p.id===id);}
function allPlayers(){return appData.game?.players||[];}
function currentRoundNumber(){return appData.game?.round||1;}
function formatTime(sec){sec=Math.max(0,Math.ceil(sec||0));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
function backButton(target='home',label='بازگشت'){return `<div class="back-row"><button class="back-link" data-action="${target==='home'?'home':`go-${target}`}">← ${label}</button></div>`;}
function render(){
  const app=document.getElementById('app'); if(!app)return;
  document.body.classList.toggle('dark-mode',appData.prefs.theme==='dark');
  const screens={home:renderHome,setup:renderSetup,names:renderNames,roles:renderRoles,discussion:renderDiscussion,voteGroup:renderGroupVote,voteSecret:renderSecretVote,voteHandoff:renderVoteHandoff,voteTie:renderVoteTie,guess:renderGuess,roundResult:renderRoundResult,finalResult:renderFinalResult,history:renderHistory,settings:renderSettings,categories:renderCategories};
  const fn=screens[appData.screen]||renderHome;
  app.innerHTML=fn();
  if(modalState) renderModal();
  syncTick();
}
function iconEye(){return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M4 24c5.3-7.7 12-11.5 20-11.5S38.7 16.3 44 24c-5.3 7.7-12 11.5-20 11.5S9.3 31.7 4 24Z" stroke="currentColor" stroke-width="2.5"/><circle cx="24" cy="24" r="6.5" stroke="currentColor" stroke-width="2.5"/><circle cx="24" cy="24" r="2.3" fill="currentColor"/></svg>`;}
function renderHome(){
  const g=appData.game, hasResume=g&&!g.finished;
  const rounds=appData.history.length;
  const people=appData.names.length;
  return `<section class="hero glass">
    <div class="hero-illustration">${iconEye()}</div>
    <span class="eyebrow"><span class="dot"></span> بازی گروهی، هیجان واقعی</span>
    <h1>یه نفر، یه راز… <span style="color:#8273ee">یک جاسوس!</span></h1>
    <p>همه یک کلمه را می‌دانند، به‌جز جاسوس.<br>حرف بزنید، شک کنید و قبل از تمام شدن زمان پیدایش کنید.</p>
    <div class="hero-actions">${hasResume?`<button class="btn btn-primary" data-action="resume">▶ ادامه بازی</button>`:''}<button class="btn btn-primary" data-action="new-game">✦ ${hasResume?'شروع بازی تازه':'شروع بازی'}</button><button class="btn btn-secondary" data-action="rules">ⓘ قوانین بازی</button></div>
  </section>
  <section class="stats-strip">
    <div class="mini-stat glass"><span class="stat-icon lavender">🧩</span><div><strong>۱۰</strong><span>دسته‌بندی کلمه</span></div></div>
    <div class="mini-stat glass"><span class="stat-icon mint">🗂️</span><div><strong>۱۵۰</strong><span>کلمه پیش‌فرض</span></div></div>
    <div class="mini-stat glass"><span class="stat-icon peach">${people||'👥'}</span><div><strong>${people||'۳ تا ۲۰'}</strong><span>${people?'بازیکن ذخیره‌شده':'تعداد بازیکنان'}</span></div></div>
  </section>
  <div class="section-head"><div><h2>همه‌چیز برای شروع آماده است</h2><p>ساده شروع کنید و بازی را به جمع بسپارید.</p></div></div>
  <section class="quick-grid">
    <button class="quick-card" data-action="categories"><span class="quick-icon">🗃️</span><strong>دسته‌بندی کلمات</strong><small>مشاهده و ویرایش بانک کلمات</small></button>
    <button class="quick-card" data-action="history"><span class="quick-icon">🏆</span><strong>تاریخچه و امتیازها</strong><small>${rounds?`${rounds} بازی ثبت‌شده`:'نتایج بازی‌های قبلی'}</small></button>
    <button class="quick-card" data-action="settings"><span class="quick-icon">🎛️</span><strong>تنظیمات بازی</strong><small>زمان، رأی‌گیری و ظاهر اپ</small></button>
  </section>`;
}
function renderSetup(){
  const s=appData.settings;
  const dur=[60,120,180,300,420];
  const cats=CATEGORIES.map(c=>`<button class="category-option ${s.categoryIds.includes(c.id)?'selected':''}" data-action="toggle-category" data-id="${c.id}" aria-pressed="${s.categoryIds.includes(c.id)}"><span class="cat-icon">${c.icon}</span><strong>${esc(c.title)}</strong><small>${categoryWords(c.id).length} کلمه</small></button>`).join('');
  return `${backButton('home','صفحه اصلی')}<div class="page-heading"><h1>بازی جدید بساز</h1><p>چند تنظیم ساده انجام بده و بازی را شروع کن.</p></div>
  <section class="form-card glass"><h2 class="form-section-title"><span class="num">۱</span> ترکیب بازیکنان</h2>
   <div class="field-row"><div><label class="field-label">تعداد بازیکنان</label><div class="counter"><button data-action="count-player" data-delta="-1" aria-label="کم کردن بازیکن">−</button><output>${s.players} نفر</output><button data-action="count-player" data-delta="1" aria-label="زیاد کردن بازیکن">+</button></div><div class="field-hint">از ۳ تا ۲۰ نفر</div></div>
   <div><label class="field-label">تعداد جاسوس‌ها</label><div class="counter"><button data-action="count-spy" data-delta="-1" aria-label="کم کردن جاسوس">−</button><output>${s.spies} نفر</output><button data-action="count-spy" data-delta="1" aria-label="زیاد کردن جاسوس">+</button></div><div class="field-hint">حداقل یک نفر باید عادی باشد.</div></div></div>
   <div class="notice" style="margin-top:18px"><span class="notice-icon">💡</span><span>پیشنهاد: برای جمع‌های ۳ تا ۸ نفره، یک جاسوس و برای جمع‌های بزرگ‌تر، دو جاسوس انتخاب کنید.</span></div>
  </section>
  <section class="form-card glass"><h2 class="form-section-title"><span class="num">۲</span> زمان هر مرحله بحث</h2><div class="segmented">${dur.map(d=>`<button class="segment ${s.duration===d?'selected':''}" data-action="set-duration" data-value="${d}">${d/60} دقیقه</button>`).join('')}<button class="segment ${!dur.includes(s.duration)?'selected':''}" data-action="custom-duration">سفارشی</button></div>${!dur.includes(s.duration)?`<div style="margin-top:13px;max-width:220px"><label class="field-label">مدت به دقیقه</label><input class="input" type="number" min="1" max="30" value="${Math.round(s.duration/60)}" data-input="duration-minutes"></div>`:''}</section>
  <section class="form-card glass"><h2 class="form-section-title"><span class="num">۳</span> دسته‌بندی کلمات</h2><p class="field-hint" style="margin:0 0 14px">یک دسته انتخاب کن یا با «همه دسته‌ها» تنوع بیشتری بساز.</p><div class="category-grid"><button class="category-option all-option ${s.categoryIds.includes('all')?'selected':''}" data-action="toggle-category" data-id="all" aria-pressed="${s.categoryIds.includes('all')}"><span class="cat-icon">✨</span><span><strong>همه دسته‌ها</strong><small> تمام کلمات فعال</small></span></button>${cats}</div><div class="field-hint">مجموع کلمات قابل انتخاب: ${allSelectedWords().length}</div></section>
  <section class="form-card glass"><h2 class="form-section-title"><span class="num">۴</span> قوانین این بازی</h2><div class="settings-row"><div><strong>فرصت حدس کلمه برای جاسوس</strong><small>پس از شناسایی، جاسوس می‌تواند کلمه را حدس بزند.</small></div><button class="toggle ${s.guessEnabled?'on':''}" data-action="toggle-setting" data-key="guessEnabled" aria-label="حدس جاسوس"><span></span></button></div><div class="settings-row"><div><strong>مدل رأی‌گیری</strong><small>${s.voteMode==='secret'?'هر بازیکن مخفیانه رأی می‌دهد.':'گروهی؛ جمع روی یک مظنون توافق می‌کند.'}</small></div><button class="btn btn-secondary btn-small" data-action="toggle-vote-mode">${s.voteMode==='secret'?'رأی‌گیری مخفی':'رأی‌گیری گروهی'}</button></div><div class="settings-row"><div><strong>تعداد دورها</strong><small>پس از تعداد دور مشخص، برنده نهایی تعیین می‌شود.</small></div><select class="select" style="width:100px;min-height:40px;padding:7px" data-select="round-limit"><option value="3" ${s.roundLimit===3?'selected':''}>۳ دور</option><option value="5" ${s.roundLimit===5?'selected':''}>۵ دور</option><option value="7" ${s.roundLimit===7?'selected':''}>۷ دور</option><option value="10" ${s.roundLimit===10?'selected':''}>۱۰ دور</option></select></div></section>
  <div class="bottom-actions"><button class="btn btn-primary" data-action="to-names">ادامه و انتخاب بازیکنان <span>←</span></button></div>`;
}
function renderNames(){
 const count=appData.settings.players;
 while(appData.names.length<count) appData.names.push(`بازیکن ${appData.names.length+1}`);
 appData.names=appData.names.slice(0,count);saveData();
 return `${backButton('setup','تنظیمات بازی')}<div class="page-heading"><h1>بازیکنان را معرفی کن</h1><p>گوشی بین این ${count} نفر می‌چرخد؛ برای هر نفر یک اسم بنویس.</p></div><div class="notice" style="margin-bottom:15px"><span class="notice-icon">🤫</span><span>اسم‌ها در تمام دورهای این بازی ثابت می‌مانند. می‌توانی اسم‌ها را کوتاه بنویسی تا روی کارت‌ها جا شوند.</span></div><div class="players-list">${appData.names.map((name,i)=>`<label class="player-input-card glass"><span class="player-index">${String(i+1).padStart(2,'0')}</span><input class="input" type="text" maxlength="24" autocomplete="off" data-player-name="${i}" value="${esc(name)}" placeholder="نام بازیکن ${i+1}" aria-label="نام بازیکن ${i+1}" /></label>`).join('')}</div><div class="bottom-actions"><button class="btn btn-secondary" data-action="fill-default-names">نام‌های پیش‌فرض</button><button class="btn btn-primary" data-action="start-game">شروع و پخش کارت‌ها ←</button></div>`;
}
function roleView(){const g=getGame();if(!g)return '';const id=g.players[g.revealIndex]?.id;const p=currentPlayer(id);if(!p)return '';if(!revealOpen)return `<div class="center-stage"><section class="stage-card glass"><div class="player-progress">${g.players.map((p,i)=>`<span class="${i<g.revealIndex?'done':i===g.revealIndex?'current':''}"></span>`).join('')}</div><div class="hand-off-icon">📱</div><span class="eyebrow">نوبت ${g.revealIndex+1} از ${g.players.length}</span><h1>${esc(p.name)}، آماده‌ای؟</h1><p>گوشی را فقط خودت نگاه کن. وقتی مطمئن شدی کسی صفحه را نمی‌بیند، کارت مخفی‌ات را باز کن.</p><button class="btn btn-primary btn-wide" data-action="reveal-role">نمایش کارت مخفی <span>◉</span></button><p class="privacy-note">کارت به‌صورت خودکار باز نمی‌شود؛ برای دیدن نقش باید خودت دکمه را بزنی.</p></section></div>`;
 const role=g.roleMap[p.id];const isSpy=role==='spy';return `<div class="center-stage"><section class="stage-card glass"><div class="player-progress">${g.players.map((p,i)=>`<span class="${i<=g.revealIndex?'done':''}"></span>`).join('')}</div><div class="secret-card ${isSpy?'spy-card':''}"><div class="secret-symbol">${isSpy?'🕵️':'🔐'}</div><h2>${isSpy?'تو جاسوسی!':'تو بازیکن عادی هستی'}</h2>${isSpy?`<p>کلمه مخفی را نمی‌دانی؛ باهوش باش و خودت را لو نده.</p>`:`<p>کلمه مخفی گروه شما:</p><div class="word">${esc(g.word.text)}</div><p style="margin-top:12px">کلمه را به کسی نگو.</p>`}</div><p class="secret-warning">این صفحه را به نفر بعد نشان نده. پس از خواندن، کارت را مخفی کن.</p><button class="btn btn-primary btn-wide" style="margin-top:14px" data-action="hide-role">متوجه شدم؛ مخفی کن ✓</button></section></div>`;
}
function renderRoles(){return `${backButton('home','خروج به صفحه اصلی')}<div class="page-heading"><h1>کارت‌های مخفی</h1><p>هر نفر فقط نقش خودش را ببیند؛ بعد گوشی را تحویل بدهد.</p></div>${roleView()}`;}
function renderDiscussion(){
 const g=getGame();if(!g)return renderHome();const remain=g.remaining??g.duration;const ratio=Math.max(0,Math.min(100,remain/g.duration*100));const alive=g.aliveIds||g.players.map(p=>p.id);
 return `${backButton('home','صفحه اصلی')}<div class="row-between" style="margin:6px 2px 16px"><div><span class="round-label">دور ${g.round} از ${g.roundLimit}</span><h1 style="font-size:22px;margin:9px 0 0">وقت گفت‌وگوئه!</h1></div><span class="tag">${alive.length} نفر در بازی</span></div>
 <section class="timer-wrap glass"><div class="timer ${remain<=30?'urgent':''}" id="main-timer">${formatTime(remain)}</div><div class="timer-caption">زمان باقی‌مانده برای بحث</div><div class="timer-progress"><span id="timer-progress-fill" style="width:${ratio}%"></span></div><div class="action-grid" style="margin-top:18px"><button class="btn btn-secondary" data-action="${g.paused?'resume-timer':'pause-timer'}">${g.paused?'▶ ادامه تایمر':'Ⅱ توقف موقت'}</button><button class="btn btn-primary" data-action="finish-discussion">پایان بحث و رأی‌گیری ←</button></div>${g.paused?'<p class="field-hint">تایمر متوقف است؛ برای ادامه، دکمه را بزن.</p>':''}</section>
 <section class="player-board glass"><div class="row-between"><div><strong style="font-size:14px">بازیکنان حاضر</strong><div class="field-hint">نقش هیچ بازیکنی اینجا نمایش داده نمی‌شود.</div></div><span class="tag">دور ${g.round}</span></div><div class="board-grid">${g.players.map((p,i)=>`<div class="board-player ${alive.includes(p.id)?'':'eliminated'}"><span class="avatar">${esc((p.name||'?').slice(0,1))}</span><strong>${esc(p.name)}</strong><small>${alive.includes(p.id)?'در بازی':'حذف‌شده از این دور'}</small></div>`).join('')}</div></section>
 <section class="tip-card glass"><span style="font-size:23px">💬</span><div><strong>راهنمای این مرحله</strong><p>هر نفر با دقت صحبت کند. سؤال‌ها را طوری بپرسید که جاسوس نتواند کلمه را حدس بزند، اما بازیکنان عادی هم بتوانند همدیگر را پیدا کنند.</p></div></section>`;
}
function renderGroupVote(){
 const g=getGame();const alive=g.aliveIds||[];return `${backButton('home','صفحه اصلی')}<div class="page-heading"><span class="eyebrow">مرحله رأی‌گیری</span><h1 style="margin-top:12px">به نظرت جاسوس کیه؟</h1><p>با هم صحبت کنید و فقط یک مظنون را انتخاب کنید.</p></div><section class="form-card glass"><h2 class="form-section-title">انتخاب مظنون</h2><div class="voting-grid">${alive.map(id=>{const p=currentPlayer(id);return `<button class="vote-player ${g.selectedVoteTarget===id?'selected':''}" data-action="select-target" data-id="${id}"><span class="avatar">${esc((p?.name||'?').slice(0,1))}</span><strong>${esc(p?.name||'بازیکن')}</strong><small>${g.selectedVoteTarget===id?'انتخاب شده':'انتخاب به‌عنوان جاسوس'}</small></button>`}).join('')}</div><div class="bottom-actions"><button class="btn btn-primary" data-action="submit-group-vote" ${g.selectedVoteTarget?'':'disabled'}>ثبت رأی گروهی و بررسی نتیجه</button></div></section><div class="notice"><span class="notice-icon">ℹ️</span><span>در رأی‌گیری گروهی، نتیجه بر اساس تصمیم مشترک گروه ثبت می‌شود؛ رأی فردی محرمانه ذخیره نمی‌شود.</span></div>`;
}
function renderSecretVote(){
 const g=getGame();const voterId=g.aliveIds[g.currentVoterIndex];const voter=currentPlayer(voterId);const targets=g.aliveIds.filter(id=>id!==voterId);
 return `${backButton('home','صفحه اصلی')}<div class="center-stage"><section class="stage-card glass"><div class="player-progress">${g.aliveIds.map((id,i)=>`<span class="${i<g.currentVoterIndex?'done':i===g.currentVoterIndex?'current':''}"></span>`).join('')}</div><span class="eyebrow">رأی مخفی ${g.currentVoterIndex+1} از ${g.aliveIds.length}</span><h1 style="margin-top:14px">نوبت ${esc(voter?.name||'بازیکن')}</h1><p>گوشی را فقط خودت نگاه کن و مظنونت را انتخاب کن. رأی تو پس از ثبت برای دیگران نمایش داده نمی‌شود.</p><div class="voting-grid">${targets.map(id=>{const p=currentPlayer(id);return `<button class="vote-player ${g.selectedVoteTarget===id?'selected':''}" data-action="select-target" data-id="${id}"><span class="avatar">${esc((p?.name||'?').slice(0,1))}</span><strong>${esc(p?.name||'بازیکن')}</strong><small>${g.selectedVoteTarget===id?'انتخاب شده':'انتخاب کن'}</small></button>`}).join('')}</div><button class="btn btn-primary btn-wide" style="margin-top:15px" data-action="submit-secret-vote" ${g.selectedVoteTarget?'':'disabled'}>ثبت رأی محرمانه</button><p class="privacy-note">بعد از ثبت رأی، صفحه را به نفر بعدی بده. تا پایان رأی‌گیری نتیجه‌ای نمایش داده نمی‌شود.</p></section></div>`;
}
function renderVoteHandoff(){const g=getGame();const voter=currentPlayer(g.aliveIds[g.currentVoterIndex]);const nextIndex=g.currentVoterIndex+1;const next=currentPlayer(g.aliveIds[nextIndex]);return `<div class="center-stage"><section class="stage-card glass"><div class="hand-off-icon">🤝</div><span class="eyebrow">رأی ثبت شد</span><h1>${esc(voter?.name||'بازیکن')}، ممنون!</h1><p>رأی تو محرمانه ثبت شد. گوشی را به نفر بعدی بده و اجازه بده او رأی خودش را ثبت کند.</p><div class="notice" style="text-align:right"><span class="notice-icon">🔒</span><span>نتیجه رأی‌ها تا پایان رأی‌گیری نشان داده نمی‌شود.</span></div><button class="btn btn-primary btn-wide" style="margin-top:17px" data-action="next-voter">${next?'آماده‌سازی نفر بعدی ←':'پایان رأی‌گیری و نمایش نتیجه'}</button></section></div>`;}
function renderVoteTie(){const g=getGame();return `${backButton('home','صفحه اصلی')}<div class="center-stage"><section class="stage-card glass"><div class="result-icon">⚖️</div><h1>رأی‌ها مساوی شد!</h1><p>بین این بازیکنان تفاوتی در تعداد رأی نبود. یک رأی‌گیری دوباره انجام دهید.</p><div class="result-list">${g.tieIds.map(id=>`<div class="result-line"><span>${esc(currentPlayer(id)?.name||'بازیکن')}</span><strong>${g.tieCounts?.[id]||0} رأی</strong></div>`).join('')}</div><button class="btn btn-primary btn-wide" data-action="revote">رأی‌گیری دوباره</button></section></div>`;}
function renderGuess(){const g=getGame();const p=currentPlayer(g.lastEliminated?.id);return `${backButton('home','صفحه اصلی')}<div class="center-stage"><section class="stage-card glass"><div class="result-icon fail">🕵️</div><span class="eyebrow">آخرین فرصت</span><h1 style="margin-top:13px">${esc(p?.name||'جاسوس')}، حدس بزن!</h1><p>جاسوس شناسایی شده، اما هنوز یک شانس دارد. کلمه مخفی چه بود؟</p><form id="guess-form"><label for="spy-guess" class="field-label" style="text-align:right">حدس کلمه</label><input id="spy-guess" class="input" maxlength="60" autocomplete="off" placeholder="کلمه را اینجا بنویس…" required autofocus /><button class="btn btn-primary btn-wide" style="margin-top:13px" type="submit">ثبت حدس</button></form><p class="privacy-note">کلمه اصلی تا زمان ثبت حدس نمایش داده نمی‌شود.</p></section></div>`;}
function renderRoundResult(){const g=getGame();const civWin=g.roundWinner==='civilians';const p=g.lastEliminated?currentPlayer(g.lastEliminated.id):null;return `${backButton('home','صفحه اصلی')}<div class="center-stage"><section class="stage-card glass"><div class="result-icon ${civWin?'success':'fail'}">${civWin?'🎉':'🕵️'}</div><span class="eyebrow">نتیجه دور ${g.round}</span><h1 style="margin-top:13px">${civWin?'این دور را شهروندها بردند!':'این دور را جاسوس‌ها بردند!'}</h1><p>${esc(g.roundMessage||'نتیجه بازی مشخص شد.')}</p><div class="result-list"><div class="result-line"><span>کلمه مخفی</span><strong>${esc(g.word.text)}</strong></div><div class="result-line"><span>دسته‌بندی</span><strong>${esc(g.word.categoryTitle)}</strong></div>${p?`<div class="result-line"><span>آخرین بازیکن حذف‌شده</span><strong>${esc(p.name)} ${g.lastEliminated.wasSpy?'(جاسوس)':'(عادی)'}</strong></div>`:''}</div><h3 style="font-size:14px;text-align:right;margin:18px 0 6px">امتیازهای این دور</h3>${scoreTable(g.players,true)}<div class="bottom-actions"><button class="btn btn-secondary" data-action="home">صفحه اصلی</button><button class="btn btn-primary" data-action="next-round">${g.round>=g.roundLimit?'مشاهده نتیجه نهایی':'شروع دور بعدی ←'}</button></div></section></div>`;}
function scoreTable(players,compact=false){const sorted=[...players].sort((a,b)=>b.score-a.score);return `<table class="score-table"><thead><tr><th>بازیکن</th><th>جاسوس شدن</th><th>امتیاز</th></tr></thead><tbody>${sorted.map((p,i)=>`<tr><td><span class="rank-number">${i+1}</span>${esc(p.name)}</td><td>${p.spyCount||0}</td><td>+${p.score||0}</td></tr>`).join('')}</tbody></table>`;}
function renderFinalResult(){const g=getGame();if(!g)return renderHome();const sorted=[...g.players].sort((a,b)=>b.score-a.score);const first=sorted[0];return `${backButton('home','صفحه اصلی')}<div class="center-stage"><section class="stage-card glass"><div class="result-icon success">🏆</div><span class="eyebrow">پایان بازی · ${g.roundLimit} دور</span><h1 style="margin-top:13px">${first?`برنده این جمع: ${esc(first.name)}!`:'بازی تمام شد!'}</h1><p>امتیازها جمع‌بندی شد؛ حالا نوبت یک بازی دوباره است.</p><div class="form-card" style="padding:15px;margin:18px 0">${scoreTable(g.players)}</div><div class="bottom-actions"><button class="btn btn-secondary" data-action="history">تاریخچه بازی‌ها</button><button class="btn btn-primary" data-action="replay">بازی دوباره با همین اسم‌ها ↻</button></div><button class="btn btn-quiet btn-wide" style="margin-top:8px" data-action="new-game">بازی جدید با تنظیمات تازه</button></section></div>`;}
function renderHistory(){const items=appData.history.slice().reverse();return `${backButton('home','صفحه اصلی')}<div class="page-heading"><h1>تاریخچه بازی‌ها</h1><p>نتایج قبلی و رتبه‌بندی جمع شما روی همین دستگاه نگه‌داری می‌شود.</p></div>${items.length?`${items.map((h,i)=>`<article class="history-item glass"><div class="history-top"><strong>🎲 بازی ${items.length-i}</strong><span class="tag">${esc(h.date||'')}</span></div><p>${esc(h.playerCount)} بازیکن · ${esc(h.roundsPlayed)} دور · برنده: ${esc(h.winner||'—')}</p><div class="row-between"><span class="field-hint">${esc(h.summary||'')}</span><strong style="color:#7363dd">${h.topScore||0} امتیاز</strong></div></article>`).join('')}<button class="btn btn-danger btn-wide" data-action="clear-history" style="margin-top:8px">پاک کردن تاریخچه</button>`:`<section class="glass empty-state"><div class="empty-icon">🗂️</div><strong>هنوز بازی‌ای ثبت نشده</strong><p>بعد از تمام شدن اولین بازی، نتیجه‌ها اینجا می‌آیند.</p><button class="btn btn-primary" data-action="new-game">شروع اولین بازی</button></section>`}`;}
function renderSettings(){const p=appData.prefs,s=appData.settings;return `${backButton('home','صفحه اصلی')}<div class="page-heading"><h1>تنظیمات</h1><p>ظاهر و شیوه اجرای بازی را مطابق سلیقه جمع تنظیم کن.</p></div><section class="form-card glass"><h2 class="form-section-title">🎨 ظاهر برنامه</h2><div class="settings-row"><div><strong>حالت تاریک</strong><small>پس‌زمینه تیره‌تر برای محیط کم‌نور</small></div><button class="toggle ${p.theme==='dark'?'on':''}" data-action="toggle-theme"><span></span></button></div><div class="settings-row"><div><strong>حرکت‌های آرام‌تر</strong><small>کاهش انیمیشن‌های رابط کاربری</small></div><button class="toggle ${p.reduceMotion?'on':''}" data-action="toggle-reduced-motion"><span></span></button></div><div class="settings-row"><div><strong>صدای هشدار تایمر</strong><small>هشدار کوتاه در ۱۰ ثانیه پایانی بحث (در صورت پشتیبانی مرورگر)</small></div><button class="toggle ${s.soundEnabled?'on':''}" data-action="toggle-setting" data-key="soundEnabled"><span></span></button></div></section><section class="form-card glass"><h2 class="form-section-title">🎮 قوانین پیش‌فرض بازی</h2><div class="settings-row"><div><strong>مدل رأی‌گیری</strong><small>${s.voteMode==='secret'?'هر نفر مخفیانه رأی ثبت می‌کند.':'گروهی؛ یک مظنون با توافق جمع انتخاب می‌شود.'}</small></div><button class="btn btn-secondary btn-small" data-action="toggle-vote-mode">تغییر</button></div><div class="settings-row"><div><strong>فرصت حدس برای جاسوس</strong><small>پس از شناسایی، حدس کلمه برای جاسوس فعال است.</small></div><button class="toggle ${s.guessEnabled?'on':''}" data-action="toggle-setting" data-key="guessEnabled"><span></span></button></div><div class="settings-row"><div><strong>داده‌های ذخیره‌شده</strong><small>نام‌ها، تنظیمات و نتایج فقط در این مرورگر ذخیره می‌شوند.</small></div><button class="btn btn-danger btn-small" data-action="reset-data">پاک کردن</button></div></section><section class="form-card glass"><h2 class="form-section-title">📲 نصب اپلیکیشن</h2><p class="field-hint">اگر مرورگر نصب برنامه را پشتیبانی کند، می‌توانی بازی را به صفحه اصلی اضافه کنی. در غیر این صورت از منوی مرورگر گزینه «افزودن به صفحه اصلی» را انتخاب کن. نصب PWA به میزبانی HTTPS نیاز دارد.</p><button class="btn btn-primary btn-wide" data-action="install-app">${installPrompt?'نصب بازی روی دستگاه':'مشاهده راهنمای نصب'}</button></section>`;}
function renderCategories(){return `${backButton('home','صفحه اصلی')}<div class="page-heading"><h1>بانک کلمات</h1><p>۱۰ دسته‌بندی پیش‌فرض؛ هر دسته با ۱۵ کلمه شروع می‌شود. می‌توانی فهرست هر دسته را ویرایش کنی.</p></div><div class="notice" style="margin-bottom:14px"><span class="notice-icon">📝</span><span>هر خط یک کلمه است. تغییرات روی همین دستگاه ذخیره می‌شوند؛ برای برگشت به کلمات اولیه از «بازنشانی» استفاده کن.</span></div>${CATEGORIES.map(c=>`<section class="form-card glass"><div class="row-between"><h2 class="form-section-title" style="margin:0"><span style="font-size:22px">${c.icon}</span>${esc(c.title)}</h2><span class="tag">${categoryWords(c.id).length} کلمه</span></div><textarea class="textarea" rows="5" style="margin-top:14px;line-height:1.9" data-words="${c.id}" aria-label="کلمات دسته ${esc(c.title)}">${esc(categoryWords(c.id).join('\n'))}</textarea><div class="row-between" style="margin-top:10px"><span class="field-hint">هر کلمه در یک خط جدا</span><button class="btn btn-secondary btn-small" data-action="reset-words" data-id="${c.id}">بازنشانی</button><button class="btn btn-primary btn-small" data-action="save-words" data-id="${c.id}">ذخیره کلمات</button></div></section>`).join('')}`;}
function renderModal(){const el=document.getElementById('modal-root');if(el)el.remove();const div=document.createElement('div');div.id='modal-root';div.className='modal-backdrop';div.innerHTML=`<section class="modal" role="dialog" aria-modal="true"><h2>${esc(modalState.title)}</h2><p>${modalState.body}</p><div class="modal-actions"><button class="btn btn-secondary" data-action="close-modal">انصراف</button><button class="btn btn-primary" data-action="confirm-modal">${esc(modalState.confirm||'تأیید')}</button></div></section>`;document.body.appendChild(div);}
function openModal(title,body,callback,confirm='تأیید'){modalState={title,body,callback,confirm};renderModal();}
function closeModal(){modalState=null;document.getElementById('modal-root')?.remove();}
function startNewGame(reuseNames=false){
  const s=appData.settings;
  if(s.players<3||s.players>20){toast('تعداد بازیکنان باید بین ۳ تا ۲۰ نفر باشد.');return;}
  if(s.spies<1||s.spies>=s.players){toast('تعداد جاسوس‌ها باید حداقل یک و کمتر از بازیکنان باشد.');return;}
  const words=allSelectedWords();if(!words.length){toast('برای شروع، حداقل یک کلمه در دسته‌بندی انتخابی لازم است.');return;}
  if(!reuseNames)appData.names=appData.names.slice(0,s.players);
  while(appData.names.length<s.players)appData.names.push(`بازیکن ${appData.names.length+1}`);
  const names=appData.names.slice(0,s.players).map((n,i)=>String(n||'').trim()||`بازیکن ${i+1}`);
  appData.names=names;
  const players=names.map((name,i)=>({id:`player-${i+1}`,name,score:0,spyCount:0,correctVotes:0,correctGuesses:0}));
  appData.game={id:uuid('game'),players,round:1,roundLimit:s.roundLimit||5,duration:s.duration,remaining:s.duration,deadline:null,paused:false,roleMap:{},word:null,aliveIds:players.map(p=>p.id),spiesAliveIds:[],civiliansAliveIds:[],revealIndex:0,votes:{},currentVoterIndex:0,selectedVoteTarget:null,lastEliminated:null,correctVoters:[],scoredRounds:[],roundRecords:[],finished:false};
  startRound(1);
}
function startRound(number){
 const g=getGame();if(!g)return;const words=allSelectedWords();let pool=words;
 if(g.word&&words.length>1){const withoutLast=words.filter(w=>w.id!==g.word.id);if(withoutLast.length)pool=withoutLast;}
 const word=pool[randInt(pool.length)];const ids=shuffle(g.players.map(p=>p.id));const spies=ids.slice(0,Math.min(appData.settings.spies,g.players.length-1));
 g.round=number;g.word={...word};g.roleMap={};g.spiesAliveIds=[...spies];g.civiliansAliveIds=g.players.map(p=>p.id).filter(id=>!spies.includes(id));g.aliveIds=g.players.map(p=>p.id);g.players.forEach(p=>{g.roleMap[p.id]=spies.includes(p.id)?'spy':'civilian';if(spies.includes(p.id))p.spyCount=(p.spyCount||0)+1;});
 g.revealIndex=0;g.votes={};g.currentVoterIndex=0;g.selectedVoteTarget=null;g.tieIds=[];g.tieCounts={};g.lastEliminated=null;g.correctVoters=[];g.roundWinner=null;g.roundMessage='';g.scoredRounds=g.scoredRounds||[];g.deadline=null;g.remaining=g.duration;g.paused=false;g.roundStartedAt=Date.now();g.scored=false;g.warnedAtTen=false;
 appData.screen='roles';revealOpen=false;rolePeek=false;saveData();render();
}
function beginDiscussion(resetTime=true){
 const g=getGame();if(!g)return;
 g.stage='discussion';g.paused=false;if(resetTime||!Number.isFinite(g.remaining))g.remaining=g.duration;
 g.deadline=Date.now()+Math.max(0,g.remaining)*1000;g.warnedAtTen=false;appData.screen='discussion';saveData();render();
}
function startVoting(){
 const g=getGame();if(!g)return;g.deadline=null;g.paused=false;g.votes={};g.selectedVoteTarget=null;g.currentVoterIndex=0;g.stage=appData.settings.voteMode==='secret'?'secret-vote':'group-vote';appData.screen=appData.settings.voteMode==='secret'?'voteSecret':'voteGroup';saveData();render();
}
function submitSecretVote(){const g=getGame();if(!g||!g.selectedVoteTarget){toast('اول یک بازیکن را انتخاب کن.');return;}const voterId=g.aliveIds[g.currentVoterIndex];if(!voterId)return;g.votes[voterId]=g.selectedVoteTarget;g.selectedVoteTarget=null;appData.screen='voteHandoff';g.stage='secret-vote-handoff';saveData();render();}
function nextVoter(){const g=getGame();if(!g)return;if(g.currentVoterIndex+1<g.aliveIds.length){g.currentVoterIndex++;g.selectedVoteTarget=null;appData.screen='voteSecret';g.stage='secret-vote';saveData();render();}else tallyVotes();}
function tallyVotes(){const g=getGame();if(!g)return;const counts={};Object.values(g.votes).forEach(id=>counts[id]=(counts[id]||0)+1);const max=Math.max(0,...Object.values(counts));const tied=Object.keys(counts).filter(id=>counts[id]===max&&max>0);if(tied.length>1){g.tieIds=tied;g.tieCounts=counts;appData.screen='voteTie';g.stage='vote-tie';saveData();render();return;}if(!tied.length){toast('رأی معتبری ثبت نشد.');startVoting();return;}const target=tied[0];const voters=Object.entries(g.votes).filter(([,id])=>id===target).map(([id])=>id);processAccusation(target,voters);}
function submitGroupVote(){const g=getGame();if(!g?.selectedVoteTarget){toast('یک مظنون را انتخاب کنید.');return;}processAccusation(g.selectedVoteTarget,[]);}
function processAccusation(targetId,voters=[]){
 const g=getGame();if(!g||!g.aliveIds.includes(targetId))return;
 const isSpy=g.roleMap[targetId]==='spy';
 if(isSpy){voters.forEach(id=>{if(!g.correctVoters.includes(id))g.correctVoters.push(id);});g.spiesAliveIds=g.spiesAliveIds.filter(id=>id!==targetId);g.aliveIds=g.aliveIds.filter(id=>id!==targetId);g.lastEliminated={id:targetId,wasSpy:true,correctVoters:[...voters]};
   if(appData.settings.guessEnabled){appData.screen='guess';g.stage='spy-guess';saveData();render();}else resolveSpyGuess('');
 }else{
   g.civiliansAliveIds=g.civiliansAliveIds.filter(id=>id!==targetId);g.aliveIds=g.aliveIds.filter(id=>id!==targetId);g.lastEliminated={id:targetId,wasSpy:false,correctVoters:[]};
   if(g.spiesAliveIds.length>=g.civiliansAliveIds.length){finishRound('spies','تعداد جاسوس‌های باقی‌مانده به تعداد بازیکنان عادی باقی‌مانده رسید.');}
   else if(g.aliveIds.length<=1){finishRound('spies','دیگر بازیکن کافی برای رأی‌گیری باقی نمانده بود.');}
   else beginDiscussion(true);
 }
}
function resolveSpyGuess(textValue){
 const g=getGame();if(!g)return;const correct=normalizeFa(textValue)===normalizeFa(g.word.text);
 if(correct){const p=currentPlayer(g.lastEliminated?.id);if(p)p.correctGuesses=(p.correctGuesses||0)+1;finishRound('spies',`${p?.name||'جاسوس'} کلمه مخفی را درست حدس زد!`,true,g.lastEliminated?.id);return;}
 if(g.spiesAliveIds.length===0){finishRound('civilians','جاسوس شناسایی شد و نتوانست کلمه را حدس بزند.');}
 else if(g.spiesAliveIds.length>=g.civiliansAliveIds.length||g.aliveIds.length<=1){finishRound('spies','با وجود کشف یک جاسوس، جاسوس‌های باقی‌مانده برتری پیدا کردند.');}
 else beginDiscussion(true);
}
function finishRound(winner,reason,guessedCorrect=false,guesserId=null){
 const g=getGame();if(!g||g.scored)return;g.scored=true;g.deadline=null;g.paused=false;g.roundWinner=winner;g.roundMessage=reason;
 const correctVoters=winner==='civilians'?g.correctVoters:g.correctVoters;
 if(winner==='civilians'){
   g.players.forEach(p=>{if(g.roleMap[p.id]==='civilian')p.score+=3;});
 } else {
   g.players.forEach(p=>{if(g.roleMap[p.id]==='spy')p.score+=3;});
   if(guessedCorrect&&guesserId){const p=currentPlayer(guesserId);if(p)p.score+=2;}
 }
 if(appData.settings.voteMode==='secret'){
   [...new Set(correctVoters)].forEach(id=>{const p=currentPlayer(id);if(p){p.score+=1;p.correctVotes=(p.correctVotes||0)+1;}});
 }
 const roleSummary=g.players.filter(p=>g.roleMap[p.id]==='spy').map(p=>p.name);
 g.roundRecords.push({round:g.round,word:g.word.text,category:g.word.categoryTitle,winner,reason,spies:roleSummary,guessedCorrect,guesser:guesserId?currentPlayer(guesserId)?.name:null});
 g.remaining=0;g.stage='round-result';appData.screen='roundResult';saveData();render();
}
function finishWholeGame(){
 const g=getGame();if(!g)return;g.finished=true;g.stage='final-result';g.deadline=null;g.paused=false;appData.screen='finalResult';
 if(!g.historySaved){const sorted=[...g.players].sort((a,b)=>b.score-a.score);const winner=sorted[0];const date=new Date().toLocaleDateString('fa-IR');appData.history.push({id:g.id,date,playerCount:g.players.length,roundsPlayed:g.roundRecords.length,winner:winner?.name||'—',topScore:winner?.score||0,summary:`${g.roundRecords.length} دور · ${g.roundRecords.filter(r=>r.winner==='civilians').length} پیروزی بازیکنان عادی · ${g.roundRecords.filter(r=>r.winner==='spies').length} پیروزی جاسوس‌ها`,players:g.players.map(p=>({name:p.name,score:p.score}))});if(appData.history.length>50)appData.history=appData.history.slice(-50);g.historySaved=true;}
 saveData();render();
}
function pauseTimer(){const g=getGame();if(!g||g.paused)return;if(g.deadline)g.remaining=Math.max(0,Math.ceil((g.deadline-Date.now())/1000));g.deadline=null;g.paused=true;saveData();render();}
function resumeTimer(){const g=getGame();if(!g)return;g.paused=false;g.deadline=Date.now()+Math.max(0,g.remaining)*1000;saveData();render();}
function playTimerBeep(){
  try {
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return;
    beepContext=beepContext||new AudioCtx();
    if(beepContext.state==='suspended')beepContext.resume();
    const osc=beepContext.createOscillator();const gain=beepContext.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(640,beepContext.currentTime);
    gain.gain.setValueAtTime(0.0001,beepContext.currentTime);gain.gain.exponentialRampToValueAtTime(0.045,beepContext.currentTime+0.025);gain.gain.exponentialRampToValueAtTime(0.0001,beepContext.currentTime+0.22);
    osc.connect(gain);gain.connect(beepContext.destination);osc.start();osc.stop(beepContext.currentTime+0.24);
  } catch(e) { /* صدا در مرورگرهای ناسازگار اختیاری است. */ }
}
function syncTick(){
 const g=getGame();const shouldTick=appData.screen==='discussion'&&g&&!g.paused&&!g.finished&&g.deadline;
 if(!shouldTick){if(tickTimer){clearInterval(tickTimer);tickTimer=null;}return;}
 if(tickTimer)return;
 tickTimer=setInterval(()=>{
   const game=getGame();if(!game||appData.screen!=='discussion'||game.paused||!game.deadline){clearInterval(tickTimer);tickTimer=null;return;}
   const left=Math.max(0,Math.ceil((game.deadline-Date.now())/1000));
   if(left!==game.remaining){game.remaining=left;const now=Date.now();if(now-timerPaintAt>900){timerPaintAt=now;saveData();const timer=document.getElementById('main-timer');const fill=document.getElementById('timer-progress-fill');if(timer){timer.textContent=formatTime(left);timer.classList.toggle('urgent',left<=30);}if(fill)fill.style.width=`${Math.max(0,left/game.duration*100)}%`;}}
   if(left<=10&&left>0&&appData.settings.soundEnabled&&!game.warnedAtTen){game.warnedAtTen=true;saveData();playTimerBeep();}
   if(left<=0){clearInterval(tickTimer);tickTimer=null;startVoting();return;}
 },250);
}
function resetGameData(){appData.game=null;appData.names=[];appData.history=[];appData.customWords={};appData.settings={...DEFAULT_SETTINGS};appData.prefs={...DEFAULT_PREFS};appData.screen='home';saveData();closeModal();render();toast('داده‌های محلی پاک شد.');}
function updateNameInput(el){const idx=Number(el.dataset.playerName);if(Number.isInteger(idx)&&idx>=0){appData.names[idx]=el.value;saveData();}}
document.addEventListener('click',async event=>{
 const actionEl=event.target.closest('[data-action]');if(!actionEl)return;const action=actionEl.dataset.action;const g=getGame();
 switch(action){
  case 'home': closeModal();revealOpen=false;appData.screen='home';saveData();render();break;
  case 'new-game': closeModal();appData.screen='setup';saveData();render();break;
  case 'resume': {
    if(!g){setScreen('home');break;}
    if(g.finished){appData.screen='finalResult';}
    else if(g.stage==='roles'||g.stage==='discussion'||g.stage==='group-vote'||g.stage==='secret-vote'||g.stage==='secret-vote-handoff'||g.stage==='vote-tie'||g.stage==='spy-guess'||g.stage==='round-result'){
      const map={'roles':'roles','discussion':'discussion','group-vote':'voteGroup','secret-vote':'voteSecret','secret-vote-handoff':'voteHandoff','vote-tie':'voteTie','spy-guess':'guess','round-result':'roundResult'};appData.screen=map[g.stage]||'roles';if(appData.screen==='roles')revealOpen=false;
    }else appData.screen='home';saveData();render();break;
  }
  case 'rules': openModal('قوانین کوتاه بازی',`۱. همه بازیکنان به‌ترتیب کارت مخفی خود را می‌بینند. بازیکنان عادی یک کلمه مشترک دارند؛ جاسوس آن را نمی‌داند.<br><br>۲. پس از شروع تایمر، با سؤال و جواب تلاش کنید جاسوس را پیدا کنید؛ کلمه را مستقیم لو ندهید.<br><br>۳. در رأی‌گیری گروهی یک مظنون انتخاب می‌شود. اگر فرد عادی باشد، از همان دور کنار می‌رود و بحث ادامه دارد. اگر جاسوس باشد، می‌تواند کلمه را حدس بزند.<br><br>۴. اگر جاسوس کلمه را درست حدس بزند، تیم جاسوس‌ها برنده دور می‌شود. در غیر این صورت، با کشف همه جاسوس‌ها بازیکنان عادی برنده‌اند.<br><br>۵. امتیاز هر دور به‌صورت خودکار ثبت می‌شود و در پایان تعداد دورهای انتخاب‌شده، برنده نهایی مشخص می‌شود.`,()=>{},'متوجه شدم');break;
  case 'history': closeModal();setScreen('history');break;
  case 'settings': closeModal();setScreen('settings');break;
  case 'categories': closeModal();setScreen('categories');break;
  case 'go-setup': setScreen('setup');break;
  case 'count-player': appData.settings.players=Math.max(3,Math.min(20,appData.settings.players+Number(actionEl.dataset.delta)));appData.settings.spies=Math.min(appData.settings.spies,appData.settings.players-1);saveData();render();break;
  case 'count-spy': appData.settings.spies=Math.max(1,Math.min(appData.settings.players-1,appData.settings.spies+Number(actionEl.dataset.delta)));saveData();render();break;
  case 'set-duration': appData.settings.duration=Number(actionEl.dataset.value);saveData();render();break;
  case 'custom-duration': appData.settings.duration=240;saveData();render();break;
  case 'toggle-category': {
    const id=actionEl.dataset.id;let list=appData.settings.categoryIds||['all'];
    if(id==='all')list=['all'];else{list=list.filter(x=>x!=='all');list=list.includes(id)?list.filter(x=>x!==id):[...list,id];if(!list.length)list=['all'];}
    appData.settings.categoryIds=list;saveData();render();break;
  }
  case 'toggle-setting': {const key=actionEl.dataset.key;appData.settings[key]=!appData.settings[key];saveData();render();break;}
  case 'toggle-vote-mode': appData.settings.voteMode=appData.settings.voteMode==='group'?'secret':'group';saveData();render();break;
  case 'to-names': {
    if(appData.settings.spies>=appData.settings.players){toast('تعداد جاسوس‌ها باید کمتر از تعداد بازیکنان باشد.');break;}
    if(!allSelectedWords().length){toast('دسته‌بندی انتخابی هیچ کلمه‌ای ندارد.');break;}
    while(appData.names.length<appData.settings.players)appData.names.push(`بازیکن ${appData.names.length+1}`);appData.names=appData.names.slice(0,appData.settings.players);setScreen('names');break;
  }
  case 'fill-default-names': appData.names=Array.from({length:appData.settings.players},(_,i)=>`بازیکن ${i+1}`);saveData();render();toast('نام‌های پیش‌فرض وارد شد.');break;
  case 'start-game': {
    const inputs=[...document.querySelectorAll('[data-player-name]')];inputs.forEach(el=>{const idx=Number(el.dataset.playerName);appData.names[idx]=el.value;});
    const empty=appData.names.slice(0,appData.settings.players).some(n=>!String(n||'').trim());if(empty){toast('نام همه بازیکنان را وارد کنید.');break;}startNewGame(false);break;
  }
  case 'reveal-role': revealOpen=true;render();break;
  case 'hide-role': {
    revealOpen=false;if(g.revealIndex+1<g.players.length){g.revealIndex++;saveData();render();}else{g.stage='discussion';beginDiscussion(true);}break;
  }
  case 'pause-timer': pauseTimer();break;
  case 'resume-timer': resumeTimer();break;
  case 'finish-discussion': startVoting();break;
  case 'select-target': if(g&&g.aliveIds.includes(actionEl.dataset.id)){g.selectedVoteTarget=actionEl.dataset.id;render();}break;
  case 'submit-group-vote': submitGroupVote();break;
  case 'submit-secret-vote': submitSecretVote();break;
  case 'next-voter': nextVoter();break;
  case 'revote': g.votes={};g.tieIds=[];g.tieCounts={};g.selectedVoteTarget=null;g.currentVoterIndex=0;appData.screen=appData.settings.voteMode==='secret'?'voteSecret':'voteGroup';g.stage=appData.settings.voteMode==='secret'?'secret-vote':'group-vote';saveData();render();break;
  case 'next-round': if(g.round>=g.roundLimit)finishWholeGame();else startRound(g.round+1);break;
  case 'replay': if(g){appData.names=g.players.map(p=>p.name);startNewGame(true);}break;
  case 'toggle-theme': appData.prefs.theme=appData.prefs.theme==='dark'?'light':'dark';saveData();render();break;
  case 'toggle-reduced-motion': appData.prefs.reduceMotion=!appData.prefs.reduceMotion;document.documentElement.classList.toggle('reduce-motion',appData.prefs.reduceMotion);saveData();render();break;
  case 'reset-words': {const id=actionEl.dataset.id;delete appData.customWords[id];saveData();render();toast('کلمات پیش‌فرض بازگردانی شد.');break;}
  case 'save-words': {
    const id=actionEl.dataset.id;const ta=document.querySelector(`[data-words="${id}"]`);if(!ta)break;
    const seen=new Set(),words=[];for(const raw of ta.value.split(/\r?\n/)){const w=raw.trim(),key=normalizeFa(w);if(w&&!seen.has(key)){seen.add(key);words.push(w);}}
    if(!words.length){toast('هر دسته باید حداقل یک کلمه داشته باشد.');break;}appData.customWords[id]=words;saveData();render();toast(`${words.length} کلمه در دسته ذخیره شد.`);break;
  }
  case 'clear-history': openModal('پاک کردن تاریخچه؟','تمام نتایج ذخیره‌شده این مرورگر پاک می‌شود. این کار روی بازی فعال تأثیر نمی‌گذارد.',()=>{appData.history=[];saveData();closeModal();render();toast('تاریخچه پاک شد.');},'پاک کردن');break;
  case 'reset-data': openModal('پاک کردن همه داده‌ها؟','تنظیمات، نام‌ها، بازی ذخیره‌شده، کلمات سفارشی و تاریخچه از همین مرورگر حذف می‌شوند.',()=>resetGameData(),'بله، پاک کن');break;
  case 'close-modal': closeModal();break;
  case 'confirm-modal': {const cb=modalState?.callback;closeModal();if(cb)cb();break;}
  case 'install-app': {
    if(installPrompt){try{await installPrompt.prompt();const choice=await installPrompt.userChoice;if(choice?.outcome==='accepted')toast('درخواست نصب پذیرفته شد.');installPrompt=null;render();}catch(e){toast('برای نصب، از منوی مرورگر گزینه افزودن به صفحه اصلی را انتخاب کن.');}}
    else openModal('نصب بازی روی گوشی','برای نصب، این صفحه را روی یک آدرس HTTPS باز کن. در اندروید از منوی سه‌نقطه مرورگر گزینه «Install app» یا «افزودن به صفحه اصلی» را بزن. در آیفون، از منوی Share گزینه «Add to Home Screen» را انتخاب کن. پس از اولین بار بارگذاری، بازی اصلی بدون اینترنت نیز اجرا می‌شود.',()=>{},'باشه');break;
  }
 }
});
document.addEventListener('input',event=>{
 const el=event.target;
 if(el.matches('[data-player-name]'))updateNameInput(el);
 if(el.matches('[data-input="duration-minutes"]')){const n=Math.max(1,Math.min(30,Number(el.value)||1));appData.settings.duration=n*60;saveData();}
});
document.addEventListener('change',event=>{
 const el=event.target;
 if(el.matches('[data-select="round-limit"]')){appData.settings.roundLimit=Number(el.value)||5;saveData();}
 if(el.matches('[data-input="duration-minutes"]')){const n=Math.max(1,Math.min(30,Number(el.value)||1));appData.settings.duration=n*60;saveData();render();}
});
document.addEventListener('submit',event=>{
 if(event.target.id==='guess-form'){event.preventDefault();const input=document.getElementById('spy-guess');resolveSpyGuess(input?.value||'');}
});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;if(appData.screen==='settings')render();});
window.addEventListener('appinstalled',()=>{installPrompt=null;toast('بازی جاسوس روی دستگاه نصب شد.');});
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Service Worker registration failed',err));
if(appData.prefs.reduceMotion)document.documentElement.classList.add('reduce-motion');
// اگر برنامه از مرورگر بسته‌شده باز شود، کارت نقش همچنان بسته می‌ماند.
if(appData.screen==='roles')revealOpen=false;
if(appData.game?.deadline&&appData.screen==='discussion'&&!appData.game.paused){appData.game.remaining=Math.max(0,Math.ceil((appData.game.deadline-Date.now())/1000));if(appData.game.remaining<=0){appData.game.remaining=0;startVoting();}}
render();
