import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Users, 
  Globe, 
  Lock, 
  MoreHorizontal, 
  MessageSquare, 
  Info, 
  Plus, 
  Grid, 
  PlaySquare,
  Share2,
  Heart,
  MessageCircle,
  Bookmark
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MOCK_USER } from '../constants';

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'about'>('feed');
  const [isJoined, setIsJoined] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await fetch(`/api/groups/${id}`);
        const data = await res.json();
        setGroupInfo(data);
      } catch (err) {
        console.error("Error fetching group:", err);
      }
    };
    fetchGroup();
  }, [id]);

  if (!groupInfo) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-black pb-12"
    >
      {/* Cover & Header */}
      <div className="relative h-48 md:h-64 bg-indigo-600">
        <img src={groupInfo.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-10">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg bg-gray-200">
                <img src={groupInfo.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-black mb-2">{groupInfo.name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1 font-bold">
                    {groupInfo.type === 'Public' ? <Globe size={16} /> : <Lock size={16} />}
                    {groupInfo.type} Group
                  </span>
                  <span>•</span>
                  <span className="font-bold">{groupInfo.members?.length || 0} Members</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsJoined(!isJoined)}
                className={cn(
                  "flex-1 md:flex-none px-8 py-3 rounded-2xl font-bold transition-all shadow-lg",
                  isJoined 
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20"
                )}
              >
                {isJoined ? 'Leave Group' : 'Join Group'}
              </button>
              <button 
                onClick={() => navigate(`/groups/${id}/chat`)}
                className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
              >
                <MessageSquare size={24} />
              </button>
              <button className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <MoreHorizontal size={24} />
              </button>
            </div>
          </div>

          <div className="flex gap-8 mt-8 border-t border-gray-100 dark:border-gray-800">
            <TabButton 
              active={activeTab === 'feed'} 
              onClick={() => setActiveTab('feed')} 
              icon={<Grid size={18} />} 
              label="Feed" 
            />
            <TabButton 
              active={activeTab === 'members'} 
              onClick={() => setActiveTab('members')} 
              icon={<Users size={18} />} 
              label="Members" 
            />
            <TabButton 
              active={activeTab === 'about'} 
              onClick={() => setActiveTab('about')} 
              icon={<Info size={18} />} 
              label="About" 
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {activeTab === 'feed' && (
              <>
                {isJoined && (
                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <img src={MOCK_USER.avatar} alt="" className="w-10 h-10 rounded-full" />
                    <button className="flex-1 text-left bg-gray-50 dark:bg-gray-800 py-3 px-6 rounded-2xl text-gray-500 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      Post something in {groupInfo.name}...
                    </button>
                  </div>
                )}
                
                {[...Array(3)].map((_, i) => (
                  <GroupPost key={i} index={i} groupName={groupInfo.name as string} />
                ))}
              </>
            )}

            {activeTab === 'members' && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-lg mb-6">Group Members</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupInfo.members?.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                          {member.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold">@{member.username}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{member.role}</p>
                        </div>
                      </div>
                      <button className="text-indigo-600 text-xs font-bold hover:underline">Profile</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-8">
                <div>
                  <h3 className="font-bold text-lg mb-4">About this group</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {groupInfo.description || "Welcome to our community! This group is dedicated to sharing experiences, learning from each other, and building meaningful connections around our shared interests."}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{groupInfo.type} Group</h4>
                      <p className="text-xs text-gray-500">Anyone can see who's in the group and what they post.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{groupInfo.members?.length || 0} Members</h4>
                      <p className="text-xs text-gray-500">Active community members sharing content daily.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-sm mb-4">Group Rules</h3>
              <div className="space-y-4">
                <Rule index={1} text="Be kind and courteous" />
                <Rule index={2} text="No hate speech or bullying" />
                <Rule index={3} text="No promotions or spam" />
                <Rule index={4} text="Respect everyone's privacy" />
              </div>
            </div>

            <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-black text-xl mb-2">Invite Friends</h3>
                <p className="text-indigo-100 text-xs mb-6">Grow the community by inviting your friends to join.</p>
                <button className="w-full bg-white text-indigo-600 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                  Send Invites
                </button>
              </div>
              <Plus size={120} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GroupPost({ index, groupName }: any) {
  const [isLiked, setIsLiked] = useState(false);
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={`https://picsum.photos/seed/user${index}/100/100`} alt="" className="w-10 h-10 rounded-full" />
          <div>
            <h4 className="font-bold text-sm">@member_{index + 1}</h4>
            <p className="text-[10px] text-gray-500">Posted in {groupName} • 2h ago</p>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>
      
      <div className="px-4 pb-4">
        <p className="text-sm leading-relaxed">
          Check out this amazing content I found today! Really fits the vibe of our group. What do you guys think? 🚀 #Community #GroupVibes
        </p>
      </div>

      <div className="aspect-video bg-gray-100 dark:bg-gray-800">
        <img src={`https://picsum.photos/seed/post${index + 10}/800/450`} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="p-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={cn("flex items-center gap-2 text-sm font-bold transition-colors", isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500")}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            <span>{isLiked ? '1.3K' : '1.2K'}</span>
          </button>
          <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
            <MessageCircle size={20} />
            <span>42</span>
          </button>
          <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-green-600 transition-colors">
            <Share2 size={20} />
            <span>12</span>
          </button>
        </div>
        <button className="text-gray-500 hover:text-yellow-500 transition-colors">
          <Bookmark size={20} />
        </button>
      </div>
    </div>
  );
}

function Rule({ index, text }: { index: number; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-indigo-600 font-black text-xs">{index}.</span>
      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{text}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 py-4 border-b-2 transition-all",
        active ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      )}
    >
      {icon}
      <span className="font-bold text-sm uppercase tracking-wider">{label}</span>
    </button>
  );
}
