import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import CardsList from './list';
import request from '../../utils/request';

const CardsOverview = () => {
  const { t } = useTranslation();
  const [cards, setCards] = useState({});
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    async function loadCards() {
      try {
        const { result, error } = await request('cardsList');
        if (active) {
          setCards(result || {});
          setStatus(error ? 'error' : 'ready');
        }
      } catch {
        if (active) setStatus('error');
      }
    }
    loadCards();
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = () => {
    setStatus('loading');
    setAttempt(current => current + 1);
  };

  const query = search.trim().toLocaleLowerCase();
  const entries = Object.entries(cards);
  const filtered = entries.filter(([id, card]) => {
    const fields = [id, card.from_alias, card.func, JSON.stringify(card.action?.args)];
    return fields.some(field => String(field ?? '').toLocaleLowerCase().includes(query));
  });

  return (
    <Stack component="main" id="cards" spacing={2} sx={{ width: '100%', p: { xs: 1, sm: 2 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4 }}>
        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
              {t('cards.overview.cards')}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {t('cards.overview.tap-to-add', { defaultValue: 'Add a card, then tap it on your Phoniebox to assign music or an action.' })}
            </Typography>
          </Box>
          <Button component={Link} to="register" variant="contained" startIcon={<AddIcon />} sx={{ minHeight: 48, flexShrink: 0 }}>
            {t('cards.overview.register-card')}
          </Button>
        </Stack>
      </Paper>

      {status === 'loading' && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress aria-label={t('cards.overview.loading', { defaultValue: 'Loading cards' })} />
        </Box>
      )}
      {status === 'error' && (
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={retry}>
            {t('cards.overview.retry', { defaultValue: 'Retry' })}
          </Button>
        }>
          {t('cards.overview.loading-error')}
        </Alert>
      )}
      {status === 'ready' && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
          {entries.length > 0 && (
            <TextField
              fullWidth
              type="search"
              label={t('cards.overview.search', { defaultValue: 'Search by card ID or assignment' })}
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          )}
          {entries.length > 0 && filtered.length === 0 ? (
            <Typography role="status" color="text.secondary" sx={{ pt: 2 }}>
              {t('cards.overview.no-matches', { defaultValue: 'No cards match your search.' })}
            </Typography>
          ) : (
            <CardsList cardsList={Object.fromEntries(filtered)} />
          )}
        </Paper>
      )}
    </Stack>
  );
};

export default CardsOverview;
