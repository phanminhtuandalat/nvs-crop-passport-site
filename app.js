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