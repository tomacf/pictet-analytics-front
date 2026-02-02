import { useState, useEffect } from 'react';
import { JuriesService } from '../../apiConfig';
import type { Jury, JuryInput } from '../../api';
import DataTable from '../../components/shared/DataTable';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import Modal from '../../components/shared/Modal';
import { toast } from 'react-toastify';
import '../teams/Teams.css';

const Juries = () => {
  const [juries, setJuries] = useState<Jury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJury, setEditingJury] = useState<Jury | null>(null);
  const [formData, setFormData] = useState<JuryInput>({ name: '', email: '' });

  const fetchJuries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await JuriesService.getAllJuries();
      setJuries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch juries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJuries();
  }, []);

  const handleCreate = () => {
    setEditingJury(null);
    setFormData({ name: '', email: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (jury: Jury) => {
    setEditingJury(jury);
    setFormData({ name: jury.name, email: jury.email });
    setIsModalOpen(true);
  };

  const handleDelete = async (jury: Jury) => {
    if (!window.confirm(`Are you sure you want to delete jury member "${jury.name}"?`)) {
      return;
    }

    try {
      await JuriesService.deleteJury(jury.id);
      toast.success('Jury deleted successfully');
      fetchJuries();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete jury');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Jury name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      if (editingJury) {
        await JuriesService.updateJury({
          ...editingJury,
          ...formData,
        });
        toast.success('Jury updated successfully');
      } else {
        await JuriesService.createJury(formData);
        toast.success('Jury created successfully');
      }
      setIsModalOpen(false);
      fetchJuries();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save jury');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'created_at',
      label: 'Created',
      render: (jury: Jury) => new Date(jury.created_at).toLocaleString(),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchJuries} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Juries</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Create Jury
        </button>
      </div>

      <DataTable
        columns={columns}
        data={juries}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJury ? 'Edit Jury' : 'Create Jury'}
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter jury name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingJury ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Juries;
