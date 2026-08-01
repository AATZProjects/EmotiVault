const songTitleInput = document.getElementById('songTitle');
const artistNameInput = document.getElementById('artistName');
const getLyricsButton = document.getElementById('getLyricsButton');
const generatedLyrics = document.getElementById('generatedLyrics');

const songTitleError = document.getElementById('songTitleError');
const artistNameError = document.getElementById('artistNameError');

const previewLyric = document.getElementById('previewLyric');
const previewArtist = document.getElementById('previewArtist');

getLyricsButton.addEventListener('click', fetchLyrics);

songTitleInput.addEventListener('input', () => {
  clearFieldError(songTitleInput, songTitleError);
});

artistNameInput.addEventListener('input', () => {
  clearFieldError(artistNameInput, artistNameError);
});

async function fetchLyrics() {
  const title = songTitleInput.value.trim();
  const artist = artistNameInput.value.trim();

  const formIsValid = validateLyricsForm(title, artist);

  if (!formIsValid) {
    return;
  }

  try {
    const response = await fetch('/api/lyrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        artist,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to retrieve lyrics.');
    }

    renderLyrics(data.lyrics);

    previewArtist.textContent = data.artist || artist;
  } catch (error) {
    console.error('Lyrics request failed:', error);

    showLyricsMessage(
      error.message || 'Unable to retrieve lyrics right now.',
      true,
    );
  }
}

function validateLyricsForm(title, artist) {
  let isValid = true;

  clearFieldError(songTitleInput, songTitleError);
  clearFieldError(artistNameInput, artistNameError);

  if (!title) {
    showFieldError(
      songTitleInput,
      songTitleError,
      'Please enter a song title.',
    );

    isValid = false;
  }

  if (!artist) {
    showFieldError(artistNameInput, artistNameError, 'Please enter an artist.');

    isValid = false;
  }

  if (!isValid) {
    const firstInvalidInput = document.querySelector('.ev-input.is-invalid');

    firstInvalidInput?.focus();
  }

  return isValid;
}

function showFieldError(input, errorElement, message) {
  input.classList.add('is-invalid');
  input.setAttribute('aria-invalid', 'true');

  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearFieldError(input, errorElement) {
  input.classList.remove('is-invalid');
  input.removeAttribute('aria-invalid');

  errorElement.textContent = '';
  errorElement.hidden = true;
}

function renderLyrics(lyrics) {
  generatedLyrics.innerHTML = '';

  const lyricLines = lyrics
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 20);

  if (lyricLines.length === 0) {
    showLyricsMessage(
      'The song was found, but no usable lyric lines were returned.',
      true,
    );

    return;
  }

  lyricLines.forEach((line, index) => {
    const label = document.createElement('label');
    label.className = 'aim-lyric-option';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'selectedLyric';
    radio.value = line;
    radio.checked = index === 0;

    const span = document.createElement('span');
    span.textContent = line;

    radio.addEventListener('change', () => {
      if (radio.checked) {
        previewLyric.textContent = line;
      }
    });

    label.append(radio, span);
    generatedLyrics.appendChild(label);
  });

  previewLyric.textContent = lyricLines[0];
}

function showLyricsMessage(message, isError = false) {
  generatedLyrics.innerHTML = '';

  const messageElement = document.createElement('p');

  messageElement.className = isError
    ? 'aim-lyrics-message aim-lyrics-message--error'
    : 'aim-lyrics-message';

  messageElement.textContent = message;

  generatedLyrics.appendChild(messageElement);
}
