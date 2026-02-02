import { useState, useEffect } from 'react';
import { RoomsService } from '../../apiConfig';
import type { Room, RoomInput } from '../../api';
import DataTable from '../../components/shared/DataTable';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import Modal from '../../components/shared/Modal';
import { toast } from 'react-toastify';
import '../teams/Teams.css';

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomInput>({ name: '', capacity: 0 });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RoomsService.getAllRooms();
      setRooms(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreate = () => {
    setEditingRoom(null);
    setFormData({ name: '', capacity: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({ name: room.name, capacity: room.capacity });
    setIsModalOpen(true);
  };

  const handleDelete = async (room: Room) => {
    if (!window.confirm(`Are you sure you want to delete room "${room.name}"?`)) {
      return;
    }

    try {
      await RoomsService.deleteRoom(room.id);
      toast.success('Room deleted successfully');
      fetchRooms();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete room');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Room name is required');
      return;
    }

    if (formData.capacity <= 0) {
      toast.error('Capacity must be greater than 0');
      return;
    }

    try {
      if (editingRoom) {
        await RoomsService.updateRoom({
          ...editingRoom,
          ...formData,
        });
        toast.success('Room updated successfully');
      } else {
        await RoomsService.createRoom(formData);
        toast.success('Room created successfully');
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save room');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'capacity', label: 'Capacity' },
    {
      key: 'created_at',
      label: 'Created',
      render: (room: Room) => new Date(room.created_at).toLocaleString(),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchRooms} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Rooms</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Create Room
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
            <label htmlFor="name">Room Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter room name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="capacity">Capacity *</label>
            <input
              type="number"
              id="capacity"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              placeholder="Enter room capacity"
              min="1"
              required
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
