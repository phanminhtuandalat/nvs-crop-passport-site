"use strict";
(function () {
  const url = window.NVS_APPS_SCRIPT_URL;
  const link = document.getElementById("portal-open-link");
  const alert = document.getElementById("portal-unavailable");
  const valid = typeof url === "string" && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url);
  if (!link) return;
  if (valid) {
    link.href = url;
    link.removeAttribute("aria-disabled");
    link.removeAttribute("tabindex");
    if(alert) alert.setAttribute("aria-hidden","true");
  } else {
    link.removeAttribute("href");
    link.setAttribute("aria-disabled","true");
    link.setAttribute("tabindex","-1");
    if(alert) alert.setAttribute("aria-hidden","false");
  }
})();