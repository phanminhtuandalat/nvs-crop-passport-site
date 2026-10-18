"use strict";
document.getElementById("year")?.replaceChildren(String(new Date().getFullYear()));
const root = document.getElementById("passport");
const el = (tag, cls, text) => { const n=document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)n.textContent=String(text); return n; };
function append(parent, ...nodes) { nodes.forEach(n=>parent.appendChild(n)); return parent; }
function content(root, lot) {
  const demo = lot.is_demo === true && lot.approval_status === "demo_only";
  const approved = lot.is_demo !== true && lot.approval_status === "approved_public";
  if (!demo && !approved) {root.replaceChildren(el("div","error-card","Hồ sơ chưa được phê duyệt công khai."));return;}
  const box=el("article","passport-full");
  const banner=append(el("div","lot-banner"),el("span","caps","NVS PRODUCT PASSPORT"),el("span",demo?"status-demo":"status-public",demo?"HỒ SƠ MINH HỌA":"ĐÃ PHÊ DUYỆT CÔNG KHAI"));
  append(box,banner);
  const hero=el("div","lot-hero");
  append(hero, el("p","eyebrow",lot.brand||"NVS"),el("h1","",lot.title),el("p","lot-subtitle",lot.farm+" • "+lot.season_label));
  append(box,hero);
  if (demo) append(box,el("div","demo-warning","⚠ DỮ LIỆU THỬ NGHIỆM. Chưa có lô thu hoạch, kiểm nghiệm hoặc sản phẩm thực tế cho hồ sơ này."));
  append(box,el("h2","section-title","Thông tin lô sản phẩm"));
  const dl=el("dl","details");
  (lot.fields||[]).forEach(pair=>{const item=el("div","detail-pair");append(item,el("dt","",pair[0]),el("dd","",pair[1]));dl.appendChild(item)});
  append(box,dl);
  append(box,el("h2","section-title","Dòng thời gian"));
  const timeline=el("ol","timeline");
  (lot.events||[]).forEach(e=>{const li=el("li","");append(li,el("time","",e.date),el("strong","",e.title),el("p","",e.detail));timeline.appendChild(li)});
  append(box,timeline);
  appendSeasonMedia(box, lot, demo);
  append(box,el("h2","section-title","Chất lượng & minh chứng"));
  append(box,el("p","quality",lot.quality||"Chưa công bố kết quả kiểm nghiệm."));
  if(lot.public_note) append(box,el("p","muted",lot.public_note));
  const cta=el("div","lot-actions");const back=el("a","button button-light","Về trang chủ");back.href="./";append(cta,back);append(box,cta);
  root.replaceChildren(box);
}
if(root){
  const params=new URLSearchParams(location.search);
  const id=params.get("id");
  if(!id || !/^[A-Za-z0-9_-]{3,64}$/.test(id)) root.replaceChildren(el("div","error-card","Thiếu mã lô hợp lệ. Vui lòng kiểm tra mã QR."));
  else fetch("data/public_lots.json",{cache:"no-store"})
    .then(r=>{if(!r.ok)throw new Error("Không tải được hồ sơ"); return r.json();})
    .then(d=>{const lot=d.lots.find(x=>x.id===id);if(!lot){root.replaceChildren(el("div","error-card","Không tìm thấy lô đã công bố với mã này."));return;} content(root,lot);document.title=lot.title+" | NVS Crop Passport";})
    .catch(()=>root.replaceChildren(el("div","error-card","Chưa thể tải dữ liệu. Vui lòng thử lại khi có kết nối mạng.")));
}


/** Hiển thị hình ảnh và video đã duyệt của đúng mùa vụ trong trang QR. */
function appendSeasonMedia(box, lot, demo) {
  const section=el("section","passport-media-section");
  section.id="season-media";
  append(section,
    el("h2","section-title","Nhật ký hình ảnh & video"),
    el("p","media-intro",demo
      ? "Tư liệu thật từ vườn, gắn với mùa vụ thí điểm. Đây không phải bằng chứng đã thu hoạch hoặc kiểm nghiệm."
      : "Tư liệu canh tác được cho phép công khai, gắn với mùa vụ của sản phẩm."));
  const list=el("div","passport-media-list");
  list.appendChild(el("p","media-loading","Đang tải tư liệu mùa vụ…"));
  section.appendChild(list);
  box.appendChild(section);
  fetch("./data/public_media.json",{cache:"no-store"})
    .then(r=>{if(!r.ok)throw new Error("media fetch failed");return r.json();})
    .then(data=>{
      const items=(Array.isArray(data.approved_media)?data.approved_media:[]).filter(m=>
        m.season_id===lot.season_id &&
        m.approval_status==="approved_public" &&
        m.source_access==="public" &&
        (m.media_type==="video"||m.media_type==="photo") &&
        typeof m.public_url==="string" &&
        /^\.\/assets\/(?:videos|photos|images)\/[A-Za-z0-9_-]+\.(?:mp4|webm|jpg|jpeg|png|webp)$/i.test(m.public_url)
      );
      list.replaceChildren();
      if(!items.length){list.appendChild(el("p","media-loading","Chưa có ảnh hoặc clip của mùa vụ được duyệt công khai."));return;}
      for(const item of items){
        const card=el("article","passport-media-card");
        if(item.media_type==="video"){
          const player=el("video","passport-video");
          player.controls=true;
          player.playsInline=true;
          player.preload="metadata";
          player.src=item.public_url;
          player.setAttribute("aria-label",item.caption||"Video canh tác");
          player.appendChild(el("span","","Trình duyệt không hỗ trợ phát video."));
          card.appendChild(player);
        } else {
          const img=el("img","passport-photo");
          img.src=item.public_url;img.loading="lazy";img.alt=item.caption||"Ảnh canh tác";
          card.appendChild(img);
        }
        const desc=el("div","passport-media-info");
        append(desc,el("strong","",item.caption||(item.media_type==="video"?"Video canh tác":"Ảnh canh tác")));
        if(item.phase)desc.appendChild(el("small","",item.phase));
        desc.appendChild(el("p","",item.captured_on
          ? "Ngày ghi hình: "+item.captured_on
          : "Tiếp nhận: "+(item.received_on||"Chưa xác nhận")+". Ngày ghi hình thực tế chưa xác nhận."));
        if(item.description)desc.appendChild(el("p","",item.description));
        const link=el("a","media-direct-link","Mở "+(item.media_type==="video"?"clip MP4":"ảnh")+" trực tiếp ↗");
        link.href=item.public_url;link.target="_blank";link.rel="noopener noreferrer";
        desc.appendChild(link);card.appendChild(desc);list.appendChild(card);
      }
    })
    .catch(()=>list.replaceChildren(el("p","media-error","Không thể tải nhật ký hình ảnh. Vui lòng tải lại trang.")));
}
