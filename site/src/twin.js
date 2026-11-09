// A live call with Shehroz's AI twin: a Beyond Presence managed agent in a LiveKit room (/api/twin in worker.js
// creates the room). Text first: questions go to the twin as chat, it answers on video, and its words stream back as
// captions. The microphone stays off unless the visitor turns it on.
import {Room, RoomEvent, Track} from 'livekit-client';

export const MAX_SECONDS = 180;   // a call ends on its own after three minutes
const READY_FALLBACK = 30;
const PICKUP = 15;   // seconds to get a room and connect to it before giving up

/**
 * Starts a call. Call it straight from a click: audio playback may only be unlocked inside a user gesture.
 * video:        the <video> the twin appears in (it plays once the twin's video arrives, and is cleared at the end)
 * onCaption:    ({id, text, mine, final}) for each line spoken or typed, called again as the line grows
 * onSoundBlocked: (blocked) when the browser refuses to play the twin's voice until the visitor taps, and when it allows it
 * onEnd:        () once the call is over, whoever ended it
 * Resolves to {ready, send(text), mic(on), unmute(), end()} once connected; `ready` settles when the twin is listening.
 * signal:       aborts the call while it's being set up (the drawer was closed)
 * Rejects with an Error whose .code is 'busy' | 'wait' | 'unavailable' | 'timeout' | 'cancelled' | 'error'
 * (and .retry, in seconds, for 'wait').
 */
export async function startCall({video, onCaption, onSoundBlocked, onEnd, signal}) {
  const room = new Room({adaptiveStream: true, dynacast: true});
  room.startAudio().catch(() => {});   // inside the click, before any await
  const sounds = new Set();
  // the twin takes ~15s after connecting to join and start listening; anything typed earlier would be lost,
  // so it counts as ready once it first speaks (its greeting), or after READY_FALLBACK seconds regardless
  let markReady;
  const ready = new Promise(r => { markReady = r; });

  room.on(RoomEvent.TrackSubscribed, track => {
    if (track.kind === Track.Kind.Video) track.attach(video);
    if (track.kind === Track.Kind.Audio) sounds.add(document.body.appendChild(track.attach()));
  });
  room.on(RoomEvent.TrackUnsubscribed, track => track.detach().forEach(el => { if (el !== video) { el.remove(); sounds.delete(el); } }));
  room.on(RoomEvent.AudioPlaybackStatusChanged, () => onSoundBlocked(!room.canPlaybackAudio));
  room.on(RoomEvent.Disconnected, () => {
    sounds.forEach(el => el.remove());
    video.srcObject = null;
    onEnd();
  });

  // the twin's words (and the visitor's, when they speak) arrive as text streams that grow while the line is spoken
  room.registerTextStreamHandler('lk.transcription', async (reader, from) => {
    const line = {id: reader.info.attributes?.['lk.segment_id'] || reader.info.id, text: '', mine: from.identity === room.localParticipant.identity};
    if (!line.mine) markReady();
    try {
      for await (const delta of reader) { line.text += delta; onCaption({...line, final: false}); }
    } catch (_) { /* a cut-off line keeps what arrived */ }
    onCaption({...line, final: true});
  });

  // getting a room and joining it may take PICKUP seconds at most, and stops at once if the drawer is closed
  const stop = new AbortController();
  let why = 'timeout';
  const timer = setTimeout(() => stop.abort(), PICKUP * 1000);
  const cancel = () => { why = 'cancelled'; stop.abort(); };
  signal?.addEventListener('abort', cancel, {once: true});
  const fail = code => Object.assign(new Error(`twin: ${code}`), {code});
  const stopped = new Promise((_, no) => stop.signal.addEventListener('abort', () => no(fail(why)), {once: true}));
  try {
    const res = await Promise.race([fetch('/api/twin', {method: 'POST', signal: stop.signal}), stopped]);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(fail(body.error || 'error'), {retry: body.retry});
    await Promise.race([room.connect(body.url, body.token), stopped]);
  } catch (e) {
    room.disconnect();
    throw e.code ? e : fail(stop.signal.aborted ? why : 'error');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
  setTimeout(markReady, READY_FALLBACK * 1000);
  if (!room.canPlaybackAudio) onSoundBlocked(true);

  return {
    ready,
    send: text => room.localParticipant.sendText(text, {topic: 'lk.chat'}),
    mic: on => room.localParticipant.setMicrophoneEnabled(on),
    unmute: () => room.startAudio(),   // from a tap, when the browser blocked the twin's voice
    end: () => room.disconnect(),
  };
}
