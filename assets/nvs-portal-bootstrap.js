"use strict";
(function(){
const url=window.NVS_APPS_SCRIPT_URL;
if(typeof url!=="string" || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) return;
const frame=document.getElementById("apps-portal");
frame.src=url;frame.hidden=false;
document.getElementById("not-ready").hidden=true;
})();
