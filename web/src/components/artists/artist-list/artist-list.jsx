import React from "react";
import ArtistItem from "../artist-item/artist-item";

export default function ArtistList({ title = "Current Artists", artists = [] }) {
  if (!artists.length) {
    return (
      <div className="p-3">
        <p className="text-muted m-0">No hay artistas.</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <h2 className="text-uppercase text-secondary small mb-3">
        {title} ({artists.length})
      </h2>

      <ul className="list-unstyled m-0">
        {artists.map((artist) => (
          <li key={artist.id || artist._id} className="mb-1">
            <ArtistItem
              artist={artist}
              isActive={false}
              onHover={() => {}}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}