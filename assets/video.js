/* Video block: muted autoplay loops that respect prefers-reduced-motion.
   Load synchronously right after the <video> elements (not deferred), so a looping video
   is paused before it starts playing. With reduced motion the video stays on its poster
   and gets controls, so the visitor can still choose to play it. */
(function () {
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var videos = document.querySelectorAll('video.project-video');

  function apply() {
    var reduce = mq && mq.matches;
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      if (reduce) {
        v.removeAttribute('autoplay');
        v.autoplay = false;
        v.preload = 'metadata';
        v.controls = true;
        v.pause();
      } else {
        v.controls = false;
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      }
    }
  }

  if (mq && mq.matches) apply();
  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  }
})();
