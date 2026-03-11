import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, UserMinus, Check, X, Search, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'suggested'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([
    { id: 1, name: 'Jessica Brown', avatar: 'https://picsum.photos/seed/jessica/100/100', mutuals: 12 },
    { id: 2, name: 'Anthony Harris', avatar: 'https://picsum.photos/seed/anthony/100/100', mutuals: 5 },
    { id: 3, name: 'Olixja Martin', avatar: 'https://picsum.photos/seed/p3/100/100', mutuals: 8 },
    { id: 6, name: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/sarah/100/100', mutuals: 21 },
    { id: 7, name: 'David Wilson', avatar: 'https://picsum.photos/seed/david/100/100', mutuals: 3 },
  ]);

  const [requests, setRequests] = useState([
    { id: 4, name: 'Michael Scott', avatar: 'https://picsum.photos/seed/michael/100/100', mutuals: 2 },
    { id: 5, name: 'Pam Beesly', avatar: 'https://picsum.photos/seed/pam/100/100', mutuals: 15 },
  ]);

  const handleUnfriend = (id: number) => {
    setFriends(friends.filter(f => f.id !== id));
  };

  const handleAccept = (id: number) => {
    const request = requests.find(r => r.id === id);
    if (request) {
      setFriends([...friends, request]);
      setRequests(requests.filter(r => r.id !== id));
    }
  };

  const handleDecline = (id: number) => {
    setRequests(requests.filter(r => r.id !== id));
  };

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRequests = requests.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="lg:max-w-4xl lg:mx-auto p-0 lg:p-6 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 lg:px-0 pt-4 lg:pt-0">
        <h1 className="text-2xl font-black">Friends</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search friends..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all text-sm w-full md:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-8 px-4 lg:px-0">
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="All" count={filteredFriends.length} />
        <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} label="Requests" count={filteredRequests.length} />
        <TabButton active={activeTab === 'suggested'} onClick={() => setActiveTab('suggested')} label="Suggested" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4 px-2 lg:px-0">
        {activeTab === 'all' && (
          filteredFriends.length > 0 ? (
            filteredFriends.map(friend => (
              <FriendCard 
                key={friend.id} 
                friend={friend} 
                type="friend" 
                onAction={() => handleUnfriend(friend.id)} 
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center px-4">
              <p className="text-gray-500 text-sm">No friends found matching "{searchQuery}"</p>
            </div>
          )
        )}
        {activeTab === 'requests' && (
          filteredRequests.length > 0 ? (
            filteredRequests.map(request => (
              <FriendCard 
                key={request.id} 
                friend={request} 
                type="request" 
                onAction={(action) => action === 'accept' ? handleAccept(request.id) : handleDecline(request.id)} 
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center px-4">
              <p className="text-gray-500 text-sm">No friend requests found matching "{searchQuery}"</p>
            </div>
          )
        )}
        {activeTab === 'suggested' && friends.slice(0, 3).map(friend => (
          <FriendCard key={friend.id} friend={{...friend, id: friend.id + 10}} type="suggested" />
        ))}
      </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
        active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800"
      )}
    >
      {label}
      {count !== undefined && <span className={cn("px-1.5 py-0.5 rounded-md text-[10px]", active ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800 text-gray-400")}>{count}</span>}
    </button>
  );
}

interface FriendCardProps {
  key?: React.Key;
  friend: any;
  type: 'friend' | 'request' | 'suggested';
  onAction?: (action?: any) => void;
}

function FriendCard({ friend, type, onAction }: FriendCardProps) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center shadow-sm group relative"
    >
      <div className="relative mb-3">
        <img src={friend.avatar} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-transparent group-hover:border-indigo-500 transition-all" />
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-black rounded-full"></div>
      </div>
      
      <div className="mb-4 flex-1">
        <h3 className="font-bold text-xs sm:text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">{friend.name}</h3>
        <p className="text-[10px] text-gray-500">{friend.mutuals} mutual friends</p>
      </div>

      <div className="w-full space-y-2">
        {type === 'friend' && (
          <button 
            onClick={() => onAction?.()}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
          >
            <UserMinus size={14} />
            Unfriend
          </button>
        )}
        {type === 'request' && (
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => onAction?.('accept')}
              className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center"
            >
              <Check size={16} />
            </button>
            <button 
              onClick={() => onAction?.('decline')}
              className="bg-gray-100 dark:bg-gray-800 text-gray-500 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {type === 'suggested' && (
          <button className="w-full bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5">
            <UserPlus size={14} />
            Add
          </button>
        )}
      </div>
    </motion.div>
  );
}
