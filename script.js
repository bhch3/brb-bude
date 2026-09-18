// Map each button's data-sound value to its <audio> element
const audioElements = {
  "1": document.getElementById("audio1"),
  "2": document.getElementById("audio2"),
  "3": document.getElementById("audio3")
};

const playButtons = document.querySelectorAll(".play-btn");
const stopButton = document.getElementById("stop-btn");
const statusText = document.getElementById("status");

// Stop every sound, reset it, and clear the "playing" highlight
function stopAllSounds() {
  Object.values(audioElements).forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  playButtons.forEach((btn) => btn.classList.remove("playing"));
  statusText.textContent = "Nothing playing";
}

// When a play button is clicked: stop any sound currently playing, then play the chosen one on loop
playButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const soundKey = button.getAttribute("data-sound");
    const soundName = button.getAttribute("data-name");
    const audio = audioElements[soundKey];

    stopAllSounds();
    audio.play();

    button.classList.add("playing");
    statusText.textContent = "🔊 Playing: " + soundName;
  });
});

// Stop button stops whichever sound is playing
stopButton.addEventListener("click", () => {
  stopAllSounds();
});
