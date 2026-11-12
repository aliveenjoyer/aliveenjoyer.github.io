/* Счётчик посещений сайтов aliveenjoyer: один короткий запрос на наш VPS за просмотр страницы, без cookie и чужих
   трекеров. Сервер хранит не IP, а хэш на один день (см. /api/hit в /opt/wlapp/app.py), сводка — wl-stats --all.
   Подключается одной строкой: <script src="https://aliveenjoyer.art/stat.js" data-page="encore" defer></script>.
   ?nostat=1 — не считать этот браузер на этом сайте, ?nostat=0 — снова считать, ?stat=test — тестовый просмотр.
   У майнкрафт-сайта свой счётчик: minecraft/stat.js. */
(function () {
  "use strict";
  var API = "https://173-249-26-11.sslip.io:8444/api/hit";
  var me = document.currentScript;
  var host = location.hostname, path = location.pathname, q = location.search;
  var page = me && me.getAttribute("data-page");
  if (!page) {
    page = /^encore\./.test(host) ? "encore" : /^overlay\./.test(host) ? "overlay" :
      /^\/chatlock/.test(path) ? "chatlock" : /^\/deadlock-optimizer/.test(path) ? "dlo" : "hub";
  }
  var store = null;
  try { store = window.localStorage; store.getItem("ae-nostat"); } catch (e) { store = null; }
  function get(k) { try { return store ? store.getItem(k) : null; } catch (e) { return null; } }
  function set(k, v) { try { if (store) { if (v === null) store.removeItem(k); else store.setItem(k, v); } } catch (e) {} }

  if (/[?&]nostat=1/.test(q)) set("ae-nostat", "1");
  if (/[?&]nostat=0/.test(q)) set("ae-nostat", null);
  var test = /[?&]stat=test/.test(q);
  if (get("ae-nostat") && !test) return;
  if (!/(^|\.)aliveenjoyer\.art$|^aliveenjoyer\.github\.io$/.test(host) && !test) return;

  var isNew = 9;
  if (store) { isNew = get("ae-seen-" + page) ? 0 : 1; set("ae-seen-" + page, "1"); }
  var ref = (document.referrer || "").replace(/^[a-z]+:\/\/([^\/:?#]+).*$/i, "$1");
  if (ref === document.referrer) ref = "";
  if (ref === host) ref = "self";
  var src = /[?&](?:from|utm_source)=([\w.\-]{1,32})/.exec(q);

  var body = "p=" + encodeURIComponent(page) + "&n=" + isNew + "&r=" + encodeURIComponent(ref) +
             "&s=" + (src ? encodeURIComponent(src[1]) : "") + (test ? "&x=1" : "");
  try { if (navigator.sendBeacon && navigator.sendBeacon(API, body)) return; } catch (e) {}
  new Image().src = API + "?" + body + "&t=" + new Date().getTime();
})();
