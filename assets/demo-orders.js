"use strict";
(function(){
  const registry="./data/demo_orders.json";
  const byId=id=>document.getElementById(id);
  const el=(tag,cls,content)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(content!==undefined)node.textContent=String(content);
    return node;
  };
  const append=(parent,...kids)=>{kids.forEach(k=>parent.append(k));return parent;};
  function renderList(data){
    const root=byId("order-grid");
    if(!root)return;
    root.replaceChildren();
    for(let i=0;i<data.orders.length;i++){
      const order=data.orders[i];
      const card=el("article","order-card");
      const header=el("div","order-card-header");
      append(header,
        el("div","order-index","ĐƠN HÀNG DEMO "+String(i+1).padStart(2,"0")),
        el("h3","",order.buyer_display_name),
        el("div","order-qty",order.quantity_display+" bí hạt dẻ"),
        el("small","",order.unconfirmed || "Số lượng ví dụ, chưa có lô thu hoạch thực tế.")
      );
      const href="./demo-order.html?token="+encodeURIComponent(order.token);
      const qrLink=el("a","qr-link");
      qrLink.href=href;qrLink.title="Quét hoặc mở mã QR của "+order.buyer_display_name;
      const image=el("img","order-qr");
      image.src=order.qr_file;
      image.width=206;image.height=206;image.loading="lazy";
      image.alt="QR demo đơn hàng "+order.buyer_display_name+"; "+order.quantity_display;
      append(qrLink,image);
      const bottom=el("div","order-card-bottom");
      append(bottom,el("span","order-ref",order.order_id));
      const open=el("a","btn","Xem trang truy xuất ↗");open.href=href;
      append(bottom,open);
      append(card,header,qrLink,bottom);
      root.append(card);
    }
  }
  function field(label,value){
    return append(el("div","verify-field"),el("small","",label),el("strong","",value));
  }
  function renderVerify(data){
    const root=byId("verify-result");
    if(!root)return;
    const token=new URLSearchParams(location.search).get("token")||"";
    const matched=data.orders.find(o=>o.token===token && o.status==="simulation_only");
    if(!matched){
      root.replaceChildren(append(el("div","verify-error"),
        el("strong","","Không tìm thấy mã demo này"),
        el("p","","Mã không có trong danh sách minh họa. Không thể suy ra hàng hóa thật hay giả chỉ từ thao tác này."),
        (()=>{const a=el("a","text-link","Xem ba mã QR demo ↗");a.href="./demo-orders.html";return a;})()));
      document.title="Không tìm thấy mã demo | NVS";
      return;
    }
    document.title=matched.buyer_display_name+" · DEMO truy xuất đơn hàng NVS";
    const sheet=el("article","verify-sheet");
    const top=append(el("div","verify-top"),el("strong","","NVS · BẢN DEMO TRUY XUẤT"),el("span","","KHÔNG PHẢI XÁC THỰC HÀNG HÓA HAY ĐƠN BÁN THẬT"));
    const body=el("div","verify-body");
    append(body,el("div","eyebrow dark","NGUỒN GỐC THEO HỒ SƠ MINH HỌA"),el("h1","verify-title","Bí hạt dẻ"),el("p","verify-muted","Chi's Farm · Nông trại tham gia hệ sinh thái Nông Dân NVS (mô phỏng giao dịch)"));
    const warning=el("div","verify-flag");
    append(warning,el("strong","","⚠️ CẢNH BÁO NGUỒN HÀNG — GIAO DỊCH MINH HỌA"));
    append(warning,
      el("p","","Trong ví dụ này, sản phẩm được ghi là của Chi's Farm – nông trại Nông Dân NVS – và bán trực tiếp cho "+matched.buyer_display_name+"."),
      el("p","","Nếu bạn không phải "+matched.buyer_display_name+" và cũng không mua lại, được tặng hoặc nhận chuyển giao từ người mua này, hãy kiểm tra với nơi bán. Đây có thể là dấu hiệu hàng không đi qua giao dịch NVS đã ghi nhận."),
      el("p","","Thông tin trên chỉ mô phỏng cách cảnh báo. Một mã QR hợp lệ vẫn có thể bị sao chép lên sản phẩm khác; quét QR không tự chứng minh hàng thật hay giả.")
    );
    body.append(warning);
    const grid=el("div","verify-grid");
    append(grid,
      field("Nông trại","Chi's Farm"),
      field("Người mua được ghi nhận",matched.buyer_display_name),
      field("Số lượng ví dụ",matched.quantity_display),
      field("Mã đơn hàng",matched.order_id),
      field("Tình trạng đơn","DEMO · Chưa phát sinh đơn bán thật"),
      field("Mã lô thu hoạch","Chưa phát hành")
    );
    if(matched.unconfirmed)append(grid,field("Thông tin thùng",matched.unconfirmed));
    body.append(grid);
    const box=el("div","verify-info");
    box.textContent="Không cần đăng nhập hay OTP. Bất kỳ ai quét mã đều xem được tên người mua được NVS cho phép công khai. Với hệ thống thương mại thật, chỉ dùng tên hiển thị hoặc tên doanh nghiệp được phép công bố.";
    body.append(box);
    const buttons=el("div","verify-actions");
    const back=el("a","btn btn-soft","← Thử QR đơn khác");back.href="./demo-orders.html";
    const season=el("a","btn","Xem nhật ký vụ bí thật ↗");season.href="./season.html?id=NVS-CF-BHD-20261019#video-cay-giong";
    append(buttons,back,season);
    body.append(buttons);
    append(body,el("p","verify-note","Chi's Farm đã có tư liệu cây giống thực tế. Ba giao dịch với CT Farm, LIM và CEM là ví dụ anh đưa ra để kiểm thử trải nghiệm; không được ghi doanh thu, tồn kho hoặc chất lượng đã xác thực."));
    append(sheet,top,body);
    root.replaceChildren(sheet);
  }
  fetch(registry,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Không tải được dữ liệu demo");return r.json()})
    .then(d=>{
      if(!d || !Array.isArray(d.orders) || d.orders.length!==3)throw Error("Dữ liệu demo không hợp lệ");
      renderList(d);renderVerify(d);
    })
    .catch(()=>{
      const target=byId("verify-result")||byId("order-grid");
      if(target)target.replaceChildren(el("div","verify-error","Không tải được dữ liệu demo. Hãy tải lại trang."));
    });
})();
