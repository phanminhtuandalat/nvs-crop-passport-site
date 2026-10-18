"use strict";
const demoCode = "DEMO-NVS-0001";
const root = document.querySelector("#passport");
const input = document.querySelector("#lot-input");
const note = document.querySelector("#lookup-message");
const button = document.querySelector("#lot-button");
const notice = document.querySelector("#notice");
const params = new URLSearchParams(window.location.search);
const requestedCode = (params.get("lot") || "").trim().toUpperCase();
if (requestedCode) {
  input.value = requestedCode;
  if (requestedCode === demoCode) {
    note.textContent = "Mã DEMO là hồ sơ minh họa. Chưa có lô bí thật được duyệt để truy xuất.";
    notice.querySelector("strong").textContent = "HỒ SƠ MẪU";
  } else {
    note.textContent = "Không tìm thấy mã lô công khai đã được phê duyệt. Hãy kiểm tra mã trên tem sản phẩm.";
    note.style.color = "#a04634";
    notice.querySelector("strong").textContent = "CHƯA CÓ HỒ SƠ";
    notice.querySelector("span").textContent = "Mã lô này chưa được công bố. Không thể suy ra nguồn gốc hoặc chất lượng của sản phẩm từ mã không tìm thấy.";
  }
  if (root) root.scrollIntoView({behavior:"auto",block:"start"});
}
button.addEventListener("click", function () {
  const code = input.value.trim().toUpperCase();
  if (!code) {
    note.textContent = "Vui lòng nhập mã lô.";
    return;
  }
  // Lookup only against approved public registry when that registry exists.
  // At the pilot stage, the sole allowed identifier is explicitly DEMO.
  window.location.href = "./lot.html?id=" + encodeURIComponent(code);
});
input.addEventListener("keydown", function(event){if(event.key==="Enter")button.click();});
document.querySelector("#sample-url").href = "./lot.html?id=" + encodeURIComponent(demoCode);
/* Public media are intentionally separate from private farm records. */
const gallery = document.getElementById("media-gallery");
if (gallery) {
  fetch("./data/public_media.json", { cache: "no-store" })
    .then(response => {
      if (!response.ok) throw new Error("Media registry unavailable");
      return response.json();
    })
    .then(data => {
      const items = Array.isArray(data.approved_media) ? data.approved_media.filter(item =>
        item.approval_status === "approved_public" &&
        (item.media_type === "photo" || item.media_type === "video") &&
        typeof item.public_url === "string" &&
        (item.public_url.startsWith("./assets/") || item.public_url.startsWith("https://"))
      ) : [];
      if (!items.length) return;
      gallery.replaceChildren();
      for (const item of items) {
        const article = document.createElement("article");
        article.className = "media-card";
        const link = document.createElement("a");
        link.href = item.public_url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        if (item.media_type === "photo") {
          const image = document.createElement("img");
          image.src = item.public_url;
          image.loading = "lazy";
          image.alt = item.caption || "Ảnh hiện trường Chi's Farm";
          link.append(image);
        } else {
          const poster = document.createElement("div");
          poster.className = "media-video";
          poster.textContent = "▶ Xem clip vườn";
          link.append(poster);
        }
        const caption = document.createElement("div");
        caption.className = "media-caption";
        const name = document.createElement("strong");
        name.textContent = item.caption || (item.media_type === "photo" ? "Ảnh hiện trường" : "Video hiện trường");
        const dateText = document.createElement("small");
        dateText.textContent = item.captured_on || "Ngày chụp chưa xác nhận";
        caption.append(name, dateText);
        article.append(link, caption);
        gallery.append(article);
      }
    })
    .catch(() => { /* Keep truthful empty-state message. */ });
}
