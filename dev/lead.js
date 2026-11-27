/* Заявка с сайта: POST /api/lead на VPS, оттуда через ~5 с ему в Telegram (бот @WIV_MCservbot, только владельцу).
   С http://localhost:8783 сервер пишет заявку в тестовый файл и в бота её не шлёт: локальные проверки — только с этого порта.
   Разметка: <form class="ask" data-page="dev"> с полями contact, text (необязательно), website (ловушка) и кнопками [data-topic]. */
(function () {
  'use strict';
  var API = 'https://173-249-26-11.sslip.io:8444/api/lead';
  var TG = 'https://t.me/aliveenjoyer';
  var opened = Date.now();

  document.querySelectorAll('form.ask').forEach(function (f) {
    var input = f.querySelector('[name=contact]');
    var text = f.querySelector('[name=text]');
    var more = f.querySelector('.ask-more');
    var trap = f.querySelector('[name=website]');
    var btn = f.querySelector('button[type=submit]');
    var msg = f.querySelector('.ask-msg');
    var topics = f.querySelectorAll('[data-topic]');
    var topic = '';

    topics.forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-checked') !== 'true';
        topics.forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        topic = on ? b.getAttribute('data-topic') : '';
      });
    });
    if (more && text) {
      more.addEventListener('click', function () { text.hidden = false; more.hidden = true; text.focus(); });
    }

    function say(words, kind, withLink) {
      msg.textContent = words;
      msg.className = 'ask-msg' + (kind ? ' ' + kind : '');
      if (withLink) {
        var a = document.createElement('a');
        a.href = TG; a.textContent = 'Telegram-канал';
        msg.appendChild(document.createTextNode(' Напиши мне в '));
        msg.appendChild(a);
        msg.appendChild(document.createTextNode('.'));
      }
    }

    input.addEventListener('input', function () { if (msg.classList.contains('err')) say('', ''); });

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.classList.contains('sent') || btn.disabled) return;
      var contact = input.value.trim();
      if (contact.length < 3) {
        say('Оставь Telegram, Discord или почту, иначе мне некуда написать.', 'err');
        input.focus();
        return;
      }
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Отправляю…';
      var body = {
        contact: contact,
        topic: topic || 'other',
        text: text ? text.value.trim() : '',
        page: f.getAttribute('data-page') || 'dev',
        t: Date.now() - opened,
        website: trap ? trap.value : ''
      };
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) { return { s: r.status, j: j }; });
        })
        .then(function (res) {
          if (res.s === 200) {
            f.classList.add('sent');
            btn.textContent = 'Заявка у меня';
            say('Готово. Напишу тебе сам, жди сообщения.', 'ok');
            return;
          }
          if (res.s === 422 && res.j && res.j.fields) {
            var k = Object.keys(res.j.fields)[0];
            say(res.j.fields[k], 'err');
            var el = f.querySelector('[name="' + k + '"]');
            if (el) { el.hidden = false; el.focus(); }
          } else if (res.s === 429) {
            say('С твоего адреса уже было несколько заявок, я их увижу.', 'err', true);
          } else {
            say('Заявка не ушла.', 'err', true);
          }
          btn.disabled = false; btn.textContent = label;
        })
        .catch(function () {
          say('Заявка не ушла, нет связи с сервером.', 'err', true);
          btn.disabled = false; btn.textContent = label;
        });
    });
  });
})();
