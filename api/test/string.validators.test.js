const test = require("node:test");
const assert = require("node:assert/strict");

const { isSpotifyUrl } = require("../src/validators/string.validators");

test("acepta enlaces válidos de álbum y canción de Spotify", () => {
  assert.equal(isSpotifyUrl("https://open.spotify.com/album/75eicGeAG0v1GyR817tBzq"), true);
  assert.equal(isSpotifyUrl("https://open.spotify.com/intl-es/track/4cCTFbLW39AmrhtZnQ3Pe7?si=abc"), true);
});

test("rechaza dominios, tipos e identificadores de Spotify inválidos", () => {
  assert.equal(isSpotifyUrl("https://example.com/album/75eicGeAG0v1GyR817tBzq"), false);
  assert.equal(isSpotifyUrl("http://open.spotify.com/album/75eicGeAG0v1GyR817tBzq"), false);
  assert.equal(isSpotifyUrl("https://open.spotify.com/playlist/75eicGeAG0v1GyR817tBzq"), false);
  assert.equal(isSpotifyUrl("https://open.spotify.com/album/no-es-un-id-valido"), false);
});
