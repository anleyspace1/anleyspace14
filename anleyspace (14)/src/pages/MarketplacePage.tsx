import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Heart, 
  MapPin, 
  Plus,
  ChevronRight,
  Coins,
  X,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_USER } from '../constants';
import { Product } from '../types';
import { cn } from '../lib/utils';

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const locationFilter = searchParams.get('location');

  const [products, setProducts] = useState<Product[]>([]);
  const [userCoins, setUserCoins] = useState(MOCK_USER.coins);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [buyStatus, setBuyStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchProducts();
    fetchUser();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/marketplace/products');
      const data = await res.json();
      setProducts(data.map((p: any) => ({
        ...p,
        seller: { username: p.seller_username }
      })));
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/user/${MOCK_USER.id}`);
      const data = await res.json();
      if (data.coins !== undefined) {
        setUserCoins(data.coins);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const categories = [
    { name: 'All', icon: '🛍️' },
    { name: 'Electronics', icon: '📱' },
    { name: 'Vehicles', icon: '🚗' },
    { name: 'Property', icon: '🏠' },
    { name: 'Apparel', icon: '👕' },
    { name: 'Home', icon: '🛋️' },
  ];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesLocation = !locationFilter || p.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const handleLocationClick = (location: string) => {
    setSearchParams({ location });
  };

  const clearLocationFilter = () => {
    setSearchParams({});
  };

  const handleBuy = async (product: Product) => {
    if (userCoins < product.price) {
      setBuyStatus('error');
      return;
    }

    setBuyStatus('processing');
    try {
      const res = await fetch('/api/marketplace/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: MOCK_USER.id,
          productId: product.id
        })
      });
      
      if (res.ok) {
        setBuyStatus('success');
        fetchUser();
        fetchProducts();
        setTimeout(() => {
          setIsBuyModalOpen(false);
          setBuyStatus('idle');
          setSelectedProduct(null);
        }, 2000);
      } else {
        setBuyStatus('error');
      }
    } catch (err) {
      console.error("Error buying product:", err);
      setBuyStatus('error');
    }
  };

  const handlePostProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      title: formData.get('title') as string,
      price: Number(formData.get('price')),
      category: formData.get('category') as string,
      location: formData.get('location') as string,
      image: `https://picsum.photos/seed/${Date.now()}/400/400`,
      sellerId: MOCK_USER.id
    };

    try {
      const res = await fetch('/api/marketplace/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchProducts();
        setIsPostModalOpen(false);
      }
    } catch (err) {
      console.error("Error posting product:", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto pb-12 overflow-x-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-4 lg:px-0 pt-4 lg:pt-0">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black mb-2 tracking-tight">Marketplace</h1>
          <div className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20 w-fit px-3 py-1 rounded-full text-sm">
            <Coins size={16} />
            <span>{userCoins.toLocaleString()} Coins Available</span>
          </div>
          {locationFilter && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-gray-500">Items in: <span className="font-bold text-indigo-600">{locationFilter}</span></span>
              <button 
                onClick={clearLocationFilter}
                className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search marketplace..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
            />
          </div>
          <button 
            onClick={() => setIsPostModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all whitespace-nowrap shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">List Item</span>
            <span className="sm:hidden">List</span>
          </button>
          <button className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar px-4 lg:px-0">
        {categories.map((cat) => (
          <button 
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap font-bold transition-all text-sm border-2",
              activeCategory === cat.name
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
            )}
          >
            <span className="text-lg">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 px-4 lg:px-0">
        {filteredProducts.map((product) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 group flex flex-col shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300"
          >
            <div 
              className="aspect-[1/1] relative overflow-hidden cursor-pointer"
              onClick={() => navigate(`/marketplace/product/${product.id}`)}
            >
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="w-9 h-9 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-600 dark:text-white hover:text-red-500 transition-colors shadow-md"
                >
                  <Heart size={16} />
                </button>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">
                {product.category}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex flex-col mb-3">
                <h3 
                  className="font-bold text-base leading-tight cursor-pointer hover:text-indigo-600 transition-colors line-clamp-1 mb-1"
                  onClick={() => navigate(`/marketplace/product/${product.id}`)}
                >
                  {product.title}
                </h3>
                <div className="flex items-center gap-1.5 text-indigo-600 font-black text-lg">
                  <Coins size={16} />
                  <span>{product.price.toLocaleString()}</span>
                </div>
              </div>
              
              <div 
                className="flex items-center gap-1.5 text-gray-400 text-xs mb-4 cursor-pointer hover:text-indigo-600 transition-colors w-fit font-medium"
                onClick={() => handleLocationClick(product.location)}
              >
                <MapPin size={12} />
                <span className="truncate">{product.location.split(',')[0]}</span>
              </div>
              
              <div className="mt-auto">
                <button 
                  onClick={() => {
                    setSelectedProduct(product);
                    setIsBuyModalOpen(true);
                  }}
                  className="w-full bg-indigo-600 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/10"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Post Product Modal */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPostModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Post Product</h2>
                <button onClick={() => setIsPostModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handlePostProduct} className="space-y-4">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 cursor-pointer hover:border-indigo-500 transition-colors">
                  <Camera size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-500">Add Product Photos</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
                    <input 
                      name="title"
                      required
                      placeholder="What are you selling?"
                      className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Price (Coins)</label>
                      <div className="relative">
                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
                        <input 
                          name="price"
                          type="number"
                          required
                          placeholder="0"
                          className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Category</label>
                      <select 
                        name="category"
                        className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                      >
                        {categories.filter(c => c.name !== 'All').map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Location</label>
                    <input 
                      name="location"
                      required
                      placeholder="e.g. San Francisco, CA"
                      className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all mt-4 shadow-lg shadow-indigo-500/20"
                >
                  Post Item
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Buy Confirmation Modal */}
      <AnimatePresence>
        {isBuyModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => buyStatus === 'idle' && setIsBuyModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 p-8 text-center"
            >
              {buyStatus === 'idle' && (
                <>
                  <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="text-indigo-600" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Confirm Purchase</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Are you sure you want to buy <span className="font-bold text-gray-900 dark:text-white">{selectedProduct.title}</span>?
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500">Price</span>
                      <div className="flex items-center gap-1 font-bold text-indigo-600">
                        <Coins size={16} />
                        <span>{selectedProduct.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500">Your Balance</span>
                      <div className="flex items-center gap-1 font-bold">
                        <Coins size={16} />
                        <span>{userCoins.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsBuyModalOpen(false)}
                      className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleBuy(selectedProduct)}
                      className="flex-1 py-4 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Confirm
                    </button>
                  </div>
                </>
              )}

              {buyStatus === 'processing' && (
                <div className="py-12">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <h2 className="text-2xl font-bold mb-2">Processing...</h2>
                  <p className="text-gray-500">Securing your item</p>
                </div>
              )}

              {buyStatus === 'success' && (
                <div className="py-12">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="text-green-600" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Purchase Successful!</h2>
                  <p className="text-gray-500">The item is now yours</p>
                </div>
              )}

              {buyStatus === 'error' && (
                <div className="py-12">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="text-red-600" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Insufficient Coins</h2>
                  <p className="text-gray-500 mb-8">You need more coins to complete this purchase.</p>
                  <button 
                    onClick={() => setIsBuyModalOpen(false)}
                    className="w-full py-4 rounded-2xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

