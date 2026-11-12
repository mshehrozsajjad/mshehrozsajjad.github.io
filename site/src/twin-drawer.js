// The "Talk to my AI twin" drawer: a live call with the twin (twin.js), text first.
// Opening the drawer calls the twin; until its video arrives the screen shows a loader, never a recording. Questions
// (the buttons or the input) go to the twin as text; it answers on video and its words appear in the log as it speaks.
// The mic is an extra, off until the visitor turns it on. Closing the drawer, leaving the page or three minutes end it.
const EMAIL = 'hello@shehrozsajjad.com';
const WHY = {   // what to say when a call can't start, by the code /api/twin answered with
  busy: 'My twin is in another call right now.',
  unavailable: 'My twin is offline at the moment.',
  error: 'I couldn’t reach my twin just now.',
  timeout: 'My twin didn’t pick up.',
};
const stillMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SHOW_UP = 45;   // seconds after connecting for the twin's video to appear before the call counts as failed

export function mountTwin(drawer) {
  const $ = s => drawer.querySelector(s);
  const log = $('#log'), video = $('#twinVideo'), live = $('#twinLive'), micBtn = $('#twinMic'), input = $('#askInput');
  const screen = $('#twinScreen'), screenText = $('#twinScreenText'), again = $('#twinAgain'), soundBtn = $('#twinSound'), mail = $('#twinMail'), endBtn = $('#twinEnd'), waitFilm = $('#twinWait');
  let waitTick = 0;      // counts down a cooldown before calling again
  let twin = null;       // the twin.js module (fetched ahead, on the first hover or focus of a "talk to my twin" button)
  let isOpen = false;
  let call = null;       // the call in progress
  let starting = null;   // the call being set up
  let listening = false; // the twin has joined and hears what is sent
  let queue = [];        // questions asked before the twin was listening
  let left = 0, clock = 0, retry = 0;
  let attempt = 0;       // which call attempt is current, so a stale one that finishes late is ignored
  let hangUp = null;     // aborts the attempt being set up
  let failed = '';       // why the current call is being ended as a failure, if it is
  let showUp = 0;
  const lines = new Map();   // caption id -> its bubble, so a line grows in place while it's spoken

  /* ---------- what the video area shows: a loader, the twin, or why there is no twin ---------- */
  function show(state, text = '') {
    drawer.dataset.call = state;   // calling | live | ended | error
    screen.hidden = state === 'live';
    screenText.textContent = text;
    again.hidden = !['ended', 'error'].includes(state);
    again.textContent = state === 'error' ? 'Try again' : 'Call again';
    if (mail) mail.hidden = state !== 'error';
    if (endBtn) endBtn.hidden = !['calling', 'live'].includes(state);   // a call being made or under way can be hung up
    // behind the screen, his waving loop plays while there's no twin to show
    if (waitFilm) { if (state !== 'live' && isOpen && !stillMotion) waitFilm.play().catch(() => {}); else waitFilm.pause(); }   // the way to the real him, said once, on the screen
    micBtn.hidden = state !== 'live';
    if (state !== 'live') { live.hidden = true; soundBtn.hidden = true; }
    if (state === 'live') clearTimeout(showUp);
    // with no twin to answer, the questions rest until "Try again" (an ended call restarts on the next question)
    const off = state === 'error';
    drawer.querySelectorAll('.q, #askForm button').forEach(b => { b.disabled = off; });
    input.disabled = off;
    input.placeholder = off ? 'My twin is away. Try again above.' : 'Ask me anything…';
  }
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const showClock = () => { live.textContent = `● Live · ${mmss(Math.max(left, 0))}`; live.hidden = false; };
  video.addEventListener('playing', () => { if (call) show('live'); if (listening) showClock(); });

  /* ---------- the log ---------- */
  const bubble = (text, who) => {
    const p = document.createElement('p');
    p.className = who;
    p.textContent = text;
    log.append(p);
    log.scrollTop = 1e6;
    return p;
  };
  const note = (text, withEmail) => {
    const p = bubble(text, 'note');
    if (withEmail) { const a = document.createElement('a'); a.href = `mailto:${EMAIL}`; a.textContent = EMAIL; p.append(' You can also email me at ', a, '.'); }
  };
  function caption({id, text, mine, final}) {
    if (!text.trim()) return;
    let p = lines.get(id);
    if (!p) { p = bubble('', mine ? 'me' : 'ai'); lines.set(id, p); }
    p.textContent = text;
    p.classList.toggle('guess', !final);   // still being heard or spoken: shown faint until it settles
    log.scrollTop = 1e6;
    if (final) lines.delete(id);
  }

  /* ---------- the call ---------- */
  function ended() {
    const timeUp = left <= 0;
    clearInterval(clock);
    clearTimeout(showUp);
    call = null;
    listening = false;
    queue = [];
    setMic(false);
    const why = failed;
    failed = '';
    if (!isOpen) return;
    if (why) show('error', WHY[why]);
    else show('ended', timeUp ? 'That’s the three minutes.' : 'The call ended.');
  }

  function tick() {
    left -= 1;
    if (listening) showClock();
    if (left === 30) note('Thirty seconds left on this call.');
    if (left <= 0) call?.end();
  }

  // Starts a call, or joins the one being set up. Best run inside a click: audio may only be unlocked there.
  // Each call starts with no memory of the last, so a fresh call starts with a clean page too (a retry of the same
  // attempt keeps what was asked).
  function fresh() {
    log.replaceChildren();
    lines.clear();
    drawer.classList.remove('talking');
  }
  function begin(clean = true) {
    if (call || starting || !isOpen) return starting;
    clearTimeout(retry);
    clearInterval(waitTick);
    if (clean) fresh();
    show('calling', 'Calling my twin…');
    const mine = ++attempt, abort = hangUp = new AbortController();
    const dial = () => twin.startCall({video, onCaption: caption, onEnd: ended, onSoundBlocked: b => { soundBtn.hidden = !b; }, signal: abort.signal});
    // with the code already here the call starts inside the click (Safari only unlocks sound there); otherwise
    // it starts once the code arrives, and if the browser then blocks the twin's voice, "Tap for sound" appears
    starting = (twin ? dial() : import('./twin.js').then(m => { twin = m; return dial(); }))
      .then(c => {
        if (mine !== attempt) return c.end();   // a newer attempt took over
        starting = null;   // connected: from here on it's `call`, so a reopen during the twin's ~15s join isn't stuck
        if (!isOpen) return c.end();   // closed while it was connecting
        call = c;
        left = twin.MAX_SECONDS;   // the three minutes start once the twin has joined and is listening, not before
        clearInterval(clock);
        screenText.textContent = 'My twin is joining…';
        // connected, but the twin never showed: end it as a failure rather than wait on a black screen
        clearTimeout(showUp);
        showUp = setTimeout(() => { if (call === c && drawer.dataset.call !== 'live') { failed = 'timeout'; c.end(); } }, SHOW_UP * 1000);
        c.ready.then(() => {
          if (call !== c) return;   // this call already ended
          listening = true;
          clearInterval(clock);
          clock = setInterval(tick, 1000);
          showClock();
          queue.forEach(q => call.send(q));
          queue = [];
        });
      })
      .catch(e => {
        if (mine !== attempt) return;   // a newer attempt took over
        starting = null;
        if (!isOpen || e.code === 'cancelled') return;
        if (e.code === 'wait') {   // a call was started only seconds ago: say so, count down, then call by itself
          // a few calls in a row from here: say how long until the next, and let them call when it's time
          let secs = e.retry || 10;
          const mmss = s => s >= 60 ? `${Math.ceil(s / 60)} min` : `${s}s`;
          const say = () => { screenText.textContent = `That’s a few calls in a row. You can call again in ${mmss(secs)}.`; };
          show('waiting');
          say();
          clearInterval(waitTick);
          waitTick = setInterval(() => { secs -= 1; if (secs > 0) say(); else { clearInterval(waitTick); show('ended', 'You can call again now.'); } }, 1000);
          return;
        }
        queue = [];
        show('error', WHY[e.code] || WHY.error);
      });
    return starting;
  }

  function ask(text) {
    text = text.trim();
    if (!text) return;
    if (!call && !starting) begin();   // no call: this question starts a new one (and a clean page) first
    drawer.classList.add('talking');   // the conversation takes the room the intro and the question list had
    bubble(text, 'me');
    if (listening) call.send(text);
    else queue.push(text);
  }

  // hanging up: a call under way ends as usual; one still being made is dropped
  function hangup() {
    if (call) return call.end();
    clearTimeout(retry);
    clearInterval(waitTick);
    hangUp?.abort();
    hangUp = null;
    starting = null;
    attempt++;
    queue = [];
    show('ended', 'The call ended.');
  }

  function setMic(on) {
    micBtn.setAttribute('aria-pressed', String(on));
    micBtn.setAttribute('aria-label', on ? 'Turn my mic off' : 'Turn my mic on');
    micBtn.title = on ? 'Mic on' : 'Mic off';
  }

  async function toggleMic() {
    if (!call) return;
    const on = micBtn.getAttribute('aria-pressed') !== 'true';
    try {
      await call.mic(on);
      setMic(on);
    } catch (_) {
      note('I couldn’t use your mic. You can still type your questions.');
    }
  }

  drawer.querySelectorAll('.q').forEach(b => b.addEventListener('click', () => ask(b.textContent)));
  $('#askForm').addEventListener('submit', e => { e.preventDefault(); ask(input.value); input.value = ''; });
  micBtn.addEventListener('click', toggleMic);
  again.addEventListener('click', () => begin());
  endBtn?.addEventListener('click', hangup);
  soundBtn.addEventListener('click', () => call?.unmute().then(() => { soundBtn.hidden = true; }).catch(() => {}));
  addEventListener('pagehide', () => call?.end());

  return {
    warm() { if (!twin) import('./twin.js').then(m => { twin = m; }); },   // fetch the call code before the click
    open() { isOpen = true; begin(); },
    ask,   // a question put from the page (data-ask), after open()   // from the click that opened the drawer
    // closing hangs up: a call being set up is dropped, so the next open dials afresh
    close() { isOpen = false; clearTimeout(retry); clearInterval(waitTick); waitFilm?.pause(); hangUp?.abort(); hangUp = null; starting = null; attempt++; call?.end(); },
  };
}
