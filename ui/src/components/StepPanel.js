import React, { useState, useEffect, useCallback } from 'react';
import * as apiService from '../api';
import StepCard from './StepCard';
import StepFormModal from './StepFormModal';
import ConfirmDialog from './ConfirmDialog';

function StepPanel({ task, categories, onClose, addToast }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStepForm, setShowStepForm] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const fetchSteps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getSteps(task.task_number);
      setSteps(res.data.data);
      setOrderChanged(false);
    } catch (err) {
      addToast('Failed to fetch steps', 'error');
    } finally {
      setLoading(false);
    }
  }, [task.task_number, addToast]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  // ─── Step CRUD ────────────────────────────────────────────────────────

  const handleCreateStep = async (data) => {
    try {
      await apiService.createStep(task.task_number, data);
      addToast('Step created successfully');
      fetchSteps();
      setShowStepForm(false);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create step', 'error');
    }
  };

  const handleUpdateStep = async (stepNumber, data) => {
    try {
      await apiService.updateStep(task.task_number, stepNumber, data);
      addToast('Step updated successfully');
      fetchSteps();
      setEditingStep(null);
      setShowStepForm(false);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update step', 'error');
    }
  };

  const handleDeleteStep = (stepNumber) => {
    setConfirmDialog({
      message: `Are you sure you want to delete Step #${stepNumber}?`,
      onConfirm: async () => {
        try {
          await apiService.deleteStep(task.task_number, stepNumber);
          addToast('Step deleted successfully');
          fetchSteps();
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to delete step', 'error');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // ─── Drag and Drop Reorder ────────────────────────────────────────────

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSteps = [...steps];
    const draggedItem = newSteps[draggedIndex];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedItem);

    // Reassign step numbers
    newSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });

    setSteps(newSteps);
    setDraggedIndex(index);
    setOrderChanged(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    try {
      const order = steps.map((step) => ({
        step_id: step.id,
        step_number: step.step_number,
      }));
      await apiService.reorderSteps(task.task_number, order);
      addToast('Step order saved successfully');
      setOrderChanged(false);
      fetchSteps();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save order', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <>
      <div className="overlay" onClick={onClose}></div>
      <div className="slide-panel">
        <div className="panel-header">
          <div>
            <h2>📝 {task.task_number}</h2>
            <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
              {task.description || 'No description'}
            </span>
          </div>
          <div className="panel-actions">
            <button
              className="btn btn-success"
              onClick={() => { setEditingStep(null); setShowStepForm(true); }}
            >
              ＋ New Step
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="task-info-bar" style={{ margin: '16px 24px 0' }}>
          <div className="info-item">
            <span className="label">Version:</span>
            <span>{task.version || '—'}</span>
          </div>
          <div className="info-item">
            <span className="label">Release:</span>
            <span>{task.release_type || '—'}</span>
          </div>
          <div className="info-item">
            <span className="label">Environment:</span>
            <span>{task.environment || '—'}</span>
          </div>
          <div className="info-item">
            <span className="label">Planned:</span>
            <span>{formatDate(task.planned_date)}</span>
          </div>
          <div className="info-item">
            <span className="label">Created:</span>
            <span>{formatDate(task.created)}</span>
          </div>
        </div>

        <div className="panel-body">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p style={{ marginTop: '12px' }}>Loading steps...</p>
            </div>
          ) : steps.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📝</div>
              <h3>No steps yet</h3>
              <p>Click "New Step" to add the first step</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '12px' }}>
                💡 Drag and drop steps to reorder them
              </p>
              {steps.map((step, index) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={index}
                  categories={categories}
                  onEdit={() => { setEditingStep(step); setShowStepForm(true); }}
                  onDelete={() => handleDeleteStep(step.step_number)}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === index}
                />
              ))}
            </div>
          )}
        </div>

        {orderChanged && (
          <div className="save-order-bar">
            <span>⚠️ Step order has been changed</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline btn-sm" onClick={fetchSteps}>Discard</button>
              <button className="btn btn-success" onClick={handleSaveOrder}>
                💾 Save Order
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step Form Modal */}
      {showStepForm && (
        <StepFormModal
          step={editingStep}
          categories={categories}
          onSave={editingStep
            ? (data) => handleUpdateStep(editingStep.step_number, data)
            : handleCreateStep
          }
          onClose={() => { setShowStepForm(false); setEditingStep(null); }}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </>
  );
}

export default StepPanel;
