"use strict";
(()=>{
  const API="https://hkuoxyvwovuvphggdlkn.supabase.co/functions/v1/nvs-customer-portal";
  const KEY="nvs_portal_session";
  const $=id=>document.getElementById(id);
  const el=(tag,cls,value)=>{
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(value!==undefined)n.textContent=String(value);
    return n;
  };
  const add=(p,...children)=>{children.forEach(c=>p.append(c));return p;};
  const names={
    planned:"Dự kiến xuống giống",
    growing:"Đang trồng",
    near_harvest:"Chuẩn bị thu hoạch",
    harvesting:"Đang thu hoạch",
    finished:"Đã kết thúc vụ"
  };
  const actionNames={preorder:"Đặt trước",purchase:"Đặt hàng"};
  let token="";
  let seasons=[];
  let chosen=null;
  let currentFarms=[];
  let currentDiary=[];
  try{const saved=JSON.parse(sessionStorage.getItem(KEY)||"null");if(saved&&Date.parse(saved.expires_at)>Date.now())token=saved.token||"";}catch(_){}
  const notice=(id,text)=>{const n=$(id);if(n)n.textContent=text;};
  async function call(action,payload={},login=false){
    let resp;
    try{
      resp=await fetch(API,{
        method:"POST",
        mode:"cors",
        cache:"no-store",
        headers:Object.assign({"Content-Type":"application/json"},(!login&&token)?{"Authorization":"Bearer "+token}:{}),
        body:JSON.stringify(Object.assign({action},payload))
      });
    }catch(_){throw Error("Không kết nối được máy chủ NVS. Vui lòng kiểm tra mạng.");}
    let body={};
    try{body=await resp.json();}catch(_){}
    if(!resp.ok){
      const error=Error(body.error||"Yêu cầu không thành công.");
      error.status=resp.status;throw error;
    }
    return body;
  }
  function clear(){
    token="";
    try{sessionStorage.removeItem(KEY);}catch(_){}
    $("invite-panel").hidden=false;$("portal").hidden=true;$("logout").hidden=true;
    $("invite-code").value="";
  }
  function stageOrder(s){
    if(s.stage==="harvesting"&&s.allow_purchase)return "purchase";
    if(["growing","near_harvest"].includes(s.stage)&&s.allow_preorder)return "preorder";
    return null;
  }
  function formatDay(s){if(!s)return "Chưa xác nhận";const [y,m,d]=s.split("-");return y&&m&&d?d+"/"+m+"/"+y:s;}
  function renderSummary(){
    const root=$("status-summary");root.replaceChildren();
    const keys=["growing","near_harvest","harvesting","planned"];
    for(const key of keys){
      const count=seasons.filter(s=>s.stage===key).length;
      add(root,el("span","status-chip",names[key]+" "),el("b","",count));
    }
  }
  function renderDiary(parent,seasonId){
    const diary=currentDiary.filter(d=>d.season_id===seasonId);
    const block=el("div","diary-panel");block.hidden=true;
    if(!diary.length){block.append(el("p","empty","Chưa có nhật ký được duyệt công khai."));return block;}
    for(const d of diary){
      const item=el("article","diary-entry");
      add(item,el("small","",d.observed_on?"Ngày ghi nhận: "+formatDay(d.observed_on):"Tiếp nhận: "+formatDay(d.received_on||"")),
        el("b","",d.title),el("p","",d.detail));
      if(typeof d.media_url==="string"&&d.media_url.startsWith("https://phanminhtuandalat.github.io/nvs-crop-passport-site/assets/videos/")&&d.media_url.endsWith(".mp4")){
        const video=el("video","diary-video");
        video.src=d.media_url;video.controls=true;video.preload="none";video.playsInline=true;
        video.setAttribute("aria-label",d.title);
        item.append(video);
      }
      block.append(item);
    }
    return block;
  }
  function renderFarms(){
    renderSummary();
    const root=$("farm-list");root.replaceChildren();
    if(!currentFarms.length){root.append(el("p","empty","NVS chưa công bố vườn nào trong danh sách khách được mời."));return;}
    for(const f of currentFarms){
      const farm=el("article","farm-card");
      const top=el("div","farm-top");
      const title=el("div","");
      add(title,el("small","",f.location_public||"Nông Dân NVS"),el("h3","",f.name));
      top.append(title);
      if(f.member_nvs)top.append(el("span","member-tag","Thành viên NVS"));
      farm.append(top);
      const grid=el("div","season-list");
      for(const s of seasons.filter(s=>s.farm_id===f.id)){
        const card=el("div","season-card");
        const badge=el("span","stage-label"+(s.stage==="planned"?" planned":""),names[s.stage]||s.stage);
        add(card,badge,el("h4","",s.crop_name),el("p","",s.description_public||"Thông tin sẽ được cập nhật"));
        if(s.planted_on)card.append(el("div","season-meta","Ngày trồng thực tế: "+formatDay(s.planted_on)));
        else if(s.planned_planting)card.append(el("div","season-meta","Dự kiến xuống giống: "+formatDay(s.planned_planting)));
        if(s.expected_harvest)card.append(el("div","season-meta","Thu hoạch dự kiến: "+formatDay(s.expected_harvest)));
        const buttons=el("div","season-actions");
        const diaryButton=el("button","soft-button","Xem nhật ký");
        diaryButton.type="button";
        const diary=renderDiary(card,s.id);
        diaryButton.addEventListener("click",()=>{diary.hidden=!diary.hidden;diaryButton.textContent=diary.hidden?"Xem nhật ký":"Ẩn nhật ký";});
        buttons.append(diaryButton);
        const kind=stageOrder(s);
        const order=el("button","season-button",kind?actionNames[kind]:"Chưa mở nhận đơn");
        order.type="button";
        if(!kind)order.disabled=true;
        else order.addEventListener("click",()=>showOrder(s,kind));
        buttons.append(order);
        card.append(buttons,diary);
        if(!kind){
          const tip=el("p","","Chưa nhận đặt hàng ở giai đoạn này; NVS sẽ cập nhật khi có thể phục vụ.");
          tip.className="fine-print";card.append(tip);
        }
        grid.append(card);
      }
      if(!grid.childElementCount)grid.append(el("p","empty","Vườn này chưa có mùa vụ được duyệt công khai."));
      farm.append(grid);root.append(farm);
    }
  }
  function showOrder(s,kind){
    chosen={s,kind};
    $("order-title").textContent=actionNames[kind];
    $("order-product").textContent=s.crop_name+" · "+names[s.stage];
    $("order-unit").textContent="("+s.unit+")";
    $("order-quantity").value="";
    $("order-quantity").step=s.unit==="kg"?"0.1":"1";
    $("order-note").value="";
    notice("order-message","");
    $("order-dialog").showModal();
  }
  async function refreshOrders(){
    try{
      const data=await call("my_orders");
      const root=$("order-list");root.replaceChildren();
      if(!data.orders.length){root.append(el("div","empty","Chưa có yêu cầu mua hoặc đặt trước nào."));return;}
      for(const o of data.orders){
        const line=el("div","my-order");
        add(line,el("b","",o.season_id+" · "+o.qty+" "+o.unit),
          el("span","",(o.kind==="purchase"?"Đặt mua":"Đặt trước")+" · Trạng thái: "+o.status+" · "+new Date(o.created_at).toLocaleDateString("vi-VN")));
        root.append(line);
      }
    }catch(e){notice("order-list",e.message);if(e.status===401)clear();}
  }
  async function load(){
    const data=await call("catalog");
    currentFarms=data.farms||[];
    seasons=data.seasons||[];
    currentDiary=data.diary||[];
    $("invite-panel").hidden=true;$("portal").hidden=false;$("logout").hidden=false;
    renderFarms();await refreshOrders();
  }
  $("invite-form").addEventListener("submit",async e=>{
    e.preventDefault();
    const btn=$("access-button");btn.disabled=true;
    notice("auth-message","Đang kiểm tra mã mời…");
    try{
      const data=await call("redeem",{phone:$("phone").value,code:$("invite-code").value},true);
      token=data.session_token;
      try{sessionStorage.setItem(KEY,JSON.stringify({token,expires_at:data.expires_at}));}catch(_){}
      await load();
      notice("auth-message","");
    }catch(e){notice("auth-message",e.message);if(e.status===401)clear();}
    finally{btn.disabled=false;}
  });
  $("order-form").addEventListener("submit",async e=>{
    e.preventDefault();if(!chosen)return;
    const btn=$("submit-order");btn.disabled=true;notice("order-message","Đang gửi yêu cầu…");
    try{
      const data=await call("request_order",{season_id:chosen.s.id,qty:Number($("order-quantity").value),note:$("order-note").value});
      notice("order-message",data.message||"Đã gửi yêu cầu đến NVS.");
      await refreshOrders();
      btn.textContent="Đã gửi ✓";
      btn.disabled=true;
    }catch(e){notice("order-message",e.message);btn.disabled=false;if(e.status===401){$("order-dialog").close();clear();}}
  });
  $("close-dialog").addEventListener("click",()=>$("order-dialog").close());
  $("cancel-order").addEventListener("click",()=>$("order-dialog").close());
  $("reload-orders").addEventListener("click",refreshOrders);
  $("logout").addEventListener("click",async()=>{try{await call("logout");}catch(_){}clear();});
  if(token)load().catch(e=>{clear();notice("auth-message",e.message);});
})();
