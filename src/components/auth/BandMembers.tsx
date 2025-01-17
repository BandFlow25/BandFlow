//src/components/auth/BandMembers.tsx
import React, { useState, useEffect } from 'react';
import { getUserProfile, type UserProfile } from '@/lib/services/firebase/auth';
import { getBandMembers, addBandMember, updateBandMember, removeBandMember } from '@/lib/services/firebase/bands';
import type { BandMember } from '@/lib/types/band';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { Share2, UserPlus, AlertTriangle } from 'lucide-react';
import { COLLECTIONS } from '@/lib/constants';

interface BandMembersProps {
  bandId: string;
  currentUserId: string;
}

interface ExtendedBandMember extends BandMember {
  userProfile: UserProfile | null;
}

const BandMembers = ({ bandId, currentUserId }: BandMembersProps) => {
  const [members, setMembers] = useState<ExtendedBandMember[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Load band members and their profiles
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const bandMembers = await getBandMembers(bandId);
        const extendedMembers = await Promise.all(
          bandMembers.map(async (member) => {
            const profile = await getUserProfile(member.userId);
            return { ...member, userProfile: profile };
          })
        );
        setMembers(extendedMembers);
      } catch (err) {
        console.error('Error loading members:', err);
        setError('Failed to load band members');
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [bandId]);

  // Load all users (DEV ONLY)
  const loadAllUsers = async () => {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const usersSnap = await getDocs(usersRef);
      const users = usersSnap.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      }) as UserProfile);
      // Filter out users who are already members
      setAllUsers(users.filter(user => !members.some(member => member.userId === user.uid)));
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    }
  };
  
  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  const handleAddMembers = async () => {
    try {
      setError('');
      await Promise.all(
        selectedUsers.map(userId =>
          addBandMember(bandId, userId, 'member')
        )
      );
      // Refresh member list
      const bandMembers = await getBandMembers(bandId);
      const extendedMembers = await Promise.all(
        bandMembers.map(async (member) => {
          const profile = await getUserProfile(member.userId);
          return { ...member, userProfile: profile };
        })
      );
      setMembers(extendedMembers);
      setSelectedUsers([]);
      setIsSelectOpen(false);
    } catch (err) {
      console.error('Error adding members:', err);
      setError('Failed to add members');
    }
  };
  const toggleMemberRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'member' : 'admin';
      await updateBandMember(bandId, userId, newRole);
      setMembers(members.map(member =>
        member.userId === userId ? { ...member, role: newRole } : member
      ));
    } catch (err) {
      console.error('Error updating member role:', err);
      setError('Failed to update member role');
    }
  };
  const removeMember = async (userId: string) => {
    try {
      await removeBandMember(bandId, userId);
      setMembers(members.filter(member => member.userId !== userId));
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member');
    }
  }; 

  if (isLoading) {
    return <div className="text-gray-400">Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Current Members List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Current Members</h3>
        <div className="divide-y divide-gray-700">
          {members.map((member) => (
            <div key={member.userId} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-white">{member.userProfile?.fullName || 'Unknown User'}</p>
                <p className="text-sm text-gray-400">
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </p>
              </div>
              {currentUserId !== member.userId && (
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleMemberRole(member.userId, member.role)}
                    className="text-sm px-2 py-1 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                  >
                    {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button
                    onClick={() => removeMember(member.userId)}
                    className="text-sm px-2 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite Section */}
      <div className="border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4">Invite Members</h3>
        <button
          className="inline-flex items-center px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Invite Link
          <span className="ml-2 text-xs bg-gray-600 px-2 py-1 rounded">Coming Soon</span>
        </button>
      </div>

      {/* DEV ONLY: Select Users Section */}
      <div className="border border-red-500/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-medium text-red-500">Development Only: Add Users</h3>
        </div>
        <button
          onClick={() => {
            setIsSelectOpen(!isSelectOpen);
            if (!isSelectOpen) loadAllUsers();
          }}
          className="inline-flex items-center px-4 py-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Select Users to Add
        </button>

        {isSelectOpen && (
          <div className="mt-4 space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {allUsers.map((user) => (
                <label
                  key={user.uid}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.uid)}
                    onChange={() => handleUserSelect(user.uid)}
                    className="rounded border-gray-600"
                  />
                  <span className="text-white">{user.fullName}</span>
                </label>
              ))}
            </div>
            {selectedUsers.length > 0 && (
              <button
                onClick={handleAddMembers}
                className="w-full px-4 py-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20"
              >
                Add Selected Users ({selectedUsers.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BandMembers;