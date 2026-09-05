import React from "react";
import ArtistItem from "../artist-item/artist-item";

export default function ArtistList({ artists = [] }) {
  if (!artists.length) {
    return <p className="public-index__status">No hay artistas.</p>;
  }

  return (
    <ul className="artist-index">
        {artists.map((artist, index) => (
          <li key={artist.id || artist._id}>
            <ArtistItem
              artist={artist}
              index={index + 1}
            />
          </li>
        ))}
    </ul>
  );
}
