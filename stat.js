/* Visit counter: one small request per page view to our own server, no cookies and no third-party trackers.
   The server keeps a daily hash instead of the IP (see /api/hit). ?nostat=1 stops counting this browser, ?nostat=0 resumes. */
(function () {
  "use strict";
  var API = "https://173-249-26-11.sslip.io:8444/api/hit";
  var q = location.search;
  var store = null;
  try { store = window.localStorage; store.getItem("ae-seen"); } catch (e) { store = null; }
  function get(k) { try { return store ? store.getItem(k) : null; } catch (e) { return null; } }
  function set(k, v) { try { if (store) { if (v === null) store.removeItem(k); else store.setItem(k, v); } } catch (e) {} }

  if (/[?&]nostat=1/.test(q)) set("ae-nostat", "1");
  if (/[?&]nostat=0/.test(q)) set("ae-nostat", null);
  var test = /[?&]stat=test/.test(q);
  if (get("ae-nostat") && !test) return;
  if (location.hostname !== "aliveenjoyer.github.io" && !test) return;

  var path = location.pathname;
  var page = /season2-map/.test(path) ? "map" : /season1/.test(path) ? "s1" : "home";
  var isNew = 9;
  if (store) { isNew = get("ae-seen") ? 0 : 1; set("ae-seen", "1"); }
  var ref = (document.referrer || "").replace(/^[a-z]+:\/\/([^\/:?#]+).*$/i, "$1");
  if (ref === document.referrer) ref = "";
  var src = /[?&](?:from|utm_source)=([\w.\-]{1,32})/.exec(q);

  var body = "p=" + page + "&n=" + isNew + "&r=" + encodeURIComponent(ref) +
             "&s=" + (src ? encodeURIComponent(src[1]) : "") + (test ? "&x=1" : "");
  try { if (navigator.sendBeacon && navigator.sendBeacon(API, body)) return; } catch (e) {}
  new Image().src = API + "?" + body + "&t=" + new Date().getTime();
})();
