//src\components\auth\BandMembers.tsx
import React, { useEffect, useState } from 'react';
import { getBandMembers, updateBandMember, removeBandMember, getOrCreateBandInvite, toggleBandInvite, regenerateBandInvite } from '@/lib/services/firebase/bands';
import type { BandMember, BandInvite } from '@/lib/types/band';
import { RefreshCw, Share, Power, UserX, UserCog, Check, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface BandMembersProps {
  bandId: string;
  currentUserId: string;
}

export default function BandMembers({ bandId, currentUserId }: BandMembersProps) {
  const [members, setMembers] = useState<BandMember[]>([]);
  const [invite, setInvite] = useState<BandInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [justCopied, setJustCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [bandId]);

  const loadData = async () => {
    try {
      const [membersData, inviteData] = await Promise.all([
        getBandMembers(bandId),
        getOrCreateBandInvite(bandId)
      ]);
      setMembers(membersData);
      setInvite(inviteData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load band data');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!invite) return;
    
    const inviteLink = `${window.location.origin}/join/${invite.inviteCode}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setJustCopied(true);
      toast.success('Invite link copied to clipboard');
      setTimeout(() => setJustCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareToWhatsApp = () => {
    if (!invite) return;
    const inviteLink = `${window.location.origin}/join/${invite.inviteCode}`;
    const message = encodeURIComponent(
      `Join my band on bndy!\n\n${inviteLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      await updateBandMember(bandId, userId, newRole);
      await loadData();
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update member role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeBandMember(bandId, userId);
        await loadData();
      } catch (err) {
        console.error('Error removing member:', err);
        setError('Failed to remove member');
      }
    }
  };

  const handleToggleInvite = async () => {
    if (!invite) return;
    try {
      await toggleBandInvite(bandId, invite.inviteCode, !invite.isActive);
      await loadData();
    } catch (err) {
      console.error('Error toggling invite:', err);
      setError('Failed to toggle invite status');
    }
  };

  const handleRegenerateInvite = async () => {
    if (!window.confirm('Are you sure? This will invalidate the current invite link.')) return;
    try {
      const newInvite = await regenerateBandInvite(bandId);
      setInvite(newInvite);
      toast.success('New invite link generated');
    } catch (err) {
      console.error('Error regenerating invite:', err);
      setError('Failed to regenerate invite');
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Current Members List */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Current Members</h3>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
            >
              <div>
                <p className="text-white">{member.displayName}</p>
                <p className="text-sm text-gray-400">{member.instruments.join(', ')}</p>
              </div>
              <div className="flex items-center gap-2">
                {member.userId !== currentUserId && (
                  <>
                    <button
                      onClick={() => handleRoleUpdate(member.userId, member.role === 'admin' ? 'member' : 'admin')}
                      className="p-2 text-gray-400 hover:text-white"
                      title={`Make ${member.role === 'admin' ? 'Member' : 'Admin'}`}
                    >
                      <UserCog className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="p-2 text-gray-400 hover:text-red-500"
                      title="Remove Member"
                    >
                      <UserX className="w-5 h-5" />
                    </button>
                  </>
                )}
                <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Band Invite Section */}
      {invite && (
        <div className="bg-gray-800 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Band Invite</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleInvite}
                className={`p-2 rounded-lg ${
                  invite.isActive ? 'text-green-500' : 'text-gray-500'
                }`}
                title={invite.isActive ? 'Deactivate Invite' : 'Activate Invite'}
              >
                <Power className="w-5 h-5" />
              </button>
              <button
                onClick={handleRegenerateInvite}
                className="p-2 text-gray-400 hover:text-white"
                title="Regenerate Invite"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyInviteLink}
              className="flex-1 bg-gray-700 p-3 rounded-lg text-sm text-left text-white hover:bg-gray-600 transition-colors relative group"
            >
              {`${window.location.origin}/join/${invite.inviteCode}`}
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                {justCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400 group-hover:text-white" />
                )}
              </span>
            </button>
            <button
              onClick={shareToWhatsApp}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white p-3 rounded-lg transition-colors"
              title="Share via WhatsApp"
            >
              <Share className="w-5 h-5" />
            </button>
          </div>

          {/* Invite Usage History */}
          {invite.uses.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Usage History</h4>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-400 bg-gray-800">User</th>
                      <th className="px-4 py-2 text-left text-gray-400 bg-gray-800">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invite.uses.map((use) => (
                      <tr key={use.userId} className="border-t border-gray-800">
                        <td className="px-4 py-2 text-white">{use.displayName}</td>
                        <td className="px-4 py-2 text-gray-400">
                          {format(use.joinedAt.toDate(), 'PP')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}