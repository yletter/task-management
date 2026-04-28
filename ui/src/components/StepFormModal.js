
import React, { useState } from 'react';

function StepFormModal({ step, categories, onSave, onClose }) {
  const [formData, setFormData] = useState({
    category_id: step?.category_id || (categories.length ? categories[0].id : ''),
    detail: step?.detail || '',
    owners: step?.owners || '',
    status: step?.status || 'To be done',
    completion_time: step?.completion_time ? step.completion_time.slice(0, 16) : '',
    rollback_step: step?.rollback_step || '',
    rollback_status: step?.rollback_status || 'To be done',
    rollback_time: step?.rollback_time ? step.rollback_time.slice(0, 16) : '',
    notes: step?.notes || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'category_id' ? parseInt(value) : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.completion_time) delete data.completion_time;
    if (!data.rollback_time) delete data.rollback_time;
    onSave(data);
  };

  const statusOptions = ['Hold', 'To be done', 'In progress', 'Complete'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h3>{step ? `Edit Step #${step.step_number}` : 'Create New Step'}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select className="form-control" name="category_id" value={formData.category_id} onChange={handleChange} required>
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Owners</label>
                <input
                  className="form-control"
                  name="owners"
                  value={formData.owners}
                  onChange={handleChange}
                  placeholder="e.g., John Doe, Jane Smith"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Detail</label>
              <textarea
                className="form-control"
                name="detail"
                value={formData.detail}
                onChange={handleChange}
                rows="3"
                placeholder="Step details..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Completion Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="completion_time"
                  value={formData.completion_time}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Rollback Step</label>
              <textarea
                className="form-control"
                name="rollback_step"
                value={formData.rollback_step}
                onChange={handleChange}
                rows="2"
                placeholder="Rollback instructions..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rollback Status</label>
                <select className="form-control" name="rollback_status" value={formData.rollback_status} onChange={handleChange}>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Rollback Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="rollback_time"
                  value={formData.rollback_time}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="form-control"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                placeholder="Additional notes..."
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                {step ? 'Update Step' : 'Create Step'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StepFormModal;
