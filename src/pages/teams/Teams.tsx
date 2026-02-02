import { useState, useEffect } from 'react';
import { TeamsService } from '../../apiConfig';
import type { Team, TeamInput } from '../../api';
import DataTable from '../../components/shared/DataTable';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import Modal from '../../components/shared/Modal';
import { toast } from 'react-toastify';
import './Teams.css';

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<TeamInput>({ name: '' });

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TeamsService.getAllTeams();
      setTeams(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreate = () => {
    setEditingTeam(null);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({ name: team.name });
    setIsModalOpen(true);
  };

  const handleDelete = async (team: Team) => {
    if (!window.confirm(`Are you sure you want to delete team "${team.name}"?`)) {
      return;
    }

    try {
      await TeamsService.deleteTeam(team.id);
      toast.success('Team deleted successfully');
      fetchTeams();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete team');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    try {
      if (editingTeam) {
        await TeamsService.updateTeam({
          ...editingTeam,
          ...formData,
        });
        toast.success('Team updated successfully');
      } else {
        await TeamsService.createTeam(formData);
        toast.success('Team created successfully');
      }
      setIsModalOpen(false);
      fetchTeams();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save team');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    {
      key: 'created_at',
      label: 'Created',
      render: (team: Team) => new Date(team.created_at).toLocaleString(),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchTeams} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Teams</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Create Team
        </button>
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
            <label htmlFor="name">Team Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter team name"
              required
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
    </div>
  );
};

export default Teams;
