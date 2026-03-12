import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, UserMinus, Check, X, Search, MoreHorizontal, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'suggested'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchRequests();
      fetchSuggested();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() && activeTab === 'suggested') {
      searchNewPeople();
    }
  }, [searchQuery, activeTab]);

  const fetchFriends = async () => {
    if (!user) return;
    try {
      // In this app, friends are mutual follows
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles:following_id (
            id,
            username,
            display_name,
            avatar_url,
            followers_count
          )
        `)
        .eq('follower_id', user.id);
      
      if (error) throw error;
      setFriends(data.map(f => f.profiles));
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    // Mock requests for now as we don't have a separate requests table
    setRequests([
      { id: 'r1', username: 'michael_s', display_name: 'Michael Scott', avatar_url: 'https://picsum.photos/seed/michael/100/100', followers_count: 150 },
      { id: 'r2', username: 'pam_b', display_name: 'Pam Beesly', avatar_url: 'https://picsum.photos/seed/pam/100/100', followers_count: 240 },
    ]);
  };

  const fetchSuggested = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(8);
      
      if (error) throw error;
      setSuggested(data);
    } catch (err) {
      console.error('Error fetching suggested:', err);
    }
  };

  const searchNewPeople = async () => {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user?.id)
        .limit(10);
      
      if (error) throw error;
      setSuggested(data || []);
    } catch (err) {
      console.error('Error searching people:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleFollow = async (creatorId: string) => {
    if (!user) return;
    const wasFollowing = following[creatorId];
    setFollowing(prev => ({ ...prev, [creatorId]: !wasFollowing }));

    try {
      if (wasFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', creatorId);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: creatorId });
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      setFollowing(prev => ({ ...prev, [creatorId]: wasFollowing }));
    }
  };

  const handleUnfriend = async (id: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to unfollow this user?')) {
      try {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', id);
        setFriends(friends.filter(f => f.id !== id));
      } catch (err) {
        console.error('Error unfollowing:', err);
      }
    }
  };

  const handleAccept = (id: string) => {
    setRequests(requests.filter(r => r.id !== id));
    alert('Friend request accepted!');
  };

  const handleDecline = (id: string) => {
    setRequests(requests.filter(r => r.id !== id));
  };

  const filteredFriends = friends.filter(f => 
    (f.display_name || f.username).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRequests = requests.filter(r => 
    (r.display_name || r.username).toLowerCase().includes(searchQuery.toLowerCase())
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
          loading ? (
            <div className="col-span-full py-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
          ) : filteredFriends.length > 0 ? (
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
        {activeTab === 'suggested' && (
          searching ? (
            <div className="col-span-full py-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
          ) : suggested.map(person => (
            <FriendCard 
              key={person.id} 
              friend={person} 
              type="suggested" 
              isFollowing={following[person.id]}
              onAction={() => handleFollow(person.id)}
            />
          ))
        )}
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
  isFollowing?: boolean;
  onAction?: (action?: any) => void;
}

function FriendCard({ friend, type, isFollowing, onAction }: FriendCardProps) {
  const navigate = useNavigate();
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center shadow-sm group relative"
    >
      <div 
        className="relative mb-3 cursor-pointer"
        onClick={() => navigate(`/profile/${friend.username}`)}
      >
        <img src={friend.avatar_url || `https://picsum.photos/seed/${friend.id}/100/100`} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-transparent group-hover:border-indigo-500 transition-all" />
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-black rounded-full"></div>
      </div>
      
      <div className="mb-4 flex-1">
        <h3 className="font-bold text-xs sm:text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
          {friend.display_name || friend.username}
        </h3>
        <p className="text-[10px] text-gray-500">{friend.followers_count || 0} followers</p>
      </div>

      <div className="w-full space-y-2">
        {type === 'friend' && (
          <button 
            onClick={() => onAction?.()}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
          >
            <UserMinus size={14} />
            Unfollow
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
          <button 
            onClick={() => onAction?.()}
            className={cn(
              "w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5",
              isFollowing 
                ? "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/10"
            )}
          >
            {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
