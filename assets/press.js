// Puts the press email and phone together in the browser, so neither appears whole in the HTML.
// Simple address/number harvesters read the raw HTML and find nothing usable.
(function () {
  document.querySelectorAll('[data-mail-user]').forEach(function (el) {
    var addr = el.dataset.mailUser + '@' + el.dataset.mailDomain;
    el.href = 'mailto:' + addr;
    var t = el.querySelector('[data-mail-text]') || el; t.textContent = addr;
  });
  // data-tel-r holds the international number reversed, e.g. "+46701234567" -> "76543210764+"
  document.querySelectorAll('[data-tel-r]').forEach(function (el) {
    var intl = el.dataset.telR.split('').reverse().join('');
    var n = '0' + intl.slice(3); // Swedish national form
    var shown = n.slice(0, 3) + '-' + n.slice(3, 6) + ' ' + n.slice(6, 8) + ' ' + n.slice(8);
    el.href = 'tel:' + intl;
    var t = el.querySelector('[data-tel-text]') || el; t.textContent = shown;
  });
})();
