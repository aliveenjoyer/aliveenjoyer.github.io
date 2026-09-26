/* Эмпирей page: the section tabs follow the reading, and the renders open large. Plain ES5 for old phones. */
(function () {
  "use strict";

  /* ---------- the tab of the section in view ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".emp-nav a"));
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
  function mark(id) {
    links.forEach(function (a) { a.removeAttribute("aria-current"); });
    var a = byId[id];
    if (!a) return;
    a.setAttribute("aria-current", "true");
    var bar = a.parentNode.parentNode;
    var left = a.parentNode.offsetLeft - 24;
    if (left < bar.scrollLeft || left + a.offsetWidth + 48 > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = left;
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- renders open large ---------- */
  var viewer = document.querySelector(".viewer");
  var vImg = viewer && viewer.querySelector("img");
  Array.prototype.forEach.call(document.querySelectorAll(".zoom"), function (b) {
    b.addEventListener("click", function () {
      if (!viewer || typeof viewer.showModal !== "function") { window.open(b.getAttribute("data-full"), "_blank"); return; }
      vImg.src = b.getAttribute("data-full");
      vImg.alt = b.querySelector("img").alt;
      viewer.showModal();
    });
  });
  if (viewer) viewer.addEventListener("click", function (e) { if (e.target === viewer) viewer.close(); });
})();
