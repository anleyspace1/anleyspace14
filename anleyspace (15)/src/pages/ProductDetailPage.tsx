import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MapPin, 
  Coins, 
  ShieldCheck, 
  MessageCircle,
  ShoppingBag,
  ChevronRight,
  Star
} from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { MOCK_USER } from '../constants';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/marketplace/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct({
          ...data,
          seller: { username: data.seller_username }
        });
      }
    } catch (err) {
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const res = await fetch('/api/marketplace/products');
      if (res.ok) {
        const data = await res.json();
        const filtered = data
          .filter((p: any) => p.location === product?.location && p.id !== product?.id)
          .slice(0, 4);
        setRelatedProducts(filtered);
      }
    } catch (err) {
      console.error("Error fetching related products:", err);
    }
  };

  const handleBuy = async () => {
    if (!product) return;
    setBuying(true);
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
        alert('Purchase successful!');
        navigate('/marketplace');
      } else {
        const data = await res.json();
        alert(data.error || 'Purchase failed');
      }
    } catch (err) {
      console.error("Error buying product:", err);
      alert('Purchase failed');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <button 
          onClick={() => navigate('/marketplace')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-4 lg:p-6 pb-24"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-4 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold text-sm">Back to Marketplace</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Product Image Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 relative group shadow-sm">
            <img 
              src={product.image} 
              alt={product.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-600 dark:text-white hover:text-red-500 transition-colors shadow-md">
              <Heart size={20} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 cursor-pointer hover:opacity-80 transition-opacity shadow-sm">
                <img src={`https://picsum.photos/seed/prod${i}${product.id}/200/200`} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info Section */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-3xl">
                <Coins size={28} />
                <span>{product.price.toLocaleString()}</span>
              </div>
              <div 
                onClick={() => navigate(`/marketplace?location=${product.location}`)}
                className="flex items-center gap-1 text-gray-400 font-medium text-sm cursor-pointer hover:text-indigo-600 transition-colors group"
              >
                <MapPin size={16} className="group-hover:scale-110 transition-transform" />
                <span className="group-hover:underline">{product.location}</span>
              </div>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-black mb-3 leading-tight">{product.title}</h1>
            
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm mb-6">
              This is a premium modern sofa in excellent condition. Perfect for anyone looking for quality and value. Includes all original accessories and packaging.
            </p>

            {/* Map Preview Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</h4>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(product.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-indigo-600 font-bold hover:underline"
                >
                  Open in Maps
                </a>
              </div>
              <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 relative group">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(product.location)}`}
                  allowFullScreen
                  className="grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                ></iframe>
                {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <MapPin size={24} className="text-indigo-600 mb-2" />
                    <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{product.location}</p>
                    <p className="text-[8px] text-gray-400 mt-1">Map preview available in production</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Buyer Protection Card */}
              <div className="flex items-center gap-3 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-100">Buyer Protection</h4>
                  <p className="text-xs text-indigo-600/80">Your purchase is protected by AnleySpace</p>
                </div>
              </div>

              {/* Seller Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div 
                  onClick={() => navigate(`/profile/${product.seller.username}`)}
                  className="flex items-center gap-3 mb-4 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800">
                    <img src={`https://picsum.photos/seed/${product.seller.username}/100/100`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base group-hover:text-indigo-600 transition-colors">@{product.seller.username}</h4>
                    <div className="flex items-center gap-0.5 text-yellow-500">
                      <Star size={12} className="fill-current" />
                      <Star size={12} className="fill-current" />
                      <Star size={12} className="fill-current" />
                      <Star size={12} className="fill-current" />
                      <Star size={12} className="fill-current" />
                      <span className="text-[10px] text-gray-500 ml-1">(48 reviews)</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/messages?user=${product.seller.username}`)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800/50 py-3 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 text-sm"
                >
                  <MessageCircle size={18} />
                  Message
                </button>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <button 
              onClick={handleBuy}
              disabled={buying}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 active:scale-[0.98]"
            >
              <ShoppingBag size={20} />
              {buying ? 'Processing...' : `Buy Now for ${product.price.toLocaleString()} Coins`}
            </button>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black">More from this area</h2>
            <button 
              onClick={() => navigate(`/marketplace?location=${product.location}`)}
              className="text-sm text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              See all
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <div 
                key={p.id}
                onClick={() => navigate(`/marketplace/product/${p.id}`)}
                className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer group"
              >
                <div className="aspect-square overflow-hidden">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-sm truncate mb-1">{p.title}</h4>
                  <div className="flex items-center gap-1 text-indigo-600 font-black text-sm">
                    <Coins size={14} />
                    <span>{p.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
