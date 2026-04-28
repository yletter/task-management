import React, { useState, useEffect, useCallback } from 'react';
import * as api from './api';
import TaskTable from './components/TaskTable';
import TaskFormModal from './components/TaskFormModal';
import StepPanel from './components/StepPanel';
import Toast from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';

function App() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Modal states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Panel state
  const [selectedTask, setSelectedTask] = useState(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState(null);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getAllTasks();
      setTasks(res.data.data);
    } catch (err) {
      addToast('Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.getAllCategories();
      setCategories(res.data.data);
    } catch (err) {
      addToast('Failed to fetch categories', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, [fetchTasks, fetchCategories]);

  // ─── Task Handlers ──────────────────────────────────────────────────────

  const handleCreateTask = async (data) => {
    try {
      await api.createTask(data);
      addToast('Task created successfully');
      fetchTasks();
      setShowTaskForm(false);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create task', 'error');
    }
  };

  const handleUpdateTask = async (taskNumber, data) => {
    try {
      await api.updateTask(taskNumber, data);
      addToast('Task updated successfully');
      fetchTasks();
      setEditingTask(null);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update task', 'error');
    }
  };

  const handleDeleteTask = (taskNumber) => {
    setConfirmDialog({
      message: `Are you sure you want to delete task "${taskNumber}"? All steps will also be deleted.`,
      onConfirm: async () => {
        try {
          await api.deleteTask(taskNumber);
          addToast('Task deleted successfully');
          fetchTasks();
          if (selectedTask?.task_number === taskNumber) {
            setSelectedTask(null);
          }
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to delete task', 'error');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 Task Management</h1>
        <div className="header-actions">
          <button className="btn btn-success" onClick={() => { setEditingTask(null); setShowTaskForm(true); }}>
            ＋ New Task
          </button>
        </div>
      </header>

      <main className="app-content">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: '12px' }}>Loading tasks...</p>
          </div>
        ) : (
          <TaskTable
            tasks={tasks}
            onEdit={(task) => { setEditingTask(task); setShowTaskForm(true); }}
            onDelete={handleDeleteTask}
            onTaskClick={handleTaskClick}
            onInlineUpdate={handleUpdateTask}
          />
        )}
      </main>

      {/* Task Create/Edit Modal */}
      {showTaskForm && (
        <TaskFormModal
          task={editingTask}
          onSave={editingTask
            ? (data) => handleUpdateTask(editingTask.task_number, data)
            : handleCreateTask
          }
          onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
        />
      )}

      {/* Step Panel */}
      {selectedTask && (
        <StepPanel
          task={selectedTask}
          categories={categories}
          onClose={() => setSelectedTask(null)}
          addToast={addToast}
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

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}

export default App;
