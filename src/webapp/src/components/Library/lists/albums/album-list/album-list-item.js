import React, { forwardRef, useContext, useEffect, useState } from 'react';
import {
  Link,
  useLocation,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from '@mui/material';

import noCover from '../../../../../assets/noCover.jpg';

import AppSettingsContext from '../../../../../context/appsettings/context';
import request from '../../../../../utils/request';

const AlbumListItem = ({ albumartist, album, isButton = true }) => {
  const { t } = useTranslation();
  const { search: urlSearch } = useLocation();
  const [coverImage, setCoverImage] = useState(noCover);

  const {
    settings,
  } = useContext(AppSettingsContext);

  const {
    show_covers,
  } = settings;

  useEffect(() => {
    const getCoverArt = async () => {
      const { result } = await request('getAlbumCoverArt', {
        albumartist: albumartist,
        album: album
      });
      if (result) {
        if(result !== 'CACHE_PENDING') {
          setCoverImage(`/cover-cache/${result}`);
        }
      };
    }

    if (albumartist && album && show_covers) {
      getCoverArt();
    }
  }, [albumartist, album]);

  const AlbumLink = forwardRef((props, ref) => {
    const { data } = props;

    const artist = encodeURIComponent(data?.albumartist || t('library.albums.unknown-artist'));
    const album = encodeURIComponent(data?.album || t('library.albums.unknown-album'));

    const search = new URLSearchParams(urlSearch);
    search.delete('missingAlbumArtist');
    search.delete('missingAlbum');
    if (!data?.albumartist) search.set('missingAlbumArtist', '1');
    if (!data?.album) search.set('missingAlbum', '1');
    const query = search.toString();
    const location = `${artist}/${album}${query ? `?${query}` : ''}`;

    return <Link ref={ref} to={location} {...props} />
  });

  return (
    <ListItem
      button={isButton}
      component={isButton ? AlbumLink : null}
      data={{ albumartist, album }}
      disablePadding
      key={album}
    >
      <ListItemButton>
        {show_covers &&
          <ListItemAvatar>
            <Avatar variant="rounded" alt="Cover" src={coverImage} />
          </ListItemAvatar>
        }
        <ListItemText
          primary={album || t('library.albums.unknown-album')}
          secondary={albumartist || null}
        />
      </ListItemButton>
    </ListItem>
  );
}

export default AlbumListItem;
