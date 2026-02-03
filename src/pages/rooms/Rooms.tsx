import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RoomsService, type Room, type RoomInput } from '../../apiConfig';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import '../teams/Teams.css';

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomInput>({ label: '', max_size: 0 });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RoomsService.getAllRooms();
      setRooms(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rooms';
      setError(message);
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreate = () => {
    setEditingRoom(null);
    setFormData({ label: '', max_size: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({ label: room.label, max_size: room.max_size });
    setIsModalOpen(true);
  };

  const handleDelete = async (room: Room) => {
    if (!window.confirm(`Are you sure you want to delete "${room.label}"?`)) {
      return;
    }

    try {
      await RoomsService.deleteRoom(room.id);
      toast.success('Room deleted successfully');
      fetchRooms();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete room';
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRoom) {
        await RoomsService.updateRoom(editingRoom.id, formData);
        toast.success('Room updated successfully');
      } else {
        await RoomsService.createRoom(formData);
        toast.success('Room created successfully');
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save room';
      toast.error(message);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'label', label: 'Label' },
    { key: 'max_size', label: 'Max Size' },
    {
      key: 'created_at',
      label: 'Created At',
      render: (room: Room) => new Date(room.created_at).toLocaleString(),
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      render: (room: Room) => new Date(room.updated_at).toLocaleString(),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchRooms} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Rooms</h1>
        <button onClick={handleCreate} className="btn btn-primary">
          Create Room
        </button>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Edit Room' : 'Create Room'}
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

          <div className="form-group">
            <label htmlFor="max_size">Max Size</label>
            <input
              type="number"
              id="max_size"
              value={formData.max_size}
              onChange={(e) => setFormData({ ...formData, max_size: parseInt(e.target.value) })}
              required
              min="1"
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingRoom ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Rooms;
