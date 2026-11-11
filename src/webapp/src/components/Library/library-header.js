import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SearchIcon from '@mui/icons-material/Search';

const LibraryHeader = ({ handleMusicFilter, musicFilter }) => {
  const { search: urlSearch } = useLocation();
  const navigate = useNavigate();
  const { '*': view } = useParams();
  const { t } = useTranslation();
  const currentView = view?.startsWith('folders') ? 'folders' : 'albums';

  const changeView = (_, path) => {
    if (!path) return;
    localStorage.setItem('libraryLastListView', path);
    navigate(path + urlSearch);
  };

  return (
    <Paper variant="outlined" sx={{ width: '100%', p: 1.5, mb: 1.5, borderRadius: 3 }}>
      <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }}>
        <TextField
          fullWidth
          id="library-search"
          type="search"
          label={t('library.header.search-label')}
          value={musicFilter}
          onChange={handleMusicFilter}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          }}
        />
        <ToggleButtonGroup
          aria-label={t('library.header.toggle-label')}
          color="primary"
          exclusive
          value={currentView}
          onChange={changeView}
          sx={{ flexShrink: 0, '& .MuiToggleButton-root': { flex: 1, minHeight: 44, px: 2 } }}
        >
          <ToggleButton value="albums">{t('library.header.albums')}</ToggleButton>
          <ToggleButton value="folders">{t('library.header.folders')}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Paper>
  );
};

export default LibraryHeader;
