import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BatchWorkspace from '../components/BatchWorkspace';
import BatchList from '../../BatchList';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function BatchWorkspaceRoutes() {
  const { isEnabled: useNewBatchSystem } = useFeatureFlag('NEW_BATCH_SYSTEM');

  if (!useNewBatchSystem) {
    return <Navigate to="/batches" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<BatchList />} />
      <Route path="/new" element={<BatchWorkspace />} />
    </Routes>
  );
}
