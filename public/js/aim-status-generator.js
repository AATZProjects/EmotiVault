const songTitleInput = document.getElementById('songTitle');
const artistNameInput = document.getElementById('artistName');
const getLyricsButton = document.getElementById('getLyricsButton');
const generatedLyrics = document.getElementById('generatedLyrics');

const songTitleError = document.getElementById('songTitleError');
const artistNameError = document.getElementById('artistNameError');

const previewLyric = document.getElementById('previewLyric');
const previewArtist = document.getElementById('previewArtist');
const previewEmoticon = document.getElementById('previewEmoticon');

const moodInputs = document.querySelectorAll('input[name="mood"]');

const previewUsername = document.getElementById('previewUsername');
const previewDecorations = document.querySelectorAll('.aim-preview-sparkle');

const moodThemes = {
  Happy: {
    usernameColor: '#d49d00',
    artistColor: '#1f9d3a',
    decorations: ['✨', '✨'],
  },

  Sad: {
    usernameColor: '#557dda',
    artistColor: '#4f6fae',
    decorations: ['💧', '💧'],
  },

  Angry: {
    usernameColor: '#d9463e',
    artistColor: '#b32822',
    decorations: ['💥', '💥'],
  },

  Love: {
    usernameColor: '#ec5b9c',
    artistColor: '#d63384',
    decorations: ['💕', '💕'],
  },

  Surprised: {
    usernameColor: '#ef9b0f',
    artistColor: '#d77f00',
    decorations: ['❗', '❗'],
  },

  Confused: {
    usernameColor: '#718394',
    artistColor: '#5f6d79',
    decorations: ['❓', '❓'],
  },

  Embarrassed: {
    usernameColor: '#a547d6',
    artistColor: '#8c3bb7',
    decorations: ['🌸', '🌸'],
  },

  Playful: {
    usernameColor: '#7fb800',
    artistColor: '#278bc7',
    decorations: ['★', '♪'],
  },

  Neutral: {
    usernameColor: '#444444',
    artistColor: '#666666',
    decorations: ['•', '•'],
  },

  Sleepy: {
    usernameColor: '#6269b8',
    artistColor: '#4f568f',
    decorations: ['🌙', '✧'],
  },

  Cool: {
    usernameColor: '#278bc7',
    artistColor: '#1683a8',
    decorations: ['😎', '★'],
  },

  Respect: {
    usernameColor: '#8a674e',
    artistColor: '#9a6d14',
    decorations: ['✦', '✦'],
  },
};

getLyricsButton.addEventListener('click', fetchLyrics);

songTitleInput.addEventListener('input', () => {
  clearFieldError(songTitleInput, songTitleError);
});

artistNameInput.addEventListener('input', () => {
  clearFieldError(artistNameInput, artistNameError);
});

moodInputs.forEach((moodInput) => {
  moodInput.addEventListener('change', async () => {
    if (!moodInput.checked) {
      return;
    }

    await applyMood(moodInput.value);
  });
});

/*
=============================================
  Lyrics
=============================================
*/

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

/*
=============================================
  Mood
=============================================
*/

async function getRandomEmoticon(mood) {
  const response = await fetch(
    `/api/emoticons/random?mood=${encodeURIComponent(mood)}`,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Unable to retrieve an emoticon.');
  }

  return data.emoticonString;
}

async function updateMoodEmoticon(mood) {
  try {
    const emoticon = await getRandomEmoticon(mood);
    previewEmoticon.textContent = emoticon;
  } catch (error) {
    console.error('Emoticon request failed:', error);
    previewEmoticon.textContent = ':|';
  }
}

async function applyMood(mood) {
  applyMoodTheme(mood);
  await updateMoodEmoticon(mood);
}

function applyMoodTheme(mood) {
  const theme = moodThemes[mood];

  if (!theme) {
    return;
  }

  previewUsername.style.color = theme.usernameColor;
  previewArtist.style.color = theme.artistColor;

  previewDecorations.forEach((decoration, index) => {
    decoration.textContent = theme.decorations[index] || '✦';
    decoration.style.color = theme.usernameColor;
  });
}

async function initializeMood() {
  const selectedMood = document.querySelector('input[name="mood"]:checked');

  if (!selectedMood) {
    return;
  }

  await applyMood(selectedMood.value);
}

initializeMood();
