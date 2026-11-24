// Fechas contrastadas con los carteles y publicaciones facilitados por Caribe.
// Se combinan con el catálogo del panel para que el archivo se pueda revisar
// antes de incorporar estas fichas al gestor de eventos.
const aerTour = "https://www.instagram.com/aeronaveadolescente/p/DdMCNAoiHlc/";
const santiago = "https://www.instagram.com/cariberecords/p/DIRJbiFq_TU/";
const oviedo = "https://www.instagram.com/cariberecords/p/DKKbawDKFMm/";
const sevilla = "https://www.instagram.com/frisbielgrupo/p/DOx43iqCPFt/";

function dateOnly(day) {
  // Mediodía en España evita desplazar la fecha al mostrarla en otra zona.
  return `${day}T12:00:00+01:00`;
}

function concert(day, artist, venue, city, title, sourceUrl) {
  return {
    id: `archivo-${day}-${city.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    artist, venue, city, title, sourceUrl,
    country: "ES",
    datetime: dateOnly(day),
  };
}

export const curatedEvents = [
  concert("2025-05-24", "Aeronave Adolescente", "Sala Moon", "Santiago de Compostela", "Con Los Reels y Monito Dinero", santiago),
  concert("2025-05-30", "Los Reels", "Hangar 48", "Madrid", "Con Wet Iguanas", "https://ticketandroll.com/evento/wet-iguanas-en-sala-hangar-48?lang=es"),
  concert("2025-06-14", "Los Reels", "Lata de Zinc", "Oviedo", "Con Ferrocentro Club y La Fuente de Duchamp", oviedo),
  concert("2025-10-11", "Los Reels", "Bar Mutante", "Sevilla", "Con Frisbi y Baloncesto", sevilla),

  concert("2026-01-23", "Aeronave Adolescente", "El Muelle", "Santiago de Compostela", "Salas Vacías", aerTour),
  concert("2026-01-24", "Aeronave Adolescente", "Acéfala", "A Coruña", "Salas Vacías", aerTour),
  concert("2026-02-12", "Aeronave Adolescente", "La Yesería", "Murcia", "Salas Vacías", aerTour),
  concert("2026-02-13", "Aeronave Adolescente", "FoodHall", "Elche", "Salas Vacías", aerTour),
  concert("2026-02-20", "Aeronave Adolescente", "Wurlitzer Ballroom", "Madrid", "Salas Vacías", aerTour),
  concert("2026-02-27", "Aeronave Adolescente", "Lala Karaoke", "Valencia", "Salas Vacías", aerTour),
  concert("2026-02-28", "Aeronave Adolescente", "Sala Vol", "Barcelona", "Salas Vacías", aerTour),
  concert("2026-03-13", "Aeronave Adolescente", "Sala Supersonic", "Vigo", "Salas Vacías", aerTour),
  concert("2026-03-14", "Aeronave Adolescente", "La Disfrutona del Orzán", "A Coruña", "Salas Vacías", aerTour),
  concert("2026-03-21", "Aeronave Adolescente", "Lata de Zinc", "Oviedo", "Salas Vacías", aerTour),
  concert("2026-04-24", "A usted le gustará", "Lata de Zinc", "Oviedo", "Aeronave Adolescente · Cabiria · Ferrocentro Club"),
  concert("2026-04-25", "A usted le gustará", "Lata de Zinc", "Oviedo", "Baloncesto · Padre y Esposo · Gúdar · DeDeDeDe · Elena del Frade"),
  concert("2026-11-20", "Aeronave Adolescente", "Café Pop Torgal", "Ourense", "Con Marcelo Criminal"),
  concert("2026-11-21", "Aeronave Adolescente", "Acéfala", "A Coruña", "Con Marcelo Criminal"),

  {
    id: "agenda-junio-aeronave-2027-02-07",
    artist: "JUNIO · Aeronave Adolescente",
    venue: "Sala El Sol",
    city: "Madrid",
    country: "ES",
    title: "Inverfest 2027",
    datetime: "2027-02-07T20:00:00+01:00",
    ticketUrl: "https://tickets.oneboxtds.com/latrastiendasonora/select/3075693",
  },
];
