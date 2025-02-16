import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@mui/material';
import { BatchWorkspaceState } from '../types';
import BatchWorkspace from './BatchWorkspace';

interface BatchWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  initialState: BatchWorkspaceState;
}

export default function BatchWorkspaceDialog({ 
  open, 
  onClose, 
  initialState 
}: BatchWorkspaceDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <BatchWorkspace initialState={initialState} />
      </DialogContent>
    </Dialog>
  );
}
