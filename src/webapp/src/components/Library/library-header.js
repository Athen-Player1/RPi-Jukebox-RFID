import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SearchIcon from '@mui/icons-material/Search';

const MAX_UPLOAD_BYTES = 64 * 1024 * 1024;

const UploadMusic = () => {
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState('');
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState([]);

  const upload = async event => {
    event.preventDefault();
    const target = folder.trim();
    if (!target || !files.length || progress) return;
    const outcomes = [];
    const failed = [];
    setResults([]);
    for (const [index, file] of files.entries()) {
      setProgress('Uploading ' + (index + 1) + ' of ' + files.length + ': ' + file.name);
      try {
        if (!file.name.toLowerCase().endsWith('.mp3') || !file.size || file.size > MAX_UPLOAD_BYTES) {
          throw new Error('Choose an MP3 under 64 MiB.');
        }
        const query = new URLSearchParams({ folder: target, name: file.name });
        const response = await fetch('/api/music-upload?' + query, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: file,
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || typeof data?.indexed !== 'boolean') {
          throw new Error(data?.error || 'Upload service returned HTTP ' + response.status + '.');
        }
        outcomes.push({
          file: file.name,
          severity: data.indexed ? 'success' : 'warning',
          message: data.indexed ? 'Saved and scanned.' : 'Saved. The library scan did not finish.',
        });
      } catch (error) {
        failed.push(file);
        outcomes.push({ file: file.name, severity: 'error', message: error.message });
      }
    }
    setFiles(failed);
    setResults(outcomes);
    setProgress('');
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>Upload music</Button>
      <Dialog open={open} onClose={progress ? undefined : () => setOpen(false)}
        aria-labelledby="music-upload-title" fullWidth maxWidth="sm">
        <form onSubmit={upload}>
          <DialogTitle id="music-upload-title">Upload music</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Music folder" value={folder} onChange={event => setFolder(event.target.value)}
                helperText="Use an existing folder name or enter a new one." required disabled={!!progress} />
              <Button component="label" variant="outlined" disabled={!!progress}>
                Choose MP3 files
                <input hidden type="file" multiple accept=".mp3,audio/mpeg" disabled={!!progress}
                  onChange={event => {
                    setFiles(Array.from(event.target.files));
                    setResults([]);
                    event.target.value = '';
                  }} />
              </Button>
              {files.length > 0 && <Typography variant="body2">{files.length} file(s) selected</Typography>}
              {progress && <Typography role="status" variant="body2">{progress}</Typography>}
              {results.map((result, index) => (
                <Alert key={index} severity={result.severity}>{result.file} — {result.message}</Alert>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={!!progress}>Close</Button>
            {results.some(result => result.severity !== 'error') && (
              <Button onClick={() => window.location.reload()}>Refresh library</Button>
            )}
            <Button type="submit" variant="contained" disabled={!!progress || !files.length || !folder.trim()}>
              Upload
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

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
        {!new URLSearchParams(urlSearch).get('isSelecting') && <UploadMusic />}
      </Stack>
    </Paper>
  );
};

export default LibraryHeader;
