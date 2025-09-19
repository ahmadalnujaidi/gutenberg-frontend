import React, { useState, useRef } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  Container, 
  Typography, 
  Box, 
  Paper,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Alert
} from '@mui/material';
import { NetworkVisualization } from './components/NetworkVisualization';
import { CharacterPanel } from './components/CharacterPanel';
import { ControlPanel } from './components/ControlPanel';
import { BookSelector } from './components/BookSelector';
import { useSocket } from './hooks/useSocket';
import { useNetworkData } from './hooks/useNetworkData';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease-in-out',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [sessionId] = useState(`session_${Date.now()}`);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{ id: number, title: string } | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConnected, 
    currentUpdate, 
    joinSession, 
    clearUpdates 
  } = useSocket(import.meta.env.VITE_SOCKET_URL);
  
  const { 
    nodes, 
    links, 
    highlightedCharacter,
    updateData, 
    highlightCharacter, 
    getCharacterInteractions 
  } = useNetworkData();

  const handleBookSelect = async (bookId: number, bookTitle: string) => {
    try {
      setIsAnalyzing(true);
      setSelectedBook({ id: bookId, title: bookTitle });
      clearUpdates();
      joinSession(sessionId);

      const bookIdString = bookId.toString();

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId,
          bookID: bookIdString,
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log(`✅ Analysis started for "${bookTitle}" (ID: ${bookId})`);
    } catch (error) {
      console.error('❌ Failed to start analysis:', error);
      setIsAnalyzing(false);
    }
  };

  // Get current step for stepper
  const getCurrentStep = () => {
    if (!selectedBook) return 0;
    if (!hasAnalyzed && !isAnalyzing) return 1;
    if (isAnalyzing) return 2;
    return 3;
  };

  const steps = [
    'Select a Book',
    'Ready to Analyze',
    'Processing',
    'Explore Results'
  ];

  // Update data when receiving streaming updates
  React.useEffect(() => {
    if (currentUpdate?.type === 'batch_complete' && currentUpdate.data) {
      updateData(currentUpdate.data);
    } else if (currentUpdate?.type === 'analysis_complete' && currentUpdate.data) {
      updateData(currentUpdate.data);
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    } else if (currentUpdate?.type === 'error') {
      setIsAnalyzing(false);
    }
  }, [currentUpdate, updateData]);

  const EmptyStateMessage = () => (
    <Fade in={!selectedBook || nodes.length === 0}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          p: 4,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ opacity: 0.7 }}>
          {!selectedBook ? '📚 Choose a book to begin' : '🔍 Analysis in progress...'}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.5, maxWidth: 400 }}>
          {!selectedBook 
            ? 'Select a book from Project Gutenberg above to start analyzing character relationships and interactions.'
            : 'Please wait while we process the book and extract character networks. This may take a few minutes.'}
        </Typography>
      </Box>
    </Fade>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth={false} sx={{ py: 3, px: 2 }}>
        {/* Header with improved spacing */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ mb: 2 }}
          >
            📚 Literary Character Network Analysis
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Discover character relationships in classic literature using AI-powered analysis
          </Typography>
          
          {/* Progress Stepper */}
          <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
            <Stepper activeStep={getCurrentStep()} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Box>

        {/* Book Selector with improved messaging */}
        <Fade in timeout={500}>
          <Box>
            <BookSelector
              onBookSelect={handleBookSelect}
              isAnalyzing={isAnalyzing}
              selectedBook={selectedBook}
            />
          </Box>
        </Fade>

        {/* Control Panel - only show when book is selected */}
        <Fade in={!!selectedBook} timeout={800}>
          <Box>
            <ControlPanel
              isConnected={isConnected}
              isAnalyzing={isAnalyzing}
              currentUpdate={currentUpdate}
              onStartAnalysis={() => selectedBook && handleBookSelect(selectedBook.id, selectedBook.title)}
              sessionId={sessionId}
              selectedBook={selectedBook}
            />
          </Box>
        </Fade>

        {/* Results Section */}
        <Fade in timeout={1000}>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* Network Visualization */}
              <Paper 
                ref={containerRef}
                elevation={3} 
                sx={{ 
                  flex: 1, 
                  p: 2, 
                  minHeight: '700px',
                  background: '#000000',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '2px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {nodes.length > 0 ? (
                  <NetworkVisualization
                    nodes={nodes}
                    links={links}
                    highlightedCharacter={highlightedCharacter}
                    onCharacterClick={highlightCharacter}
                    width={900}
                    height={700}
                  />
                ) : (
                  <EmptyStateMessage />
                )}
              </Paper>

              {/* Character Panel */}
              <Fade in={nodes.length > 0} timeout={1200}>
                <Box sx={{ width: 400 }}>
                  <CharacterPanel
                    characters={getCharacterInteractions()}
                    onCharacterClick={highlightCharacter}
                    highlightedCharacter={highlightedCharacter}
                  />
                </Box>
              </Fade>
            </Box>
          </Box>
        </Fade>

        {/* Help/Info Section */}
        {hasAnalyzed && nodes.length > 0 && (
          <Fade in timeout={1500}>
            <Alert 
              severity="info" 
              sx={{ 
                mt: 3, 
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <Typography variant="body2">
                <strong>💡 How to explore:</strong> Click on characters in the network to highlight their connections, 
                or use the character panel on the right to see detailed interaction statistics. 
                The network automatically adjusts to show all characters optimally.
              </Typography>
            </Alert>
          </Fade>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default App;