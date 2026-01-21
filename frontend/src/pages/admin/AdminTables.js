import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, QrCode, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminTables = () => {
  const { getAuthHeader } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableForm, setTableForm] = useState({ number: '', label: '', active: true });
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API}/admin/tables`, getAuthHeader());
      setTables(response.data);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const openModal = (table = null) => {
    if (table) {
      setEditingTable(table);
      setTableForm({ number: table.number.toString(), label: table.label || '', active: table.active });
    } else {
      setEditingTable(null);
      const nextNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1;
      setTableForm({ number: nextNumber.toString(), label: '', active: true });
    }
    setShowModal(true);
  };

  const saveTable = async () => {
    if (!tableForm.number) {
      toast.error('Table number is required');
      return;
    }

    const data = {
      number: parseInt(tableForm.number),
      label: tableForm.label || null,
      active: tableForm.active
    };

    try {
      if (editingTable) {
        await axios.put(`${API}/admin/tables/${editingTable.id}`, data, getAuthHeader());
        toast.success('Table updated');
      } else {
        await axios.post(`${API}/admin/tables`, data, getAuthHeader());
        toast.success('Table created');
      }
      setShowModal(false);
      fetchTables();
    } catch (error) {
      console.error('Failed to save table:', error);
      toast.error('Failed to save table');
    }
  };

  const deleteTable = async (tableId) => {
    if (!window.confirm('Delete this table?')) return;

    try {
      await axios.delete(`${API}/admin/tables/${tableId}`, getAuthHeader());
      toast.success('Table deleted');
      fetchTables();
    } catch (error) {
      console.error('Failed to delete table:', error);
      toast.error('Failed to delete table');
    }
  };

  const toggleTableActive = async (table) => {
    try {
      await axios.put(
        `${API}/admin/tables/${table.id}`,
        { ...table, active: !table.active },
        getAuthHeader()
      );
      fetchTables();
      toast.success(table.active ? 'Table deactivated' : 'Table activated');
    } catch (error) {
      console.error('Failed to toggle table:', error);
      toast.error('Failed to update table');
    }
  };

  const showQrCode = (table) => {
    setSelectedTable(table);
    setShowQrModal(true);
  };

  const getQrUrl = (tableNumber) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/order?table=${tableNumber}`;
  };

  if (loading) {
    return (
      <div className="p-6" data-testid="admin-tables-loading">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="admin-tables-page">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Table Management
          </h1>
          <p className="text-gray-500">Manage restaurant tables and QR codes</p>
        </div>
        <Button
          onClick={() => openModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
          data-testid="add-table-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Table
        </Button>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-500">No tables yet. Add your first table!</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {tables.map(table => (
            <div
              key={table.id}
              className={`bg-white rounded-xl border shadow-sm p-4 text-center group hover:shadow-md transition-all ${
                table.active ? 'border-gray-100' : 'border-red-200 bg-red-50'
              }`}
              data-testid={`table-card-${table.id}`}
            >
              <div className="text-3xl font-bold text-gray-900 mb-1">{table.number}</div>
              {table.label && <p className="text-xs text-gray-500 truncate">{table.label}</p>}
              
              <div className="flex justify-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => showQrCode(table)}
                  className="p-1.5 hover:bg-gray-100 rounded"
                  title="Show QR Code"
                  data-testid={`qr-table-${table.id}`}
                >
                  <QrCode className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => openModal(table)}
                  className="p-1.5 hover:bg-gray-100 rounded"
                  title="Edit"
                  data-testid={`edit-table-${table.id}`}
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => deleteTable(table.id)}
                  className="p-1.5 hover:bg-red-50 rounded"
                  title="Delete"
                  data-testid={`delete-table-${table.id}`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Table Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? 'Edit Table' : 'Add Table'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Table Number</Label>
              <Input
                type="number"
                value={tableForm.number}
                onChange={(e) => setTableForm({ ...tableForm, number: e.target.value })}
                placeholder="1"
                data-testid="table-number-input"
              />
            </div>
            <div>
              <Label>Label (optional)</Label>
              <Input
                value={tableForm.label}
                onChange={(e) => setTableForm({ ...tableForm, label: e.target.value })}
                placeholder="e.g., Patio, Window Seat"
                data-testid="table-label-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={tableForm.active}
                onCheckedChange={(checked) => setTableForm({ ...tableForm, active: checked })}
                data-testid="table-active-switch"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              data-testid="cancel-table-btn"
            >
              Cancel
            </Button>
            <Button onClick={saveTable} className="bg-orange-500 hover:bg-orange-600" data-testid="save-table-btn">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code for Table {selectedTable?.number}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              {/* QR Code Placeholder - In production, use a QR library */}
              <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <QrCode className="w-24 h-24 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-2">Scan to order from Table {selectedTable?.number}</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                {selectedTable && getQrUrl(selectedTable.number)}
              </code>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Generate QR code using any QR generator with the URL above.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(getQrUrl(selectedTable?.number));
                toast.success('URL copied to clipboard');
              }}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="copy-qr-url-btn"
            >
              Copy URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTables;
