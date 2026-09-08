// Preview: node scripts/import-catalogue.js
// Apply: node scripts/import-catalogue.js --apply
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const Artist = require('../src/models/artist.model');
const Release = require('../src/models/release.model');
const source = require('../data/catalogue-import.json');
const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const artists = await Artist.find();
  const existing = await Release.find();
  const newArtists = [];
  const plan = [];
  const seen = new Set();
  for (const row of source.releases) {
    if (seen.has(row.catalog)) throw new Error(`Duplicate reference: ${row.catalog}`);
    seen.add(row.catalog);
    let artist = artists.find(a => a.slug === row.artistSlug);
    if (!artist) {
      artist = new Artist({ name: row.artistName.split(',')[0], slug: row.artistSlug });
      if (row.artistSpotifyUrl) artist.set('streaming.spotify', row.artistSpotifyUrl);
      if (row.artistBandcampUrl) artist.set('streaming.bandcamp', row.artistBandcampUrl);
      if (row.artistPortraitUrl) artist.set('photos.portraitUrl', row.artistPortraitUrl);
      await artist.validate();
      artists.push(artist);
      newArtists.push(artist);
    }
    const matches = existing.filter(r => String(r.artist) === String(artist._id) &&
      (normalize(r.title) === normalize(row.title) || (row.spotifyUrl && r.spotifyUrl === row.spotifyUrl)));
    if (matches.length > 1) throw new Error(`Ambiguous release: ${row.title}`);
    const release = matches[0] || new Release({ artist: artist._id });
    const collision = existing.find(r => r.catalog === row.catalog && String(r._id) !== String(release._id));
    if (collision) throw new Error(`Reference already assigned to another release: ${row.catalog}`);
    const { artistSlug, artistSpotifyUrl, artistBandcampUrl, artistPortraitUrl, ...fields } = row;
    const coverUrl = release.cover?.url || release.cover_image || fields.cover_image;
    Object.assign(release, fields);
    if (coverUrl) {
      release.cover_image = coverUrl;
      release.cover = { url: coverUrl, alt: release.cover?.alt || row.title };
    }
    await release.validate();
    plan.push({ release, isNew: release.isNew });
  }
  const excluded = existing.filter(r => r.spotifyUrl === 'https://open.spotify.com/album/4TWrkJVsPfBfRxZeZo6FPf');
  if (excluded.length !== 1) throw new Error('Expected one existing L.V.H.D.F.C. / Un olivo record');
  console.log(JSON.stringify({ createArtists: newArtists.map(a => a.name), createReleases: plan.filter(p => p.isNew).length,
    updateReleases: plan.filter(p => !p.isNew).length, distribution: plan.filter(p => p.release.catalogType === 'distribution').length,
    hide: excluded.map(r => r.title), notes: source.notes }, null, 2));
  if (!process.argv.includes('--apply')) return;
  const backupDir = path.join(__dirname, '../backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, `before-catalogue-${Date.now()}.json`);
  fs.writeFileSync(backup, JSON.stringify({ artists: await Artist.collection.find({}).toArray(), releases: await Release.collection.find({}).toArray() }, null, 2) + '\n', { flag: 'wx' });
  for (const artist of newArtists) await artist.save();
  for (const { release } of plan) await release.save();
  for (const release of excluded) {
    await Release.updateOne({ _id: release._id }, { $set: { catalogVisible: false } });
    await Artist.updateOne({ _id: release.artist }, { $pull: { albums: release._id } });
  }
  for (const { release } of plan) await Artist.updateOne({ _id: release.artist }, { $addToSet: { albums: release._id } });
  for (const { release } of plan) {
    const stored = await Release.findById(release._id);
    if (stored.catalog !== release.catalog || stored.labelName !== release.labelName || stored.catalogVisible !== true ||
      stored.release_date.toISOString() !== release.release_date.toISOString() ||
      !await Artist.exists({ _id: release.artist, albums: release._id })) throw new Error(`Verification failed: ${release.title}`);
  }
  if (await Release.countDocuments({ catalogType: 'distribution', catalogVisible: { $ne: false } }) !== 8) throw new Error('Unexpected distribution count');
  console.log(`Saved and verified ${plan.length} references. Backup: ${backup}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
