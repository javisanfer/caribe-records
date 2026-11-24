const { ObjectId } = require("mongodb");
const slugify = require("slugify");
const content = require("../data/launch-content.json");

async function migrateLaunchContent(db) {
  const migrations = db.collection("app_migrations");
  const migrationId = "launch-content-2026-11";
  if (await migrations.findOne({ _id: migrationId })) return;

  const artists = db.collection("artists");
  const editorials = db.collection("editorials");
  const releases = db.collection("releases");
  const events = db.collection("events");
  const now = new Date();

  for (const profile of content.artists) {
    const artist = await artists.findOne({ slug: profile.slug });
    if (!artist) throw new Error(`Artist missing for launch: ${profile.slug}`);
    await artists.updateOne({ _id: artist._id }, {
      $set: {
        bio: profile.bio,
        photos: profile.photos,
        social: profile.social,
        streaming: profile.streaming,
        web: profile.web,
        updatedAt: now,
      },
    });
  }
  await artists.updateMany(
    { slug: { $nin: content.artists.map((artist) => artist.slug) } },
    { $set: { bio: "???" } },
  );

  const article = content.featuredEditorial;
  const artist = await artists.findOne({ slug: "aeronave-adolescente" });
  const existing = await editorials.findOne({ slug: article.slug });
  const articleId = existing?._id || new ObjectId();
  const wordCount = article.blocks.map((block) => block.text || "").join(" ")
    .replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  await editorials.updateOne({ _id: articleId }, {
    $set: {
      ...article,
      publishAt: new Date(article.publishAt),
      relatedArtists: [artist._id],
      featured: true,
      wordCount,
      readingTime: Math.max(1, Math.round(wordCount / 200)),
      updatedAt: now,
    },
    $setOnInsert: { createdAt: now },
  }, { upsert: true });

  const oldIds = await editorials.find({ _id: { $ne: articleId } }, { projection: { _id: 1 } }).map((item) => item._id).toArray();
  if (oldIds.length) {
    await artists.updateMany({}, { $pull: { editorials: { $in: oldIds } } });
    await editorials.deleteMany({ _id: { $in: oldIds } });
  }
  await artists.updateOne({ _id: artist._id }, { $addToSet: { editorials: articleId } });

  const ferro = await artists.findOne({ slug: "ferrocentro-club" });
  for (const release of content.releases) {
    const title = release.title;
    const existingRelease = await releases.findOne({ artist: ferro._id, title: { $regex: `^${title}$`, $options: "i" } });
    if (existingRelease) continue;
    const { _id, artist: ignoredArtist, ...fields } = release;
    void ignoredArtist;
    const result = await releases.insertOne({
      ...fields,
      artist: ferro._id,
      release_date: new Date(fields.release_date),
      catalogVisible: true,
      catalogType: "own",
      createdAt: now,
      updatedAt: now,
    });
    await artists.updateOne({ _id: ferro._id }, { $addToSet: { albums: result.insertedId } });
  }

  for (const entry of content.events) {
    const date = new Date(entry.datetime);
    const existingEvent = await events.findOne({ date, city: entry.city, venue: entry.venue });
    if (existingEvent) continue;
    const baseSlug = slugify(`${entry.title}-${date.toISOString().slice(0, 10)}-${entry.city}-${entry.venue}`, {
      lower: true, strict: true, trim: true,
    });
    let slug = baseSlug;
    let suffix = 2;
    while (await events.findOne({ slug }, { projection: { _id: 1 } })) {
      slug = `${baseSlug}-${suffix++}`;
    }
    const lineup = entry.artist?.includes("Aeronave")
      ? [artist._id]
      : entry.artist?.includes("Ferrocentro") ? [ferro._id] : [];
    const result = await events.insertOne({
      title: entry.title,
      slug,
      date,
      venue: entry.venue,
      city: entry.city,
      country: entry.country || "ES",
      artistName: entry.artist,
      lineup,
      ticketUrl: entry.ticketUrl || entry.sourceUrl || "https://www.instagram.com/cariberecords/",
      sourceUrl: entry.sourceUrl || "",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    for (const artistId of lineup) {
      await artists.updateOne({ _id: artistId }, { $addToSet: { events: result.insertedId } });
    }
  }

  await migrations.updateOne({ _id: migrationId }, { $set: { completedAt: now } }, { upsert: true });
}

module.exports = { migrateLaunchContent };
