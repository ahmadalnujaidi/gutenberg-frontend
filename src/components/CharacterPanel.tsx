import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Fade
} from '@mui/material';
import { Search, Person } from '@mui/icons-material';

interface CharacterInteraction {
  character: string;
  totalInteractions: number;
  partners: [string, number][];
}

interface CharacterPanelProps {
  characters: CharacterInteraction[];
  onCharacterClick: (character: string) => void;
  highlightedCharacter: string | null;
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  characters,
  onCharacterClick,
  highlightedCharacter
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCharacters = characters.filter(item =>
    item.character.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper elevation={3} sx={{ p: 3, height: '700px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Person color="primary" />
        Character Network
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search characters..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="small"
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filteredCharacters.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
            {characters.length === 0 ? 
              'Start analysis to see character interactions...' : 
              'No characters found matching your search.'
            }
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredCharacters.map((item, index) => (
              <Fade in={true} timeout={300 + index * 50} key={item.character}>
                <ListItem
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: highlightedCharacter === item.character ? 'primary.light' : 'grey.50',
                    borderRadius: 2,
                    borderLeft: 4,
                    borderLeftColor: 'primary.main',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'primary.light',
                      transform: 'translateX(4px)',
                      boxShadow: 2
                    }
                  }}
                  onClick={() => onCharacterClick(item.character)}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                        {item.character}
                        <Typography 
                          component="span" 
                          color="primary.main" 
                          fontWeight="600"
                          sx={{ ml: 1 }}
                        >
                          ({item.totalInteractions})
                        </Typography>
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {item.partners.slice(0, 6).map(([partner, weight]) => (
                          <Chip
                            key={partner}
                            label={`${partner} (${weight})`}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCharacterClick(partner);
                            }}
                            sx={{
                              fontSize: '0.75rem',
                              height: 24,
                              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                                transform: 'scale(1.05)'
                              }
                            }}
                          />
                        ))}
                        {item.partners.length > 6 && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1, alignSelf: 'center' }}>
                            +{item.partners.length - 6} more
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </Fade>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};