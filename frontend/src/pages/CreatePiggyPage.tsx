import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { PIGGY_BANK_FACTORY_ABI, PIGGY_BANK_FACTORY_ADDRESS } from '../constants/contracts';
import { toast } from 'react-hot-toast';

export const CreatePiggyPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    targetAmount: '',
    tokenAddress: '',
    lockDuration: '',
    isGroup: false,
    participants: [''],
    requiredApprovals: '1'
  });

  const { write: createPiggy, data: createData } = useContractWrite({
    address: PIGGY_BANK_FACTORY_ADDRESS,
    abi: PIGGY_BANK_FACTORY_ABI,
    functionName: formData.isGroup ? 'createGroupPiggyBank' : 'createIndividualPiggyBank',
  });

  const { isLoading } = useWaitForTransaction({
    hash: createData?.hash,
    onSuccess: () => {
      toast.success('PiggyBank created successfully!');
      navigate('/');
    },
    onError: () => toast.error('Failed to create PiggyBank'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const args = [
        formData.tokenAddress,
        parseEther(formData.targetAmount),
        BigInt(Number(formData.lockDuration) * 24 * 60 * 60), // Convert days to seconds
      ];

      if (formData.isGroup) {
        args.push(
          formData.participants.filter(p => p),
          BigInt(formData.requiredApprovals)
        );
      }

      createPiggy({ args });
    } catch (error) {
      toast.error('Invalid input values');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New PiggyBank</h1>
      
      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Token Address</label>
          <input
            type="text"
            value={formData.tokenAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, tokenAddress: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Target Amount</label>
          <input
            type="number"
            step="0.000000000000000001"
            value={formData.targetAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Lock Duration (days)</label>
          <input
            type="number"
            value={formData.lockDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, lockDuration: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            required
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isGroup}
              onChange={(e) => setFormData(prev => ({ ...prev, isGroup: e.target.checked }))}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="ml-2 text-sm text-gray-700">Create as Group PiggyBank</span>
          </label>
        </div>

        {formData.isGroup && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Participants</label>
              {formData.participants.map((participant, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={participant}
                    onChange={(e) => {
                      const newParticipants = [...formData.participants];
                      newParticipants[index] = e.target.value;
                      setFormData(prev => ({ ...prev, participants: newParticipants }));
                    }}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    placeholder="Participant address"
                  />
                  {index === formData.participants.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        participants: [...prev.participants, '']
                      }))}
                      className="px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                    >
                      +
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        participants: prev.participants.filter((_, i) => i !== index)
                      }))}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      -
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Required Approvals</label>
              <input
                type="number"
                min="1"
                max={formData.participants.length}
                value={formData.requiredApprovals}
                onChange={(e) => setFormData(prev => ({ ...prev, requiredApprovals: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                required
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create PiggyBank'}
        </button>
      </form>
    </div>
  );
}; 