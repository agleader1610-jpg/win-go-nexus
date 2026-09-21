// Auto refresh + notice popup. Plain JS, no build step.
(function () {
  // ---- official notice (once per browser)
  var n = document.getElementById("sw-notice");
  if (n) {
    if (localStorage.getItem("sw_notice_v1") === "1") n.remove();
    else {
      var close = n.querySelector("[data-close]");
      if (close) close.addEventListener("click", function () {
        localStorage.setItem("sw_notice_v1", "1");
        n.remove();
      });
    }
  }

  // ---- period countdown + soft reload when a new draw lands
  var body = document.body;
  var period = parseInt(body.getAttribute("data-period-sec") || "0", 10);
  var cd = document.getElementById("sw-countdown");
  if (!period) return;

  function tick() {
    var left = period - Math.floor((Date.now() / 1000) % period);
    if (cd) cd.textContent = left < 10 ? "0" + left + "s" : left + "s";
    if (left <= 1) setTimeout(function () { location.reload(); }, 1600);
  }
  tick();
  setInterval(tick, 1000);
})();
