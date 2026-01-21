import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Database, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminSettings = () => {
  const { getAuthHeader } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [settings, setSettings] = useState({
    restaurantName: '',
    currency: '$',
    taxRate: 0.08,
    serviceFee: 0,
    openHours: '',
    logoUrl: '',
    bannerText: ''
  });

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings`, getAuthHeader());
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/settings`, settings, getAuthHeader());
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const seedDatabase = async () => {
    if (!window.confirm('This will replace all existing data with sample data. Continue?')) return;
    
    setSeeding(true);
    try {
      const response = await axios.post(`${API}/admin/seed`, {}, getAuthHeader());
      toast.success(`Database seeded: ${response.data.tables} tables, ${response.data.categories} categories, ${response.data.menuItems} items`);
    } catch (error) {
      console.error('Failed to seed database:', error);
      toast.error('Failed to seed database');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6" data-testid="admin-settings-loading">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="max-w-xl space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="admin-settings-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Restaurant Settings
        </h1>
        <p className="text-gray-500">Configure your restaurant details</p>
      </div>

      <div className="max-w-xl">
        {/* Settings Form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <Label htmlFor="restaurantName">Restaurant Name</Label>
            <Input
              id="restaurantName"
              value={settings.restaurantName}
              onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
              placeholder="Your Restaurant Name"
              className="mt-1"
              data-testid="restaurant-name-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Currency Symbol</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="$"
                className="mt-1"
                data-testid="currency-input"
              />
            </div>
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={(settings.taxRate * 100).toFixed(0)}
                onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) / 100 || 0 })}
                placeholder="8"
                className="mt-1"
                data-testid="tax-rate-input"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="serviceFee">Service Fee ($)</Label>
            <Input
              id="serviceFee"
              type="number"
              step="0.01"
              value={settings.serviceFee}
              onChange={(e) => setSettings({ ...settings, serviceFee: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="mt-1"
              data-testid="service-fee-input"
            />
          </div>

          <div>
            <Label htmlFor="openHours">Open Hours</Label>
            <Input
              id="openHours"
              value={settings.openHours}
              onChange={(e) => setSettings({ ...settings, openHours: e.target.value })}
              placeholder="8:00 AM - 10:00 PM"
              className="mt-1"
              data-testid="open-hours-input"
            />
          </div>

          <div>
            <Label htmlFor="bannerText">Banner Text</Label>
            <Input
              id="bannerText"
              value={settings.bannerText}
              onChange={(e) => setSettings({ ...settings, bannerText: e.target.value })}
              placeholder="Welcome! Scan QR to order"
              className="mt-1"
              data-testid="banner-text-input"
            />
          </div>

          <div>
            <Label htmlFor="logoUrl">Logo URL (optional)</Label>
            <Input
              id="logoUrl"
              value={settings.logoUrl}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
              placeholder="https://..."
              className="mt-1"
              data-testid="logo-url-input"
            />
          </div>

          <Button
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full py-3"
            data-testid="save-settings-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Seed Database Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-2">Demo Data</h3>
          <p className="text-sm text-gray-500 mb-4">
            Populate your database with sample categories, menu items, and tables for testing.
          </p>
          <Button
            onClick={seedDatabase}
            disabled={seeding}
            variant="outline"
            className="w-full rounded-full"
            data-testid="seed-database-btn"
          >
            <Database className="w-4 h-4 mr-2" />
            {seeding ? 'Seeding...' : 'Seed Demo Data'}
          </Button>
        </div>

        {/* QR Code Info */}
        <div className="bg-orange-50 rounded-xl border border-orange-100 p-6 mt-6">
          <h3 className="font-semibold text-orange-900 mb-2">QR Code Setup</h3>
          <p className="text-sm text-orange-700 mb-3">
            Generate QR codes pointing to your order page with the table number in the URL:
          </p>
          <code className="block text-xs bg-white px-3 py-2 rounded-lg border border-orange-200 text-orange-800">
            {window.location.origin}/order?table=[TABLE_NUMBER]
          </code>
          <p className="text-xs text-orange-600 mt-2">
            Example: /order?table=12 for Table 12
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
