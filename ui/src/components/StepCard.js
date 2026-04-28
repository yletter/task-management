
import React from 'react';

function StepCard({ step, index, onEdit, onDelete, onDragStart, onDragOver, onDragEnd, isDragging }) {

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Hold': return 'badge-hold';
      case 'To be done': return 'badge-tobedone';
      case 'In progress': return 'badge-inprogress';
      case 'Complete': return 'badge-complete';
      default: return 'badge-tobedone';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div
      className={`step-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="step-card-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="drag-handle" title="Drag to reorder">⠿</span>
          <span className="step-number">Step #{step.step_number}</span>
          {step.category_name && (
            <span style={{ marginLeft: '12px', fontSize: '0.8rem' }}>
              <span className="category-dot" style={{ backgroundColor: step.category_colour || '#ccc' }}></span>
              {step.category_name}
            </span>
          )}
        </div>
        <div className="step-actions">
          <span className={`badge ${getStatusBadgeClass(step.status)}`}>{step.status}</span>
          <button className="btn btn-warning btn-sm" onClick={onEdit}>✏️ Edit</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑️</button>
        </div>
      </div>
      <div className="step-card-body">
        <div className="step-field full-width">
          <span className="field-label">Detail</span>
          <span className="field-value">{step.detail || '—'}</span>
        </div>
        <div className="step-field">
          <span className="field-label">Owners</span>
          <span className="field-value">{step.owners || '—'}</span>
        </div>
        <div className="step-field">
          <span className="field-label">Completion Time</span>
          <span className="field-value">{formatDate(step.completion_time)}</span>
        </div>
        <div className="step-field full-width">
          <span className="field-label">Rollback Step</span>
          <span className="field-value">{step.rollback_step || '—'}</span>
        </div>
        <div className="step-field">
          <span className="field-label">Rollback Status</span>
          <span className="field-value">
            <span className={`badge ${getStatusBadgeClass(step.rollback_status)}`}>
              {step.rollback_status || 'To be done'}
            </span>
          </span>
        </div>
        <div className="step-field">
          <span className="field-label">Rollback Time</span>
          <span className="field-value">{formatDate(step.rollback_time)}</span>
        </div>
        {step.notes && (
          <div className="step-field full-width">
            <span className="field-label">Notes</span>
            <span className="field-value">{step.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StepCard;