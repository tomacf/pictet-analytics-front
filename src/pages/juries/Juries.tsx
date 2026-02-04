import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { JuriesService, type Jury, type JuryInput } from '../../apiConfig';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import '../teams/Teams.css';

const Juries = () => {
  const [juries, setJuries] = useState<Jury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJury, setEditingJury] = useState<Jury | null>(null);
  const [formData, setFormData] = useState<JuryInput>({ label: '' });

  const fetchJuries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await JuriesService.getAllJuries();
      setJuries(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch juries';
      setError(message);
      toast.error('Failed to fetch juries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJuries();
  }, []);

  const handleCreate = () => {
    setEditingJury(null);
    setFormData({ label: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (jury: Jury) => {
    setEditingJury(jury);
    setFormData({ label: jury.label });
    setIsModalOpen(true);
  };

  const handleDelete = async (jury: Jury) => {
    if (!window.confirm(`Are you sure you want to delete "${jury.label}"?`)) {
      return;
    }

    try {
      await JuriesService.deleteJury({ id: jury.id });
      toast.success('Jury deleted successfully');
      fetchJuries();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete jury';
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingJury) {
        await JuriesService.updateJury({ id: editingJury.id, requestBody: formData });
        toast.success('Jury updated successfully');
      } else {
        await JuriesService.createJury({ requestBody: formData });
        toast.success('Jury created successfully');
      }
      setIsModalOpen(false);
      fetchJuries();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save jury';
      toast.error(message);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'label', label: 'Label' },
    {
      key: 'created_at',
      label: 'Created At',
      render: (jury: Jury) => new Date(jury.created_at).toLocaleString(),
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      render: (jury: Jury) => new Date(jury.updated_at).toLocaleString(),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchJuries} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Juries</h1>
        <button onClick={handleCreate} className="btn btn-primary">
          Create Jury
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
            <label htmlFor="label">Label</label>
            <input
              type="text"
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
              className="form-input"
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
