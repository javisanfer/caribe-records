const Event = require("../models/event.model");
const Artist = require("../models/artist.model");

// Events imported before slugs existed can be edited using their original ID.
function adminEventFilter(value) {
  return /^[a-f0-9]{24}$/i.test(value) ? { $or: [{ slug: value }, { _id: value }] } : { slug: value };
}

// -------- Utils --------
const { getPagination } = require("../utils/pagination");

function parseDate(value, endOfDay = false) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d;
}

/* ======================================================
   PÚBLICO
====================================================== */

// GET /api/events?from=&to=&city=&country=&q=&artist=&page=&limit=
exports.getEventsPublic = async (req, res) => {
  try {
    const { city, country, q, artist } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    // Sin filtro explícito, incluir también el histórico.
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to, true);

    const filter = {
      isActive: true,
      ...(from || to ? { date: {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      } } : {}),
    };

    if (city) filter.city = city;
    if (country) filter.country = country;
    if (q) filter.$text = { $search: q };
    if (artist) filter.lineup = artist; // ID de Artist

    const [total, items] = await Promise.all([
      Event.countDocuments(filter),
      Event.find(filter)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "lineup", select: "name slug photos.portraitUrl" })
        .lean(),
    ]);

    res.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    throw error;
  }
};

// GET /api/events/slug/:slug
exports.getEventBySlugPublic = async (req, res) => {
  try {
    const doc = await Event.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate({ path: "lineup", select: "name slug photos.portraitUrl" });

    if (!doc) return res.status(404).json({ message: "Event not found" });
    res.json(doc);
  } catch (error) {
    throw error;
  }
};

/* ======================================================
   ADMIN
====================================================== */

// GET /api/admin/events?from=&to=&city=&country=&active=&q=&artist=&page=&limit=
exports.getEventsAdmin = async (req, res) => {
  try {
    const { city, country, active, q, artist } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to, true);

    const filter = {};
    if (from || to) {
      filter.date = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }
    if (city) filter.city = city;
    if (country) filter.country = country;
    if (typeof active !== "undefined") filter.isActive = active === "true";
    if (q) filter.$text = { $search: q };
    if (artist) filter.lineup = artist;

    const [total, items] = await Promise.all([
      Event.countDocuments(filter),
      Event.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .select("title slug date venue city country isActive updatedAt lineup")
        .populate({ path: "lineup", select: "name slug" })
        .lean(),
    ]);

    res.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    throw error;
  }
};

// GET /api/admin/events/slug/:slug
exports.getEventByIdAdmin = async (req, res) => {
  try {
    const doc = await Event.findOne(adminEventFilter(req.params.slug)).populate({
      path: "lineup",
      select: "name slug",
    });

    if (!doc) return res.status(404).json({ message: "Event not found" });
    res.json(doc);
  } catch (error) {
    throw error;
  }
};

/* ======================================================
   CREATE
====================================================== */

// POST /api/admin/events
exports.createEvent = async (req, res) => {
  try {
    const payload = { ...req.body };

    // Aseguramos que lineup sea array de IDs en string
    if (payload.lineup && !Array.isArray(payload.lineup)) {
      payload.lineup = [payload.lineup];
    }

    // Validar lineup (si llega)
    if (Array.isArray(payload.lineup) && payload.lineup.length > 0) {
      const count = await Artist.countDocuments({ _id: { $in: payload.lineup } });
      if (count !== payload.lineup.length) {
        return res
          .status(400)
          .json({ message: "Some lineup artist IDs are invalid" });
      }
    }

    const event = new Event(payload);
    await event.save();

    // 👇 NUEVO: añadir este event a Artist.events
    if (Array.isArray(payload.lineup) && payload.lineup.length > 0) {
      await Artist.updateMany(
        { _id: { $in: payload.lineup } },
        { $addToSet: { events: event._id } }
      );
    }

    const populated = await Event.findById(event._id).populate({
      path: "lineup",
      select: "name slug",
    });

    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate key (slug must be unique)",
        fields: Object.keys(error.keyValue || {}),
      });
    }
    res
      .status(400)
      .json({ message: "Error creating event", fields: Object.keys(error.errors || {}) });
  }
};

/* ======================================================
   UPDATE
====================================================== */

// PATCH /api/admin/events/slug/:slug
exports.updateEvent = async (req, res) => {
  try {
    const doc = await Event.findOne(adminEventFilter(req.params.slug));
    if (!doc) return res.status(404).json({ message: "Event not found" });

    // Guardamos el lineup previo para sincronizar luego
    const prevLineup = (doc.lineup || []).map((id) => id.toString());

    let newLineup = prevLineup;

    // Si nos envían lineup nuevo, lo normalizamos
    if (req.body.lineup !== undefined) {
      let incoming = req.body.lineup;
      if (!Array.isArray(incoming)) {
        incoming = [incoming];
      }

      // Validar lineup
      if (incoming.length > 0) {
        const count = await Artist.countDocuments({ _id: { $in: incoming } });
        if (count !== incoming.length) {
          return res
            .status(400)
            .json({ message: "Some lineup artist IDs are invalid" });
        }
      }

      newLineup = incoming.map(String);
      req.body.lineup = newLineup; // aseguramos array
    }

    // Actualizamos campos del evento
    Object.assign(doc, req.body);
    await doc.save();

    // Vuelta a leer lineup real guardado
    newLineup = (doc.lineup || []).map((id) => id.toString());

    // Sincronizar Artist.events
    const prevSet = new Set(prevLineup);
    const newSet = new Set(newLineup);

    const toAdd = newLineup.filter((id) => !prevSet.has(id));
    const toRemove = prevLineup.filter((id) => !newSet.has(id));

    if (toAdd.length) {
      await Artist.updateMany(
        { _id: { $in: toAdd } },
        { $addToSet: { events: doc._id } }
      );
    }

    if (toRemove.length) {
      await Artist.updateMany(
        { _id: { $in: toRemove } },
        { $pull: { events: doc._id } }
      );
    }

    const populated = await Event.findById(doc._id).populate({
      path: "lineup",
      select: "name slug",
    });

    res.json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate key (slug must be unique)",
        fields: Object.keys(error.keyValue || {}),
      });
    }
    res
      .status(400)
      .json({ message: "Error updating event", fields: Object.keys(error.errors || {}) });
  }
};

/* ======================================================
   DELETE
====================================================== */

// DELETE /api/admin/events/slug/:slug
exports.deleteEvent = async (req, res) => {
  try {
    const deleted = await Event.findOneAndDelete(adminEventFilter(req.params.slug));
    if (!deleted) return res.status(404).json({ message: "Event not found" });

    // 👇 NUEVO: limpiar Artist.events
    await Artist.updateMany(
      { events: deleted._id },
      { $pull: { events: deleted._id } }
    );

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    throw error;
  }
};
