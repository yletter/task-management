import React, { useState } from 'react';

function TaskTable({ tasks, onEdit, onDelete, onTaskClick, onInlineUpdate }) {
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineData, setInlineData] = useState({});

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  const handleInlineEdit = (task) => {
    setInlineEditId(task.id);
    setInlineData({
      version: task.version || '',
      description: task.description || '',
      release_type: task.release_type || '',
      environment: task.environment || '',
      planned_date: task.planned_date ? task.planned_date.slice(0, 16) : '',
    });
  };

  const handleInlineSave = (taskNumber) => {
    onInlineUpdate(taskNumber, inlineData);
    setInlineEditId(null);
  };

  const handleInlineCancel = () => {
    setInlineEditId(null);
    setInlineData({});
  };

  if (!tasks.length) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>No tasks yet</h3>
          <p>Click "New Task" to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>All Tasks ({tasks.length})</h2>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Task Number</th>
              <th>Version</th>
              <th>Description</th>
              <th>Release Type</th>
              <th>Environment</th>
              <th>Planned Date</th>
              <th>Steps</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                {inlineEditId === task.id ? (
                  <>
                    <td>
                      <span className="clickable" onClick={() => onTaskClick(task)}>
                        {task.task_number}
                      </span>
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        value={inlineData.version}
                        onChange={(e) => setInlineData({ ...inlineData, version: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        value={inlineData.description}
                        onChange={(e) => setInlineData({ ...inlineData, description: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        value={inlineData.release_type}
                        onChange={(e) => setInlineData({ ...inlineData, release_type: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        value={inlineData.environment}
                        onChange={(e) => setInlineData({ ...inlineData, environment: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        className="inline-input"
                        value={inlineData.planned_date}
                        onChange={(e) => setInlineData({ ...inlineData, planned_date: e.target.value })}
                      />
                    </td>
                    <td>{task.details?.length || 0}</td>
                    <td>{formatDate(task.created)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleInlineSave(task.task_number)}>
                          Save
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={handleInlineCancel}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      <span className="clickable" onClick={() => onTaskClick(task)}>
                        {task.task_number}
                      </span>
                    </td>
                    <td>
                      <span className="clickable" onClick={() => onTaskClick(task)}>
                        {task.version || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="clickable" onClick={() => onTaskClick(task)}>
                        {task.description ? (task.description.length > 50 ? task.description.slice(0, 50) + '...' : task.description) : '—'}
                      </span>
                    </td>
                    <td>{task.release_type || '—'}</td>
                    <td>{task.environment || '—'}</td>
                    <td>{formatDate(task.planned_date)}</td>
                    <td>{task.details?.length || 0}</td>
                    <td>{formatDate(task.created)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-warning btn-sm" onClick={() => handleInlineEdit(task)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.task_number)}>
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TaskTable;