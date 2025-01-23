// src/components/bands/InviteHistory.tsx
import { useState, useEffect } from 'react';
import { getBandInvites } from '@/lib/services/firebase/bands';
import type { BandInviteWithId } from '@/lib/types/band';
import { Clock, Check, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface InviteHistoryProps {
  bandId: string;
  onRefresh?: () => void;
}

export function InviteHistory({ bandId, onRefresh }: InviteHistoryProps) {
  const [invites, setInvites] = useState<BandInviteWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvites = async () => {
    setIsLoading(true);
    try {
      const loadedInvites = await getBandInvites(bandId);
      setInvites(loadedInvites.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
    } catch (error) {
      toast.error('Failed to load invites');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, [bandId]);

  const handleCopyLink = async (inviteCode: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/join/${inviteCode}`);
      toast.success('Invite link copied!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleRefresh = () => {
    loadInvites();
    onRefresh?.();
  };

  if (isLoading) {
    return <div className="text-gray-400">Loading invites...</div>;
  }

  if (invites.length === 0) {
    return <div className="text-gray-400">No invites generated yet</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-400">Recent Invites</h4>
        <Button 
          variant="outline" 
          size="sm"
          onClick={loadInvites}
          className="text-gray-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {invites.map((invite) => (
          <div 
            key={invite.id}
            className={`p-4 rounded-lg border ${
              invite.status === 'active' 
                ? 'border-gray-700 bg-gray-800'
                : 'border-gray-800 bg-gray-800/50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                {invite.comment && (
                  <p className="text-sm font-medium text-white mb-2">
                    Note: {invite.comment}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  {invite.status === 'active' ? (
                    <span className="flex items-center text-xs text-green-400">
                      <Clock className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-blue-400">
                      <Check className="w-3 h-3 mr-1" />
                      Used
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    Created {new Date(invite.createdAt.seconds * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {invite.status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/join/${invite.inviteCode}`);
                    toast.success('Invite link copied!');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>

            {invite.status === 'active' ? (
              <p className="text-sm text-gray-400 break-all">
                {`${window.location.origin}/join/${invite.inviteCode}`}
              </p>
            ) : invite.usedByProfile ? (
              <div className="text-sm text-gray-400">
                Used by: {invite.usedByProfile.fullName}
                {invite.usedAt && (
                  <span className="text-gray-500 ml-2">
                    ({new Date(invite.usedAt.seconds * 1000).toLocaleDateString()})
                  </span>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}