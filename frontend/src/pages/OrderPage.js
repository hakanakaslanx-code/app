import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ShoppingCart, Plus, Minus, X, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrderPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { cart, tableInfo, setTableInfo, addToCart, getTotal, getItemCount } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showTablePicker, setShowTablePicker] = useState(false);
  
  // Item modal state
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState([]);

  const toTestId = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, settingsRes, tablesRes] = await Promise.all([
          axios.get(`${API}/menu`),
          axios.get(`${API}/settings`),
          axios.get(`${API}/tables`)
        ]);
        
        setCategories(menuRes.data.categories);
        setMenuItems(menuRes.data.items);
        setSettings(settingsRes.data);
        setTables(tablesRes.data);
        
        if (menuRes.data.categories.length > 0) {
          setActiveCategory(menuRes.data.categories[0].id);
        }
        
        // Handle table from URL param
        const tableParam = searchParams.get('table');
        if (tableParam && !tableInfo) {
          const table = tablesRes.data.find(t => t.number === parseInt(tableParam));
          if (table) {
            setTableInfo({ id: table.id, number: table.number, label: table.label });
          } else {
            setShowTablePicker(true);
          }
        } else if (!tableInfo) {
          setShowTablePicker(true);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [searchParams, tableInfo, setTableInfo]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    } else if (activeCategory) {
      items = items.filter(item => item.categoryId === activeCategory);
    }
    
    return items;
  }, [menuItems, activeCategory, searchQuery]);

  const handleSelectTable = (table) => {
    setTableInfo({ id: table.id, number: table.number, label: table.label });
    setShowTablePicker(false);
    toast.success(`Table ${table.number} selected`);
  };

  const openItemModal = (item) => {
    setSelectedItem(item);
    setQuantity(1);
    setNotes('');
    setSelectedModifiers([]);
  };

  const closeItemModal = () => {
    setSelectedItem(null);
    setQuantity(1);
    setNotes('');
    setSelectedModifiers([]);
  };

  const handleModifierToggle = (modifier, option) => {
    setSelectedModifiers(prev => {
      const existingIndex = prev.findIndex(m => m.modifierName === modifier.name);
      
      if (existingIndex > -1) {
        // Replace existing selection for this modifier
        const updated = [...prev];
        updated[existingIndex] = { modifierName: modifier.name, ...option };
        return updated;
      }
      
      return [...prev, { modifierName: modifier.name, ...option }];
    });
  };

  const handleAddToCart = () => {
    if (!tableInfo) {
      setShowTablePicker(true);
      toast.error('Please select a table first');
      return;
    }
    
    addToCart(selectedItem, quantity, notes, selectedModifiers);
    toast.success(`${selectedItem.name} added to cart`);
    closeItemModal();
  };

  const formatPrice = (price) => {
    return `${settings?.currency || '$'}${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="glass sticky top-0 z-40 border-b border-gray-100 px-4 py-3">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
        <div className="p-4">
          <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" data-testid="order-page">
      {/* Header */}
      <div className="glass sticky top-0 z-40 border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {settings?.restaurantName || 'Café Delight'}
              </h1>
              <p className="text-sm text-gray-500">{settings?.openHours}</p>
            </div>
            {tableInfo && (
              <button 
                onClick={() => setShowTablePicker(true)}
                className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors"
                data-testid="table-selector-btn"
              >
                <MapPin className="w-4 h-4" />
                Table {tableInfo.number}
              </button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 bg-gray-100 border-none rounded-full focus-visible:ring-orange-500"
              data-testid="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                data-testid="search-clear-btn"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* Categories */}
        {!searchQuery && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
                }`}
                data-testid={`category-${category.id}`}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="p-4">
        {searchQuery && (
          <p className="text-sm text-gray-500 mb-4">
            {filteredItems.length} results for "{searchQuery}"
          </p>
        )}
        
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => openItemModal(item)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all text-left group"
                data-testid={`menu-item-${item.id}`}
              >
                {item.imageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {item.name}
                    </h3>
                    <span className="text-orange-600 font-bold whitespace-nowrap">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                  )}
                  {item.allergens?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {item.allergens.map(allergen => (
                        <Badge key={allergen} variant="secondary" className="text-xs capitalize">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-gray-100 z-50">
          <Button
            onClick={() => navigate('/cart')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full py-6 text-lg font-semibold shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all"
            data-testid="view-cart-btn"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            View Cart ({getItemCount()}) • {formatPrice(getTotal())}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => closeItemModal()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0">
          {selectedItem && (
            <>
              {selectedItem.imageUrl && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {selectedItem.name}
                  </DialogTitle>
                </DialogHeader>
                
                {selectedItem.description && (
                  <p className="text-gray-600 mt-2">{selectedItem.description}</p>
                )}
                
                <p className="text-2xl font-bold text-orange-600 mt-4">
                  {formatPrice(selectedItem.price)}
                </p>
                
                {selectedItem.allergens?.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-4">
                    {selectedItem.allergens.map(allergen => (
                      <Badge key={allergen} variant="secondary" className="capitalize">
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Modifiers */}
                {selectedItem.modifiers?.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {selectedItem.modifiers.map((modifier, idx) => (
                      <div key={idx}>
                        <h4 className="font-semibold text-gray-900 mb-2">{modifier.name}</h4>
                        <div className="space-y-2">
                          {modifier.options?.map((option, optIdx) => (
                            <label
                              key={optIdx}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                              data-testid={`modifier-option-${toTestId(modifier.name)}-${toTestId(option.label)}`}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedModifiers.some(
                                    m => m.modifierName === modifier.name && m.label === option.label
                                  )}
                                  onCheckedChange={() => handleModifierToggle(modifier, option)}
                                  data-testid={`modifier-checkbox-${toTestId(modifier.name)}-${toTestId(option.label)}`}
                                />
                                <span className="text-gray-700">{option.label}</span>
                              </div>
                              {option.price > 0 && (
                                <span className="text-gray-500">+{formatPrice(option.price)}</span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Notes */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special instructions
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., no onions, extra sauce..."
                    className="resize-none"
                    rows={2}
                    data-testid="item-notes-input"
                  />
                </div>
                
                {/* Quantity and Add to Cart */}
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                      data-testid="quantity-decrease-btn"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-8 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                      data-testid="quantity-increase-btn"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full py-6 font-semibold active:scale-[0.98] transition-all"
                    data-testid="add-to-cart-btn"
                  >
                    Add to Cart • {formatPrice(
                      (selectedItem.price + selectedModifiers.reduce((sum, m) => sum + (m.price || 0), 0)) * quantity
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Table Picker Modal */}
      <Dialog open={showTablePicker} onOpenChange={setShowTablePicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>Select Your Table</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className={`p-4 rounded-xl border-2 text-center font-semibold transition-all hover:border-orange-500 hover:bg-orange-50 ${
                  tableInfo?.id === table.id
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-200 text-gray-700'
                }`}
                data-testid={`table-${table.number}`}
              >
                {table.number}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderPage;
