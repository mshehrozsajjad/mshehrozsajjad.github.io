// The "Talk to my AI twin" drawer: a live call with the twin (twin.js), text first.
// Opening the drawer calls the twin; until its video arrives the screen shows a loader, never a recording. Questions
// (the buttons or the input) go to the twin as text; it answers on video and its words appear in the log as it speaks.
// The mic is an extra, off until the visitor turns it on. Closing the drawer, leaving the page or three minutes end it.
const EMAIL = 'mshehrozsajjad@gmail.com';
const WHY = {   // what to say when a call can't start, by the code /api/twin answered with
  busy: 'My twin is in another call right now.',
  unavailable: 'My twin is offline at the moment.',
  error: 'I couldn’t reach my twin just now.',
};

export function mountTwin(drawer) {
  const $ = s => drawer.querySelector(s);
  const log = $('#log'), video = $('#twinVideo'), live = $('#twinLive'), micBtn = $('#twinMic'), input = $('#askInput');
  const screen = $('#twinScreen'), screenText = $('#twinScreenText'), again = $('#twinAgain'), soundBtn = $('#twinSound');
  let twin = null;       // the twin.js module (fetched ahead, on the first hover or focus of a "talk to my twin" button)
  let isOpen = false;
  let call = null;       // the call in progress
  let starting = null;   // the call being set up
  let listening = false; // the twin has joined and hears what is sent
  let queue = [];        // questions asked before the twin was listening
  let left = 0, clock = 0, retry = 0;
  const lines = new Map();   // caption id -> its bubble, so a line grows in place while it's spoken

  /* ---------- what the video area shows: a loader, the twin, or why there is no twin ---------- */
  function show(state, text = '') {
    drawer.dataset.call = state;   // calling | live | ended | error
    screen.hidden = state === 'live';
    screenText.textContent = text;
    again.hidden = !['ended', 'error'].includes(state);
    again.textContent = state === 'error' ? 'Try again' : 'Call again';
    micBtn.hidden = state !== 'live';
    if (state !== 'live') { live.hidden = true; soundBtn.hidden = true; }
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
    log.scrollTop = 1e6;
    if (final) lines.delete(id);
  }

  /* ---------- the call ---------- */
  function ended() {
    const timeUp = left <= 0;
    clearInterval(clock);
    call = null;
    listening = false;
    queue = [];
    micBtn.setAttribute('aria-pressed', 'false');
    micBtn.textContent = 'Use my mic';
    if (isOpen) show('ended', timeUp ? 'That’s the three minutes.' : 'The call ended.');
  }

  function tick() {
    left -= 1;
    if (listening) showClock();
    if (left === 30) note('Thirty seconds left on this call.');
    if (left <= 0) call?.end();
  }

  // Starts a call, or joins the one being set up. Best run inside a click: audio may only be unlocked there.
  function begin() {
    if (call || starting || !isOpen) return starting;
    clearTimeout(retry);
    show('calling', 'Calling my twin…');
    const dial = () => twin.startCall({video, onCaption: caption, onEnd: ended, onSoundBlocked: b => { soundBtn.hidden = !b; }});
    // with the code already here the call starts inside the click (Safari only unlocks sound there); otherwise
    // it starts once the code arrives, and if the browser then blocks the twin's voice, "Tap for sound" appears
    starting = (twin ? dial() : import('./twin.js').then(m => { twin = m; return dial(); }))
      .then(c => {
        starting = null;   // connected: from here on it's `call`, so a reopen during the twin's ~15s join isn't stuck
        if (!isOpen) return c.end();   // closed while it was connecting
        call = c;
        left = twin.MAX_SECONDS;
        clearInterval(clock);
        clock = setInterval(tick, 1000);
        screenText.textContent = 'My twin is joining…';
        c.ready.then(() => {
          if (call !== c) return;   // this call already ended
          listening = true;
          showClock();
          queue.forEach(q => call.send(q));
          queue = [];
        });
      })
      .catch(e => {
        starting = null;
        if (!isOpen) return;
        if (e.code === 'wait') {   // the last call was only seconds ago: wait it out instead of failing
          show('calling', 'Calling my twin…');
          retry = setTimeout(begin, (e.retry || 10) * 1000);
          return;
        }
        queue = [];
        show('error', WHY[e.code] || WHY.error);
        note(WHY[e.code] || WHY.error, true);
      });
    return starting;
  }

  function ask(text) {
    text = text.trim();
    if (!text) return;
    drawer.classList.add('talking');   // the conversation takes the room the intro and the question list had
    bubble(text, 'me');
    if (listening) call.send(text);
    else { queue.push(text); begin(); }
  }

  async function toggleMic() {
    if (!call) return;
    const on = micBtn.getAttribute('aria-pressed') !== 'true';
    try {
      await call.mic(on);
      micBtn.setAttribute('aria-pressed', String(on));
      micBtn.textContent = on ? 'Mic on' : 'Use my mic';
    } catch (_) {
      note('I couldn’t use your mic. You can still type your questions.');
    }
  }

  drawer.querySelectorAll('.q').forEach(b => b.addEventListener('click', () => ask(b.textContent)));
  $('#askForm').addEventListener('submit', e => { e.preventDefault(); ask(input.value); input.value = ''; });
  micBtn.addEventListener('click', toggleMic);
  again.addEventListener('click', begin);
  soundBtn.addEventListener('click', () => call?.unmute().then(() => { soundBtn.hidden = true; }).catch(() => {}));
  addEventListener('pagehide', () => call?.end());

  return {
    warm() { if (!twin) import('./twin.js').then(m => { twin = m; }); },   // fetch the call code before the click
    open() { isOpen = true; begin(); },   // from the click that opened the drawer
    close() { isOpen = false; clearTimeout(retry); call?.end(); },
  };
}
