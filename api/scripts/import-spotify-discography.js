// Preview: node scripts/import-spotify-discography.js
// Import:  node scripts/import-spotify-discography.js --apply
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const Artist = require('../src/models/artist.model');
const Release = require('../src/models/release.model');
const snapshot = require('../data/spotify-discography-2026-09-07.json');
const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const slugs = [...new Set(snapshot.releases.map(row => row.artistSlug))];
  const artists = await Artist.find({ slug: { $in: slugs } });
  if (artists.length !== slugs.length) throw new Error('Missing catalog artists');
  const existing = await Release.find({ artist: { $in: artists.map(a => a._id) } });
  if (existing.some(r => r.labelName)) throw new Error('The catalog has been reconciled with the reference workbook. Use import-catalogue.js instead of this historical Spotify snapshot.');
  const plan = [];
  const seen = new Set();
  for (const row of snapshot.releases) {
    if (seen.has(row.spotifyUrl)) throw new Error(`Duplicate source: ${row.spotifyUrl}`);
    seen.add(row.spotifyUrl);
    const artist = artists.find(a => a.slug === row.artistSlug);
    const matches = existing.filter(r => String(r.artist) === String(artist._id) &&
      (r.spotifyUrl === row.spotifyUrl || normalize(r.title) === normalize(row.title)));
    if (matches.length > 1) throw new Error(`Ambiguous existing release: ${row.title}`);
    const { artistSlug, artistSpotifyUrl, ...fields } = row;
    const release = matches[0] || new Release({ artist: artist._id });
    // Preserve manually selected covers and catalog/label metadata.
    const coverUrl = release.cover?.url || release.cover_image || fields.cover_image;
    Object.assign(release, fields, {
      cover_image: coverUrl,
      cover: { url: coverUrl, alt: release.cover?.alt || row.title },
    });
    await release.validate();
    plan.push({ release, artist, artistSpotifyUrl, isNew: release.isNew });
  }
  console.log(JSON.stringify({ create: plan.filter(p => p.isNew).length, update: plan.filter(p => !p.isNew).length,
    artists: slugs.map(slug => ({ slug, releases: snapshot.releases.filter(r => r.artistSlug === slug).length })) }, null, 2));
  if (!process.argv.includes('--apply')) return;

  const backupDir = path.join(__dirname, '../backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `before-spotify-${Date.now()}.json`);
  // Read untouched records again: the plan above updates in-memory documents.
  const backup = {
    artists: await Artist.collection.find({ _id: { $in: artists.map(a => a._id) } }).toArray(),
    releases: await Release.collection.find({ artist: { $in: artists.map(a => a._id) } }).toArray(),
  };
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2) + '\n', { flag: 'wx' });
  for (const item of plan) await item.release.save();
  for (const artist of artists) {
    const item = plan.find(p => p.artist.slug === artist.slug);
    const releases = await Release.find({ artist: artist._id }).select('_id');
    await Artist.updateOne({ _id: artist._id }, { $set: {
      'streaming.spotify': item.artistSpotifyUrl,
      albums: releases.map(r => r._id),
    } });
  }
  for (const { release, artist } of plan) {
    const stored = await Release.findById(release._id);
    const linked = await Artist.findById(artist._id);
    if (stored.spotifyUrl !== release.spotifyUrl || JSON.stringify(stored.tracklist) !== JSON.stringify(release.tracklist) ||
      !linked.albums.some(id => String(id) === String(release._id))) throw new Error(`Verification failed: ${release.title}`);
  }
  console.log(`Imported and verified ${plan.length} releases. Backup: ${backupPath}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
