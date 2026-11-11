import React from 'react';
import { List } from '@mui/material';

import AlbumListItem from '../../../../Library/lists/albums/album-list/album-list-item'
import NoMusicSelected from './no-music-selected';

const SelectedAlbum = ({ values: [albumartist, album] }) => {
  if (typeof albumartist === 'string' && typeof album === 'string') {
    return (
      <List sx={{ width: '100%' }}>
        <AlbumListItem
          albumartist={albumartist}
          album={album}
          isButton={false}
        />
      </List>
    );
  }

  return <NoMusicSelected />
};

export default SelectedAlbum;
