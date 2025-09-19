import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  TextField,
  Autocomplete,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Fade,
  LinearProgress
} from '@mui/material';
import { Search, Book, Send, CheckCircle, Refresh } from '@mui/icons-material';

// Import the local books data
import booksData from '../assets/books_id_title.json';

interface GutenbergBook {
  id: number;
  title: string;
}

interface BookSelectorProps {
  onBookSelect: (bookId: number, bookTitle: string) => void;
  isAnalyzing: boolean;
  selectedBook: { id: number; title: string } | null;
}

export const BookSelector: React.FC<BookSelectorProps> = ({
  onBookSelect,
  isAnalyzing,
  selectedBook
}) => {
  const [books, setBooks] = useState<GutenbergBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<GutenbergBook | null>(selectedBook);

  // Load books from local JSON file
  const loadBooksFromLocal = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate a small delay to show loading state
      setTimeout(() => {
        setBooks(booksData as GutenbergBook[]);
        setLoading(false);
        console.log(`✅ Loaded ${booksData}`);
      }, 300);
      
    } catch (err) {
      console.error('Failed to load books:', err);
      setError(err instanceof Error ? err.message : 'Failed to load books');
      setLoading(false);
    }
  };

  // Load books on component mount
  useEffect(() => {
    loadBooksFromLocal();
  }, []);

  // Filter books based on search input with improved performance
  const filteredBooks = useMemo(() => {
    if (!searchValue.trim()) return books.slice(0, 100); // Show first 100 books by default
    
    const searchLower = searchValue.toLowerCase();
    const searchTerms = searchLower.split(' ').filter(term => term.length > 0);
    
    return books
      .filter(book => {
        const titleLower = book.title.toLowerCase();
        const idMatch = book.id.toString().includes(searchValue);
        
        // Match if ID matches or all search terms are found in title
        return idMatch || searchTerms.every(term => titleLower.includes(term));
      })
      .slice(0, 50); // Limit results for performance
  }, [books, searchValue]);

  const handleBookSelection = (book: GutenbergBook | null) => {
    setSelectedOption(book);
  };

  const handleAnalyzeBook = () => {
    if (selectedOption) {
      onBookSelect(selectedOption.id, selectedOption.title);
    }
  };

  const isBookSelected = !!selectedOption;

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        mb: 3,
        border: isBookSelected ? '2px solid' : '2px solid transparent',
        borderColor: isBookSelected ? 'success.main' : 'transparent',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Book color="primary" />
        <Typography variant="h6">
          Step 1: Select Book from Project Gutenberg
        </Typography>
        {isBookSelected && (
          <Fade in timeout={500}>
            <CheckCircle color="success" />
          </Fade>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose from thousands of classic books available in Project Gutenberg's digital library
      </Typography>

      {/* Loading Progress */}
      {loading && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">
              Loading books from local database...
            </Typography>
          </Box>
          <LinearProgress 
            variant="indeterminate" 
            sx={{ borderRadius: 2 }}
          />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <Button 
              startIcon={<Refresh />}
              onClick={loadBooksFromLocal} 
              size="small"
              color="error"
            >
              Retry
            </Button>
          </Box>
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Autocomplete
            options={filteredBooks}
            getOptionLabel={(option) => `${option.title} (ID: ${option.id})`}
            value={selectedOption}
            onChange={(_, newValue) => handleBookSelection(newValue)}
            inputValue={searchValue}
            onInputChange={(_, newInputValue) => setSearchValue(newInputValue)}
            loading={loading}
            disabled={isAnalyzing}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search for a book..."
                placeholder="Try 'Pride and Prejudice', 'Dracula', or enter book ID"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
                  endAdornment: (
                    <>
                      {loading && <CircularProgress color="inherit" size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    },
                  },
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body1" noWrap>
                    {option.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Project Gutenberg ID: {option.id}
                  </Typography>
                </Box>
              </Box>
            )}
            noOptionsText={
              loading ? "Loading books..." : 
              searchValue ? "No books found matching your search" : 
              "Start typing to search through thousands of books..."
            }
            filterOptions={(x) => x} // We handle filtering manually for better performance
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {loading ? 'Loading...' : `${books.length.toLocaleString()} books available`}
            {filteredBooks.length < books.length && searchValue && (
              ` • Showing top ${filteredBooks.length} results`
            )}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={handleAnalyzeBook}
          disabled={!selectedOption || isAnalyzing}
          sx={{
            background: selectedOption && !isAnalyzing
              ? 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
              : 'linear-gradient(45deg, #ccc 30%, #999 90%)',
            minWidth: 140,
            height: 56,
            '&:hover': selectedOption && !isAnalyzing ? {
              background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
            } : {},
            '&:disabled': {
              color: 'white',
            }
          }}
        >
          Analyze Book
        </Button>
      </Box>

      {selectedOption && (
        <Fade in timeout={500}>
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircle color="success" fontSize="small" />
              <Typography variant="body2" fontWeight="medium" color="success.dark">
                Book Selected Successfully
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="600" sx={{ mb: 0.5 }}>
              {selectedOption.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Project Gutenberg ID: {selectedOption.id}
            </Typography>
          </Box>
        </Fade>
      )}
    </Paper>
  );
};