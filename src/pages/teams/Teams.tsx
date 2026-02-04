import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { TeamsService, type Team, type TeamInput } from '../../apiConfig';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import './Teams.css';

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<TeamInput>({ label: '' });
  const [bulkInput, setBulkInput] = useState('');

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TeamsService.getAllTeams();
      setTeams(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch teams';
      setError(message);
      toast.error('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreate = () => {
    setEditingTeam(null);
    setFormData({ label: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({ label: team.label });
    setIsModalOpen(true);
  };

  const handleDelete = async (team: Team) => {
    if (!window.confirm(`Are you sure you want to delete "${team.label}"?`)) {
      return;
    }

    try {
      await TeamsService.deleteTeam(team.id);
      toast.success('Team deleted successfully');
      fetchTeams();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete team';
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTeam) {
        await TeamsService.updateTeam(editingTeam.id, formData);
        toast.success('Team updated successfully');
      } else {
        await TeamsService.createTeam(formData);
        toast.success('Team created successfully');
      }
      setIsModalOpen(false);
      fetchTeams();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save team';
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
      toast.warning('Please enter at least one team label');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const label of labels) {
      try {
        await TeamsService.createTeam({ label });
        successCount++;
      } catch (err) {
        errorCount++;
        const message = err instanceof Error ? err.message : 'Failed to create team';
        toast.error(`Failed to create "${label}": ${message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully created ${successCount} team(s)`);
      fetchTeams();
      setBulkInput('');
    }

    if (errorCount === 0) {
      // Only close if all succeeded and user wants to close
      // For now, keep it open for continuous adding
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'label', label: 'Label' },
    {
      key: 'created_at',
      label: 'Created At',
      render: (team: Team) => new Date(team.created_at).toLocaleString(),
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      render: (team: Team) => new Date(team.updated_at).toLocaleString(),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchTeams} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Teams</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleCreate} className="btn btn-primary">
            Create Team
          </button>
          <button onClick={handleBulkCreate} className="btn btn-primary">
            Bulk Create
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={teams}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeam ? 'Edit Team' : 'Create Team'}
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
              {editingTeam ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Create Teams"
      >
        <form onSubmit={handleBulkSubmit} className="form">
          <div className="form-group">
            <label htmlFor="bulkInput">
              Team Labels (comma-separated)
            </label>
            <textarea
              id="bulkInput"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="e.g., Team Alpha, Team Beta, Team Gamma"
              rows={5}
              className="form-input"
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
            <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
              Enter team labels separated by commas. The modal will stay open so you can add more.
            </small>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsBulkModalOpen(false)} className="btn btn-secondary">
              Close
            </button>
            <button type="submit" className="btn btn-primary">
              Create Teams
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Teams;
