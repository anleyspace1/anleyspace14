import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Type, 
  Sticker, 
  Smile, 
  Download, 
  Send,
  Heart
} from 'lucide-react';

interface StoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    image: string;
    user: {
      username: string;
      avatar: string;
    };
  };
}

export default function StoryEditor({ isOpen, onClose, content }: StoryEditorProps) {
  const [text, setText] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      alert('Published to your story!');
      setIsPublishing(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full h-full max-w-md md:h-[90vh] md:rounded-3xl overflow-hidden bg-gray-900 shadow-2xl flex flex-col"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img src={content.image} alt="" className="w-full h-full object-cover blur-md opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 flex items-center justify-between text-white">
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Type size={20} /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Sticker size={20} /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Smile size={20} /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Download size={20} /></button>
              </div>
            </div>

            {/* Content Preview */}
            <div className="relative flex-1 flex items-center justify-center p-8">
              <div className="relative w-full aspect-[9/16] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                <img src={content.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/20 backdrop-blur-md p-2 rounded-full">
                  <img src={content.user.avatar} alt="" className="w-6 h-6 rounded-full border border-white/20" />
                  <span className="text-white text-[10px] font-bold">@{content.user.username}</span>
                </div>
              </div>

              {/* Editable Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white/90 text-black px-4 py-2 rounded-lg font-bold text-xl shadow-xl pointer-events-auto"
                >
                  <input 
                    type="text" 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Add text..."
                    className="bg-transparent border-none focus:ring-0 text-center placeholder:text-black/30"
                  />
                </motion.div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 p-6 flex items-center justify-between gap-4">
              <button 
                onClick={onClose}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-2xl font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    <span>Share to Story</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
