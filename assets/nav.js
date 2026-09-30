// Mobile menu: toggles the full-screen nav panel below the 720px breakpoint.
(function () {
  var header = document.querySelector('.site-header');
  var toggle = header && header.querySelector('.nav-toggle');
  if (!toggle) return;

  function setOpen(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  }

  toggle.addEventListener('click', function () {
    setOpen(!header.classList.contains('is-open'));
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && header.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Close if the window grows past the breakpoint while open
  window.matchMedia('(max-width: 720px)').addEventListener('change', function (mq) {
    if (!mq.matches) setOpen(false);
  });
})();
