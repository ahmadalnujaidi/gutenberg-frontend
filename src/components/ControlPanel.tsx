import React from 'react';
import {
  Paper,
  Button,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
  Tooltip
} from '@mui/material';
import { PlayArrow, Wifi, WifiOff, Book, Warning } from '@mui/icons-material';
import type { StreamingUpdate } from '../types';

interface ControlPanelProps {
  isConnected: boolean;
  isAnalyzing: boolean;
  currentUpdate: StreamingUpdate | null;
  onStartAnalysis: () => void;
  sessionId: string;
  selectedBook?: { id: number; title: string } | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isConnected,
  isAnalyzing,
  currentUpdate,
  onStartAnalysis,
  sessionId,
  selectedBook
}) => {
  const getProgressValue = () => {
    if (!currentUpdate || !currentUpdate.totalBatches || currentUpdate.batchIndex === undefined) return 0;
    return ((currentUpdate.batchIndex + 1) / currentUpdate.totalBatches) * 100;
  };

  const getStatusMessage = () => {
    if (!selectedBook) return 'Please select a book above to begin analysis';
    if (!isConnected) return 'Connecting to server...';
    if (!currentUpdate) return 'Ready to analyze selected book';
    
    switch (currentUpdate.type) {
      case 'progress':
        return currentUpdate.message || 'Processing...';
      case 'batch_complete':
        return `Processing batch ${(currentUpdate.batchIndex || 0) + 1}/${currentUpdate.totalBatches || 1}...`;
      case 'analysis_complete':
        return '🎉 Analysis complete! Explore the character network above.';
      case 'error':
        return `❌ ${currentUpdate.message}`;
      default:
        return 'Processing...';
    }
  };

  const canStartAnalysis = isConnected && selectedBook && !isAnalyzing;

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Analysis Control</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={isConnected ? <Wifi /> : <WifiOff />}
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            Session: {sessionId.slice(-8)}
          </Typography>
        </Box>
      </Box>

      {/* Selected Book Display */}
      {selectedBook && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Book color="primary" fontSize="small" />
            <Typography variant="body2" fontWeight="medium">Selected Book:</Typography>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {selectedBook.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Project Gutenberg ID: {selectedBook.id}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Tooltip 
          title={!selectedBook ? "Please select a book first" : !isConnected ? "Not connected to server" : "Start analyzing the selected book"}
          arrow
        >
          <span>
            <Button
              variant="contained"
              startIcon={isAnalyzing ? undefined : <PlayArrow />}
              onClick={onStartAnalysis}
              disabled={!canStartAnalysis}
              sx={{
                background: canStartAnalysis 
                  ? 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                  : 'linear-gradient(45deg, #ccc 30%, #999 90%)',
                minWidth: 160,
                '&:hover': canStartAnalysis ? {
                  background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                } : {},
                '&:disabled': {
                  color: 'white',
                }
              }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
            </Button>
          </span>
        </Tooltip>

        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {getStatusMessage()}
          </Typography>
          {isAnalyzing && currentUpdate?.totalBatches && (
            <LinearProgress 
              variant="determinate" 
              value={getProgressValue()} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  borderRadius: 4,
                }
              }} 
            />
          )}
        </Box>
      </Box>

      {/* Validation Message */}
      {!selectedBook && (
        <Alert 
          severity="warning" 
          icon={<Warning />}
          sx={{ mb: 2 }}
        >
          You must select a book from the search above before starting the analysis.
        </Alert>
      )}

      {/* Results Summary */}
      {currentUpdate?.data && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label={`👥 ${currentUpdate.data.characters?.length || 0} characters`} 
            variant="outlined" 
            size="small"
            color="primary"
          />
          <Chip 
            label={`🔗 ${currentUpdate.data.interactions?.length || 0} interactions`} 
            variant="outlined" 
            size="small"
            color="secondary"
          />
        </Box>
      )}

      {currentUpdate?.type === 'error' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {currentUpdate.message}
        </Alert>
      )}
    </Paper>
  );
};