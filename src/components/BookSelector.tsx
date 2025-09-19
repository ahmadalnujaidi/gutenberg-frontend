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
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Fetch all Gutenberg books with progress tracking
  const fetchAllBooks = async () => {
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    
    try {
      let url = 'http://gutendex.com/books';
      const allBooks: GutenbergBook[] = [];
      let pageCount = 0;
      const maxPages = 50;
      
      while (url && pageCount < maxPages) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch books: ${response.statusText}`);
        }
        
        const data = await response.json();
        const pageBooks = data.results.map((book: any) => ({
          id: book.id,
          title: book.title
        }));
        
        allBooks.push(...pageBooks);
        pageCount++;
        
        // Update progress
        const progress = (pageCount / maxPages) * 100;
        setLoadingProgress(progress);
        
        // Update UI with progress
        setBooks([...allBooks]);
        url = data.next;
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log(`✅ Loaded ${allBooks.length} books from Project Gutenberg`);
      
    } catch (err) {
      console.error('Failed to fetch books:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
    } finally {
      setLoading(false);
      setLoadingProgress(100);
    }
  };

  // Load books on component mount
  useEffect(() => {
    fetchAllBooks();
  }, []);

  // Filter books based on search input
  const filteredBooks = useMemo(() => {
    if (!searchValue.trim()) return books.slice(0, 100);
    
    const searchLower = searchValue.toLowerCase();
    return books
      .filter(book => 
        book.title.toLowerCase().includes(searchLower) ||
        book.id.toString().includes(searchValue)
      )
      .slice(0, 50);
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
              Loading books from Project Gutenberg...
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={loadingProgress} 
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
              onClick={fetchAllBooks} 
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
              filterOptions={(x) => x}
              slotProps={{
                popper: {
                  style: { zIndex: 1300 }
                }
              }}
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