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
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomInput>({ label: '', max_size: 0 });
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMaxSize, setBulkMaxSize] = useState(30);

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
    setFormData({ label: '', max_size: 30 });
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
      await RoomsService.deleteRoom({ id: room.id });
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
        await RoomsService.updateRoom({ id: editingRoom.id, requestBody: formData });
        toast.success('Room updated successfully');
      } else {
        await RoomsService.createRoom({ requestBody: formData });
        toast.success('Room created successfully');
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save room';
      toast.error(message);
    }
  };

  const handleBulkCreate = () => {
    setBulkInput('');
    setBulkMaxSize(30);
    setIsBulkModalOpen(true);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const labels = bulkInput
      .split(',')
      .map(label => label.trim())
      .filter(label => label.length > 0);

    if (labels.length === 0) {
      toast.warning('Please enter at least one room label');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const label of labels) {
      try {
        await RoomsService.createRoom({ requestBody: { label, max_size: bulkMaxSize } });
        successCount++;
      } catch (err) {
        errorCount++;
        const message = err instanceof Error ? err.message : 'Failed to create room';
        toast.error(`Failed to create "${label}": ${message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully created ${successCount} room(s)`);
      fetchRooms();
      setBulkInput('');
    }

    if (errorCount === 0) {
      // Keep modal open for continuous adding
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleCreate} className="btn btn-primary">
            Create Room
          </button>
          <button onClick={handleBulkCreate} className="btn btn-primary">
            Bulk Create
          </button>
        </div>
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

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Create Rooms"
      >
        <form onSubmit={handleBulkSubmit} className="form">
          <div className="form-group">
            <label htmlFor="bulkMaxSize">Default Max Size</label>
            <input
              type="number"
              id="bulkMaxSize"
              value={bulkMaxSize}
              onChange={(e) => setBulkMaxSize(parseInt(e.target.value, 10) || 30)}
              required
              min="1"
              className="form-input"
            />
            <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
              This max size will be applied to all rooms created in this batch.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="bulkInput">
              Room Labels (comma-separated)
            </label>
            <textarea
              id="bulkInput"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="e.g., Room A, Room B, Room C"
              rows={5}
              className="form-input"
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
            <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
              Enter room labels separated by commas. The modal will stay open so you can add more.
            </small>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsBulkModalOpen(false)} className="btn btn-secondary">
              Close
            </button>
            <button type="submit" className="btn btn-primary">
              Create Rooms
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Rooms;
