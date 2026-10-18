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
  window.location.href = code === "NVS-CF-BHD-20261019"
    ? "./season.html?id=NVS-CF-BHD-20261019#video-cay-giong"
    : "./lot.html?id=" + encodeURIComponent(code);
});
input.addEventListener("keydown", function(event){if(event.key==="Enter")button.click();});
document.querySelector("#sample-url").href = "./community.html";
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
        if (item.media_type === "video" && item.provider === "github_pages" && item.public_url.startsWith("./assets/videos/")) {
          const video = document.createElement("video");
          video.className = "media-native-video";
          video.controls = true;
          video.preload = "metadata";
          video.playsInline = true;
          video.src = item.public_url;
          video.setAttribute("aria-label", item.caption || "Video cây giống");
          article.append(video);
        } else if (item.media_type === "photo") {
          const image = document.createElement("img");
          image.src = item.public_url;
          image.loading = "lazy";
          image.alt = item.caption || "Ảnh hiện trường Chi's Farm";
          link.append(image);
          article.append(link);
        } else if (item.provider === "google_drive" && /^[a-zA-Z0-9_-]{10,80}$/.test(item.drive_file_id || "")) {
          const player = document.createElement("div");
          player.className = "media-player";
          const frame = document.createElement("iframe");
          frame.title = item.caption || "Video cây giống Chi's Farm";
          frame.src = "https://drive.google.com/file/d/" + encodeURIComponent(item.drive_file_id) + "/preview";
          frame.loading = "lazy";
          frame.allow = "autoplay; fullscreen";
          frame.allowFullscreen = true;
          player.append(frame);
          article.append(player);
          link.className = "media-drive-link";
          link.textContent = "↗ Xem video trên Google Drive";
          article.append(link);
        } else {
          const poster = document.createElement("div");
          poster.className = "media-video";
          poster.textContent = "▶ Xem clip vườn";
          link.append(poster);
          article.append(link);
        }
        const caption = document.createElement("div");
        caption.className = "media-caption";
        const name = document.createElement("strong");
        name.textContent = item.caption || (item.media_type === "photo" ? "Ảnh hiện trường" : "Video hiện trường");
        const dateText = document.createElement("small");
        dateText.textContent = item.captured_on ? ("Ngày quay: " + item.captured_on) : ("Tiếp nhận: " + (item.received_on || "Chưa rõ ngày"));
        caption.append(name, dateText);
        if (item.description) {
          const description = document.createElement("p");
          description.className = "media-description";
          description.textContent = item.description;
          caption.append(description);
        }
        if (item.source_access === "owner_only") {
          const restriction = document.createElement("p");
          restriction.className = "media-restriction";
          restriction.textContent = "Video hiện chỉ tài khoản có quyền trên Google Drive mới phát được. Chưa mở quyền xem công khai.";
          caption.append(restriction);
        }
        article.append(caption);
        gallery.append(article);
      }
    })
    .catch(() => { /* Keep truthful empty-state message. */ });
}
