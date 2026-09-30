// Contact form: client-side validation, Formspree submit, success state.
// Messages come from data-* attributes on the form so each language page supplies its own copy.
(function () {
  var form = document.getElementById('contact-form');
  var sent = document.getElementById('contact-sent');
  var sentTitle = document.getElementById('sent-title');
  var status = document.getElementById('form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var msg = form.dataset;
  var fields = ['name', 'email', 'message'];

  function setError(key, text) {
    var input = form.elements[key];
    document.getElementById('err-' + key).textContent = text || '';
    if (text) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function validate() {
    var e = {};
    if (!form.elements.name.value.trim()) e.name = msg.errName;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.elements.email.value.trim())) e.email = msg.errEmail;
    if (form.elements.message.value.trim().length < 5) e.message = msg.errMessage;
    return e;
  }

  fields.forEach(function (key) {
    form.elements[key].addEventListener('input', function () { setError(key, ''); });
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    status.textContent = '';
    var errors = validate();
    fields.forEach(function (key) { setError(key, errors[key]); });
    var first = fields.find(function (key) { return errors[key]; });
    if (first) { form.elements[first].focus(); return; }

    var firstName = form.elements.name.value.trim().split(/\s+/)[0];
    submitBtn.disabled = true;
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      sentTitle.textContent = msg.thanks.replace('{name}', firstName);
      form.hidden = true;
      sent.hidden = false;
      sentTitle.focus();
    }).catch(function () {
      status.textContent = msg.errSend;
    }).finally(function () {
      submitBtn.disabled = false;
    });
  });

  document.getElementById('send-another').addEventListener('click', function () {
    form.reset();
    fields.forEach(function (key) { setError(key, ''); });
    sent.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });
})();
