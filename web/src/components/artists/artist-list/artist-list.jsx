import React from "react";
import ArtistItem from "../artist-item/artist-item";
import AdminEditLink from "../../admin/admin-edit-link";

export default function ArtistList({ artists = [] }) {
  if (!artists.length) {
    return <p className="public-index__status">No hay artistas.</p>;
  }

  return (
    <ul className="artist-index">
        {artists.map((artist, index) => (
          <li className="admin-edit-context" key={artist.id || artist._id}>
            <ArtistItem
              artist={artist}
              index={index + 1}
            />
            <AdminEditLink
              to={`/admin/edit-artist/${artist.slug}`}
              label={`a ${artist.name}`}
            />
          </li>
        ))}
    </ul>
  );
}
