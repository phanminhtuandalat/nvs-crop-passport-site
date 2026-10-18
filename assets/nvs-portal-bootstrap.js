"use strict";
(function(){
  const url=window.NVS_APPS_SCRIPT_URL;
  if(typeof url!=="string"||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))return;
  const frame=document.getElementById("apps-portal");
  const button=document.getElementById("portal-open-link");
  const section=document.getElementById("portal-access");
  button.href=url;
  section.hidden=false;
  // The native Google Apps Script page can reject embedding due to Google privacy or frame policy.
  // Always provide an explicit direct URL as a reliable fallback.
  frame.src=url;
  frame.hidden=false;
  document.getElementById("not-ready").hidden=true;
})();
