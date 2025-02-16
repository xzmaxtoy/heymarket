import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BatchWorkspace from '../components/BatchWorkspace';
import BatchList from '../../BatchList';

export default function BatchWorkspaceRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BatchList />} />
      <Route path="/new" element={<BatchWorkspace />} />
    </Routes>
  );
}
