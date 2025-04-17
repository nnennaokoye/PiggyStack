import { useState } from 'react';
import { useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { PIGGY_BANK_ABI } from '../../constants/contracts';
import { toast } from 'react-hot-toast';

interface GroupSettingsProps {
  address: `0x${string}`;
}

export const GroupSettings = ({ address }: GroupSettingsProps) => {
  const [newParticipant, setNewParticipant] = useState('');

  const { data: isGroup } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'isGroup',
  });

  const { data: participants } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'getParticipants',
    watch: true,
  });

  const { data: requiredApprovals } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'requiredApprovals',
  });

  const { write: addParticipant, data: addTx } = useContractWrite({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'addParticipant',
  });

  const { write: removeParticipant, data: removeTx } = useContractWrite({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'removeParticipant',
  });

  const { write: updateRequiredApprovals, data: updateTx } = useContractWrite({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'updateRequiredApprovals',
  });

  const { isLoading: isAddLoading } = useWaitForTransaction({
    hash: addTx?.hash,
    onSuccess: () => {
      toast.success('Participant added successfully!');
      setNewParticipant('');
    },
    onError: () => toast.error('Failed to add participant'),
  });

  const { isLoading: isRemoveLoading } = useWaitForTransaction({
    hash: removeTx?.hash,
    onSuccess: () => toast.success('Participant removed successfully!'),
    onError: () => toast.error('Failed to remove participant'),
  });

  const { isLoading: isUpdateLoading } = useWaitForTransaction({
    hash: updateTx?.hash,
    onSuccess: () => toast.success('Required approvals updated successfully!'),
    onError: () => toast.error('Failed to update required approvals'),
  });

  if (!isGroup) {
    return (
      <div className="text-center text-gray-500">
        This is not a group piggy bank. No settings available.
      </div>
    );
  }

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipant) return;

    try {
      addParticipant({ args: [newParticipant] });
    } catch (error) {
      toast.error('Invalid address');
    }
  };

  const handleRemoveParticipant = (participant: string) => {
    try {
      removeParticipant({ args: [participant] });
    } catch (error) {
      toast.error('Failed to remove participant');
    }
  };

  const handleUpdateApprovals = (newValue: number) => {
    if (newValue < 1 || newValue > (participants as string[])?.length) {
      toast.error('Invalid number of required approvals');
      return;
    }

    try {
      updateRequiredApprovals({ args: [newValue] });
    } catch (error) {
      toast.error('Failed to update required approvals');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Participants</h3>
        <div className="mt-4">
          <form onSubmit={handleAddParticipant} className="flex gap-2">
            <input
              type="text"
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              placeholder="Participant address"
              className="flex-1 focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
            <button
              type="submit"
              disabled={isAddLoading || !newParticipant}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddLoading ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
        <ul className="mt-4 divide-y divide-gray-200">
          {(participants as string[])?.map((participant) => (
            <li key={participant} className="py-4 flex justify-between items-center">
              <span className="text-sm text-gray-900">{participant}</span>
              <button
                onClick={() => handleRemoveParticipant(participant)}
                disabled={isRemoveLoading}
                className="ml-4 text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Required Approvals</h3>
        <p className="mt-1 text-sm text-gray-500">
          Number of participants required to approve withdrawals
        </p>
        <div className="mt-2">
          <input
            type="number"
            min="1"
            max={(participants as string[])?.length}
            value={requiredApprovals as number}
            onChange={(e) => handleUpdateApprovals(Number(e.target.value))}
            disabled={isUpdateLoading}
            className="focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>
  );
}; 