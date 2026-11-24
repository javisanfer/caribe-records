const biographies = {
  "aeronave-adolescente": `Aeronave Adolescente nació en 2020 como el proyecto personal de Daniel Valcárcel en Culleredo (Galicia). Hoy toma forma de banda junto a Inés Jaso (Jøl) al bajo, Álvaro Rodríguez (Baloncesto) a la batería y Pablo Villalba a la guitarra. Con formación clásica en piano y una identidad forjada en la grabación doméstica, Daniel cruza slacker rock, noise pop y electrónica: guitarras abiertas, sintetizadores y melodías luminosas con espíritu DIY noventero.

Tras los EP Cartas de Ida y Vuelta y El Mirador de la Ría del Burgo y Otros Puntos de Inspiración, publicados en 2020, llegó su primer álbum en 2023: Sempre está chovendo na beira do mar. Grabado principalmente en una habitación, amplió el sonido lo-fi del proyecto con cajas de ritmos, sintetizadores y paisajes sonoros.

En enero de 2026, ya junto a Caribe Records, publicó su segundo LP, Sueño con salones llenos. Producido con Pablo Villalba y mezclado y masterizado por Otro, el disco lleva esa intimidad hacia una producción más nítida y expansiva. Sus canciones hablan de precariedad, alquileres imposibles y futuros inciertos, pero encuentran en el ruido, el pop y la vulnerabilidad una forma de permanecer. Los singles “V.M.D.” y “El día de la marmota II” anticiparon ese equilibrio entre cansancio y esperanza. Sobre el escenario, la formación actual convierte el universo doméstico de Aeronave Adolescente en un directo más físico sin perder la honestidad de las canciones.`,

  "ferrocentro-club": `Ferrocentro Club es un cuarteto de Mieres (Asturias) formado por cuatro amigos de la Facultad de Ciencias de la Universidad de Oviedo. Se llaman a sí mismos «mercenarios del pop» y hacen canciones en las que el indie rock noventero, el noise pop y el slacker conviven con melodías que sobreviven a las guitarras saturadas.

En Voy a tener suerte, su EP de cinco canciones editado junto a Caribe Records, los problemas cotidianos adquieren dimensiones inesperadas: un saludo que no llega puede desatar una crisis existencial, la escena musical se parece al modo competitivo de un videojuego y un mal día termina en fantasías de destrucción planetaria. Hay humor absurdo, sátira y un punto de surrealismo, pero también una sensibilidad pop muy clara detrás del ruido.

Grabado en el Búnker de San Crispín con Jorge Antequera a cargo de la producción, mezcla y máster, el EP cambia de dirección cuando menos se espera. La banda dice que «Voy a tener suerte es una pregunta sin signos de interrogación»: una manera de avanzar entre dudas, guitarras fuzz y canciones que prefieren confiar un poco en el azar.`,
};

const aeronavePressKit = "https://drive.google.com/drive/folders/1pTmcWp1ZQzoNRI3C3FBWTKpEwTsdvD3R?usp=share_link";

const artistLinks = {
  "aeronave-adolescente": {
    social: {
      x: "https://x.com/aeronaveadolesc",
      instagram: "https://www.instagram.com/aeronaveadolescente/",
    },
    web: { pressKit: aeronavePressKit },
    streaming: {
      bandcamp: "https://aeronaveadolescente1.bandcamp.com/",
      spotify: "https://open.spotify.com/artist/249m4fvXm7lbc0lP6rgfDi",
      appleMusic: "https://music.apple.com/us/artist/aeronave-adolescente/1534112934",
    },
  },
  "ferrocentro-club": {
    social: { instagram: "https://www.instagram.com/ferrocentroclub/" },
    web: {},
    streaming: {
      bandcamp: "https://ferrocentroclub.bandcamp.com/",
      spotify: "https://open.spotify.com/artist/0J3vdISJ1KpsS4rydRges3",
      appleMusic: "https://music.apple.com/us/artist/ferrocentro-club/1816706308",
    },
  },
};

export function withCurrentArtistProfile(artist) {
  if (!artist) return artist;
  if (import.meta.env?.PROD) return artist;

  return {
    ...artist,
    bio: biographies[artist.slug] || "???",
    ...artistLinks[artist.slug],
  };
}
