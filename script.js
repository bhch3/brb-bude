const audioElements = {
  "1": document.getElementById("audio1"),
  "2": document.getElementById("audio2"),
  "3": document.getElementById("audio3")
};

const playButtons   = document.querySelectorAll(".play-btn");
const stopButton    = document.getElementById("stop-btn");
const statusText    = document.getElementById("status");

let audioCtx       = null;   // Web Audio context
let wakeLock       = null;   // Screen Wake Lock handle
let currentlyPlaying = null; // data-sound key of whichever is playing

// ── 1. Web Audio API: set up 300% gain ───────────────────────────────────────
// createMediaElementSource must be called exactly once per element,
// so we run this once on the very first user tap (AudioContext needs a gesture).
function setupAudioContext() {
  if (audioCtx) return; // already done

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  Object.keys(audioElements).forEach((key) => {
    const audio    = audioElements[key];
    const source   = audioCtx.createMediaElementSource(audio);
    const gainNode = audioCtx.createGain();

    gainNode.gain.value = 3; // 300% — 3× the original amplitude
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    audio.volume = 1; // native element also at max
  });
}

// ── 2. Screen Wake Lock: keeps screen on while a sound plays ─────────────────
async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (err) {
    // Wake Lock denied or not supported — audio still plays, just no lock
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

// Re-request Wake Lock and resume audio when user returns to the tab/app
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible" && currentlyPlaying) {
    if (audioCtx && audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
    try { await audioElements[currentlyPlaying].play(); } catch (e) {}
    await requestWakeLock();
  }
});

// ── 3. Back-button trap ───────────────────────────────────────────────────────
// Pushes a dummy history entry so the back button / back-swipe
// cannot navigate away from the page.
window.history.pushState(null, "", window.location.href);
window.addEventListener("popstate", () => {
  window.history.pushState(null, "", window.location.href);
});

// ── 4. Stop all sounds (only via the hidden corner button) ───────────────────
function stopAllSounds() {
  Object.values(audioElements).forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  playButtons.forEach((btn) => btn.classList.remove("playing"));
  statusText.textContent = "Nothing playing";
  currentlyPlaying = null;
  releaseWakeLock();
}

// ── 5. Play button clicks ─────────────────────────────────────────────────────
playButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    // Set up AudioContext (and GainNode) on first interaction
    setupAudioContext();

    // iOS suspends AudioContext until a user gesture — resume it
    if (audioCtx && audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const soundKey  = button.getAttribute("data-sound");
    const soundName = button.getAttribute("data-name");
    const audio     = audioElements[soundKey];

    // Stop whatever is already playing, then play the new one
    stopAllSounds();

    try {
      await audio.play();
    } catch (err) {
      // play() can fail if the file is missing — safe to ignore during dev
    }

    currentlyPlaying = soundKey;
    button.classList.add("playing");
    statusText.textContent = "🔊 Playing: " + soundName;

    // Keep screen awake
    await requestWakeLock();
  });
});

// ── 6. Hidden stop button ─────────────────────────────────────────────────────
stopButton.addEventListener("click", () => {
  stopAllSounds();
});
