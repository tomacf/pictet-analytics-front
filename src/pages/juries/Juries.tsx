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
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingJury, setEditingJury] = useState<Jury | null>(null);
  const [formData, setFormData] = useState<JuryInput>({ label: '' });
  const [bulkInput, setBulkInput] = useState('');

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
      await JuriesService.deleteJury(jury.id);
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
        await JuriesService.updateJury(editingJury.id, formData);
        toast.success('Jury updated successfully');
      } else {
        await JuriesService.createJury(formData);
        toast.success('Jury created successfully');
      }
      setIsModalOpen(false);
      fetchJuries();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save jury';
      toast.error(message);
    }
  };

  const handleBulkCreate = () => {
    setBulkInput('');
    setIsBulkModalOpen(true);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const labels = bulkInput
      .split(',')
      .map(label => label.trim())
      .filter(label => label.length > 0);

    if (labels.length === 0) {
      toast.warning('Please enter at least one jury label');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const label of labels) {
      try {
        await JuriesService.createJury({ label });
        successCount++;
      } catch (err) {
        errorCount++;
        const message = err instanceof Error ? err.message : 'Failed to create jury';
        toast.error(`Failed to create "${label}": ${message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully created ${successCount} ${successCount === 1 ? 'jury' : 'juries'}`);
      fetchJuries();
      setBulkInput('');
    }

    if (errorCount === 0) {
      // Keep modal open for continuous adding
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleCreate} className="btn btn-primary">
            Create Jury
          </button>
          <button onClick={handleBulkCreate} className="btn btn-primary">
            Bulk Create
          </button>
        </div>
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

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Create Juries"
      >
        <form onSubmit={handleBulkSubmit} className="form">
          <div className="form-group">
            <label htmlFor="bulkInput">
              Jury Labels (comma-separated)
            </label>
            <textarea
              id="bulkInput"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="e.g., Jury 1, Jury 2, Jury 3"
              rows={5}
              className="form-input"
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
            <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
              Enter jury labels separated by commas. The modal will stay open so you can add more.
            </small>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsBulkModalOpen(false)} className="btn btn-secondary">
              Close
            </button>
            <button type="submit" className="btn btn-primary">
              Create Juries
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Juries;
