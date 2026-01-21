import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, ImageIcon, X, GripVertical, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminMenu = () => {
  const { getAuthHeader } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState(null);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', sortOrder: 0, icon: '' });
  const [itemForm, setItemForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
    allergens: [],
    sortOrder: 0
  });

  const fetchData = async () => {
    try {
      const [menuRes, settingsRes] = await Promise.all([
        axios.get(`${API}/menu/all`),
        axios.get(`${API}/settings`)
      ]);
      setCategories(menuRes.data.categories);
      setMenuItems(menuRes.data.items);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatPrice = (price) => {
    return `${settings?.currency || '$'}${parseFloat(price).toFixed(2)}`;
  };

  // Category handlers
  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, sortOrder: category.sortOrder, icon: category.icon || '' });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', sortOrder: categories.length, icon: '' });
    }
    setShowCategoryModal(true);
  };

  const saveCategoryHandler = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await axios.put(
          `${API}/admin/categories/${editingCategory.id}`,
          categoryForm,
          getAuthHeader()
        );
        toast.success('Category updated');
      } else {
        await axios.post(`${API}/admin/categories`, categoryForm, getAuthHeader());
        toast.success('Category created');
      }
      setShowCategoryModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error('Failed to save category');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? Items in this category will not be deleted.')) return;

    try {
      await axios.delete(`${API}/admin/categories/${categoryId}`, getAuthHeader());
      toast.success('Category deleted');
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Menu item handlers
  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        imageUrl: item.imageUrl || '',
        isAvailable: item.isAvailable,
        allergens: item.allergens || [],
        sortOrder: item.sortOrder || 0
      });
    } else {
      setEditingItem(null);
      setItemForm({
        categoryId: categories[0]?.id || '',
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        isAvailable: true,
        allergens: [],
        sortOrder: menuItems.length
      });
    }
    setShowItemModal(true);
  };

  const saveItemHandler = async () => {
    if (!itemForm.name.trim() || !itemForm.price || !itemForm.categoryId) {
      toast.error('Name, price and category are required');
      return;
    }

    const data = {
      ...itemForm,
      price: parseFloat(itemForm.price),
      sortOrder: parseInt(itemForm.sortOrder) || 0
    };

    try {
      if (editingItem) {
        await axios.put(
          `${API}/admin/menu-items/${editingItem.id}`,
          data,
          getAuthHeader()
        );
        toast.success('Menu item updated');
      } else {
        await axios.post(`${API}/admin/menu-items`, data, getAuthHeader());
        toast.success('Menu item created');
      }
      setShowItemModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save item:', error);
      toast.error('Failed to save menu item');
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Delete this menu item?')) return;

    try {
      await axios.delete(`${API}/admin/menu-items/${itemId}`, getAuthHeader());
      toast.success('Menu item deleted');
      fetchData();
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const toggleItemAvailability = async (item) => {
    try {
      await axios.put(
        `${API}/admin/menu-items/${item.id}`,
        { ...item, isAvailable: !item.isAvailable },
        getAuthHeader()
      );
      fetchData();
      toast.success(item.isAvailable ? 'Item marked as sold out' : 'Item marked as available');
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      toast.error('Failed to update item');
    }
  };

  const ALLERGEN_OPTIONS = ['gluten', 'dairy', 'eggs', 'nuts', 'soy', 'fish', 'shellfish'];

  if (loading) {
    return (
      <div className="p-6" data-testid="admin-menu-loading">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="admin-menu-page">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Menu Management
          </h1>
          <p className="text-gray-500">Manage categories and menu items</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => openCategoryModal()}
            className="rounded-full"
            data-testid="add-category-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
          <Button
            onClick={() => openItemModal()}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
            data-testid="add-item-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
        {categories.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-500">No categories yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map(category => (
              <div
                key={category.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 group hover:shadow-md transition-all"
                data-testid={`category-card-${category.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{category.icon || '📁'}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openCategoryModal(category)}
                      className="p-1 hover:bg-gray-100 rounded"
                      data-testid={`edit-category-${category.id}`}
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="p-1 hover:bg-red-50 rounded"
                      data-testid={`delete-category-${category.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <p className="font-medium text-gray-900 text-sm">{category.name}</p>
                <p className="text-xs text-gray-500">
                  {menuItems.filter(i => i.categoryId === category.id).length} items
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Menu Items Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Items</h2>
        {menuItems.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-500">No menu items yet. Add your first item!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {menuItems.map(item => {
                const category = categories.find(c => c.id === item.categoryId);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center p-4 gap-4 hover:bg-gray-50 transition-colors ${
                      !item.isAvailable ? 'opacity-60' : ''
                    }`}
                    data-testid={`menu-item-row-${item.id}`}
                  >
                    {/* Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        {!item.isAvailable && (
                          <Badge variant="secondary" className="text-xs">Sold Out</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{category?.name || 'Unknown'}</Badge>
                        {item.allergens?.map(a => (
                          <Badge key={a} variant="secondary" className="text-xs capitalize">{a}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">{formatPrice(item.price)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.isAvailable}
                        onCheckedChange={() => toggleItemAvailability(item)}
                        data-testid={`toggle-availability-${item.id}`}
                      />
                      <button
                        onClick={() => openItemModal(item)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        data-testid={`edit-item-${item.id}`}
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        data-testid={`delete-item-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Category name"
                data-testid="category-name-input"
              />
            </div>
            <div>
              <Label>Icon (emoji)</Label>
              <Input
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                placeholder="🍔"
                data-testid="category-icon-input"
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={categoryForm.sortOrder}
                onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                data-testid="category-sort-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCategoryModal(false)}
              data-testid="cancel-category-btn"
            >
              Cancel
            </Button>
            <Button onClick={saveCategoryHandler} className="bg-orange-500 hover:bg-orange-600" data-testid="save-category-btn">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu Item Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Category</Label>
              <Select
                value={itemForm.categoryId}
                onValueChange={(value) => setItemForm({ ...itemForm, categoryId: value })}
              >
                <SelectTrigger data-testid="item-category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      data-testid={`item-category-${cat.id}`}
                    >
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="Item name"
                data-testid="item-name-input"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Brief description"
                rows={2}
                data-testid="item-description-input"
              />
            </div>
            <div>
              <Label>Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                placeholder="0.00"
                data-testid="item-price-input"
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={itemForm.imageUrl}
                onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                placeholder="https://..."
                data-testid="item-image-input"
              />
              {itemForm.imageUrl && (
                <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden">
                  <img src={itemForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <Label>Allergens</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALLERGEN_OPTIONS.map(allergen => (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => {
                      setItemForm(prev => ({
                        ...prev,
                        allergens: prev.allergens.includes(allergen)
                          ? prev.allergens.filter(a => a !== allergen)
                          : [...prev.allergens, allergen]
                      }));
                    }}
                    className={`px-3 py-1 rounded-full text-sm capitalize transition-all ${
                      itemForm.allergens.includes(allergen)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    data-testid={`allergen-${allergen}`}
                  >
                    {allergen}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Available</Label>
              <Switch
                checked={itemForm.isAvailable}
                onCheckedChange={(checked) => setItemForm({ ...itemForm, isAvailable: checked })}
                data-testid="item-available-switch"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowItemModal(false)}
              data-testid="cancel-item-btn"
            >
              Cancel
            </Button>
            <Button onClick={saveItemHandler} className="bg-orange-500 hover:bg-orange-600" data-testid="save-item-btn">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMenu;
