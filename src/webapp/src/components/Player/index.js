import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import StyleIcon from '@mui/icons-material/Style';

import Cover from './cover';
import Controls from './controls';
import Display from './display';
import SeekBar from './seekbar';
import Volume from './volume';

import AppSettingsContext from '../../context/appsettings/context';
import PlayerContext from '../../context/player/context';
import request from '../../utils/request';

const Player = () => {
  const { t } = useTranslation();
  const { state: { playerstatus } } = useContext(PlayerContext);
  const { settings: { show_covers } } = useContext(AppSettingsContext);
  const file = playerstatus?.file;
  const [cover, setCover] = useState(null);

  useEffect(() => {
    setCover(null);
    if (!file || !show_covers) {
      return;
    }

    let active = true;
    async function loadCover() {
      try {
        const { result } = await request('getSingleCoverArt', { song_url: file });
        if (active && result) {
          setCover({ file, url: '/cover-cache/' + result });
        }
      } catch {
        // The player can continue to use its placeholder if artwork is unavailable.
      }
    }
    loadCover();

    return () => {
      active = false;
    };
  }, [file, show_covers]);

  const coverImage = show_covers && cover?.file === file ? cover?.url : undefined;

  return (
    <Box
      component="main"
      id="player"
      sx={{ width: '100%', maxWidth: 920, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}
    >
      <Stack spacing={2}>
        <Box
          component="header"
          sx={{
            px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 }, borderRadius: 4,
            color: '#f0fdf8',
            background: 'linear-gradient(120deg, #12362d, #215749)',
          }}
        >
          <Typography component="p" variant="subtitle2" sx={{ color: '#a8dfcd' }}>
            Phoniebox
          </Typography>
          <Typography component="h1" variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
            {t('player.dashboard.title', { defaultValue: 'Player' })}
          </Typography>
        </Box>

        <Paper
          component="section"
          aria-labelledby="now-playing-heading"
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 }, borderRadius: 4, display: 'grid', gap: { xs: 2, sm: 3 },
            gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 2fr) minmax(0, 3fr)' },
            alignItems: 'center',
            '& .MuiIconButton-root': { minWidth: 44, minHeight: 44 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: { xs: 190, sm: 320 }, justifySelf: 'center' }}>
            <Cover coverImage={coverImage} />
          </Box>
          <Stack spacing={1.5} sx={{ minWidth: 0 }}>
            <Typography component="h2" id="now-playing-heading" variant="subtitle2" color="text.secondary">
              {t('player.dashboard.now-playing', { defaultValue: 'Now playing' })}
            </Typography>
            <Display />
            <Box><SeekBar /></Box>
            <Box><Controls /></Box>
            <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}><Volume /></Box>
          </Stack>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
          <Button component={Link} to="/library" startIcon={<LibraryMusicIcon />} variant="outlined" sx={{ minHeight: 48 }}>
            {t('player.dashboard.library', { defaultValue: 'Music library' })}
          </Button>
          <Button component={Link} to="/cards" startIcon={<StyleIcon />} variant="outlined" sx={{ minHeight: 48 }}>
            {t('player.dashboard.cards', { defaultValue: 'Manage cards' })}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default Player;
