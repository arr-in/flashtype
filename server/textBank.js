const textBank = {
  Beginner: [
    "cat dog sun run map pen cup red blue tree jump fish frog book milk star moon hand foot rain wind cake game",
    "ball road lamp bird card ship rock leaf warm cold fast slow ring king farm town song play move time",
    "home work desk chair door wall food soup rice bean corn goat lion bear duck swan wave sand hill path",
    "code text word line page note list task plan goal step turn push pull lock key gate fire snow",
    "mint lime pear plum kiwi date fig jam dish bowl fork spoon plate glass water sugar salt bread toast"
  ],
  Easy: [
    "Typing every day can help you build speed and focus. Keep your hands steady and your eyes on the words. Practice often and track your progress.",
    "Small goals lead to big gains over time. Start with simple passages and stay calm. With repeat effort your typing will become smooth and fast.",
    "A quiet desk and a clear mind make practice better. Sit straight breathe slowly and type each word with care. Good rhythm matters a lot.",
    "Speed is useful but accuracy comes first. Learn the pattern of each key and trust your fingers. Daily training will improve both pace and control.",
    "When you miss a key do not panic. Keep moving and finish the line. Every run teaches something and each session builds better habits."
  ],
  Medium: [
    "The best typing sessions are short, focused, and consistent. Start with accuracy, then raise your pace as your confidence grows.",
    "A good race is not only about speed; it is about control, timing, and attention to detail while pressure builds.",
    "If your hands tense up, pause for a breath, reset your posture, and continue with clean strokes across the keyboard.",
    "Strong typing habits come from repetition, reflection, and small adjustments, especially when mistakes appear in common words.",
    "In competitive rounds, players often begin quickly, but steady rhythm usually beats early bursts that lead to avoidable errors."
  ],
  Hard: [
    "\"Precision first, speed second,\" the coach said, tapping the desk as the room fell silent; everyone knew the final round would punish sloppy inputs.",
    "During intense matches, skilled typists balance risk and control: they accelerate on familiar words, then slow slightly near punctuation, quotes, and symbols.",
    "When pressure rises, hesitation can be costly; however, reckless pacing creates cascading mistakes that drain accuracy, confidence, and finishing momentum.",
    "A disciplined player monitors rhythm, notices micro-errors, and recovers instantly, because a one-second correction can decide first place in close races.",
    "The scoreboard looked simple, yet every result reflected hidden factors-focus, posture, endurance, and the ability to stay calm when rivals surged ahead."
  ],
  Expert: [
    "const score = (correct / totalTyped) * 100; if (score >= 98 && elapsedMs < 60000) { console.log('elite run'); } else { retry(); }",
    "function raceProgress(charsTyped, totalChars) { return Math.min(100, Math.floor((charsTyped / totalChars) * 100)); } // update every keypress",
    "for (let i = 0; i < input.length; i++) { if (input[i] !== target[i]) errors++; else correct++; } const wpm = (correct / 5) / (seconds / 60);",
    "socket.emit('typing_update', { roomCode, username, charsTyped, totalChars, wpm, accuracy }); // keep payload compact, deterministic, and frequent",
    "try { await startRace(); } catch (err) { setStatus(`race failed: ${err.message}`); } finally { setReady(true); } // recover gracefully"
  ]
};

const difficultyMap = {
  beginner: "Beginner",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert"
};

function getRandomTextByDifficulty(difficulty = "medium") {
  const key = difficultyMap[String(difficulty).toLowerCase()] || "Medium";
  const list = textBank[key];
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

function applyRaceFilters(text, options = {}) {
  const { includeNumbers = true, includeSymbols = true } = options;
  let output = String(text || "");

  if (!includeNumbers) {
    output = output.replace(/\d/g, "");
  }

  if (!includeSymbols) {
    output = output.replace(/[^A-Za-z0-9\s]/g, "");
  }

  return output.replace(/\s+/g, " ").trim();
}

function getRandomRaceText(options = {}) {
  const difficulty = options.difficulty || "hard";
  const baseText = getRandomTextByDifficulty(difficulty);
  const filtered = applyRaceFilters(baseText, options);
  return filtered.length > 20 ? filtered : baseText;
}

module.exports = {
  textBank,
  getRandomTextByDifficulty,
  getRandomRaceText
};
