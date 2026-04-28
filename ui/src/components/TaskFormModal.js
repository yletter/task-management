import React, { useState } from 'react';

function TaskFormModal({ task, onSave, onClose }) {
  const [formData, setFormData] = useState({
    task_number: task?.task_number || '',
    version: task?.version || '',
    description: task?.description || '',
    release_type: task?.release_type || '',
    environment: task?.environment || '',
    planned_date: task?.planned_date ? task.planned_date.slice(0, 16) : '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.planned_date) delete data.planned_date;
    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{task ? 'Edit Task' : 'Create New Task'}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Task Number *</label>
                <input
                  className="form-control"
                  name="task_number"
                  value={formData.task_number}
                  onChange={handleChange}
                  required
                  disabled={!!task}
                  placeholder="e.g., TASK-001"
                />
              </div>
              <div className="form-group">
                <label>Version</label>
                <input
                  className="form-control"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  placeholder="e.g., v1.0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Task description..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Release Type</label>
                <select className="form-control" name="release_type" value={formData.release_type} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                  <option value="Patch">Patch</option>
                  <option value="Hotfix">Hotfix</option>
                </select>
              </div>
              <div className="form-group">
                <label>Environment</label>
                <select className="form-control" name="environment" value={formData.environment} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="Development">Development</option>
                  <option value="Staging">Staging</option>
                  <option value="UAT">UAT</option>
                  <option value="Production">Production</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Planned Date</label>
              <input
                type="datetime-local"
                className="form-control"
                name="planned_date"
                value={formData.planned_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                {task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TaskFormModal;
