import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  CircularProgress,
  Grid,
  List,
  Typography,
} from '@mui/material';

import request from '../../../../../utils/request';

import SongListHeader from './song-list-header';
import SongListHeadline from './song-list-headline';
import SongListControls from './song-list-controls';
import SongListItem from './song-list-item';

const SongList = ({
  isSelecting,
  registerMusicToCard,
}) => {
  const { t } = useTranslation();
  const { artist, album } = useParams();
  const [searchParams] = useSearchParams();
  const artistLabel = decodeURIComponent(artist);
  const albumLabel = decodeURIComponent(album);
  const albumArtistTag = searchParams.get('missingAlbumArtist') === '1' ? '' : artistLabel;
  const albumTag = searchParams.get('missingAlbum') === '1' ? '' : albumLabel;
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSongList = async () => {
      setIsLoading(true);
      const { result, error } = await request(
        'songList',
        {
          album: albumTag,
          albumartist: albumArtistTag,
        }
      );
      setIsLoading(false);

      if(result) {
        setSongs(result);
      }
      if(error) setError(error);
    }

    getSongList();
  }, [albumTag, albumArtistTag]);

  return (
    <Grid container id="song-list">
      <SongListHeader />
      <SongListHeadline
        album={albumLabel}
        artist={artistLabel}
      />
      <SongListControls
        album={albumTag}
        albumartist={albumArtistTag}
        disabled={songs.length === 0}
        isSelecting={isSelecting}
        registerMusicToCard={registerMusicToCard}
      />
      <Grid
        container
        spacing={1}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '0'
        }}
      >
        {isLoading
          ? <CircularProgress />
          : <List sx={{ width: '100%' }}>
              {songs.map(song =>
                <SongListItem
                  key={song.file}
                  song={song}
                  isSelecting={isSelecting}
                  registerMusicToCard={registerMusicToCard}
                />
              )}
            </List>
        }
        {error &&
          <Typography>{`${t('library.albums.no-songs-in-album')} 🤔`}</Typography>
        }
      </Grid>
    </Grid>
  );
}

export default React.memo(SongList);
