import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { FACTORY_ADDRESS, FACTORY_ABI } from '../../constants/contracts';
import { toast } from 'react-hot-toast';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AccountType = 'individual' | 'group';

const SUPPORTED_TOKENS = [
  { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
  { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f' }
];

export const CreateAccountModal = ({ isOpen, onClose }: CreateAccountModalProps) => {
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [token, setToken] = useState(SUPPORTED_TOKENS[0].address);
  const [targetAmount, setTargetAmount] = useState('');
  const [lockDuration, setLockDuration] = useState('1');
  const [groupName, setGroupName] = useState('');
  const [participants, setParticipants] = useState<string[]>(['']);
  const [requiredApprovals, setRequiredApprovals] = useState('1');

  const { write: createIndividual, data: individualTx } = useContractWrite({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'createIndividualPiggyBank',
  });

  const { write: createGroup, data: groupTx } = useContractWrite({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'createGroupPiggyBank',
  });

  const { isLoading: isIndividualLoading } = useWaitForTransaction({
    hash: individualTx?.hash,
    onSuccess: () => {
      toast.success('Individual PiggyBank created successfully!');
      onClose();
    },
    onError: () => toast.error('Failed to create Individual PiggyBank'),
  });

  const { isLoading: isGroupLoading } = useWaitForTransaction({
    hash: groupTx?.hash,
    onSuccess: () => {
      toast.success('Group PiggyBank created successfully!');
      onClose();
    },
    onError: () => toast.error('Failed to create Group PiggyBank'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationInSeconds = parseInt(lockDuration) * 30 * 24 * 60 * 60; // Convert months to seconds

    if (accountType === 'individual') {
      createIndividual({
        args: [
          token,
          targetAmount ? BigInt(targetAmount) : BigInt(0),
          BigInt(durationInSeconds)
        ],
      });
    } else {
      const filteredParticipants = participants.filter(p => p !== '');
      createGroup({
        args: [
          groupName,
          filteredParticipants,
          BigInt(requiredApprovals),
          token,
          BigInt(targetAmount),
          BigInt(durationInSeconds)
        ],
      });
    }
  };

  const addParticipant = () => {
    setParticipants([...participants, '']);
  };

  const updateParticipant = (index: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = value;
    setParticipants(newParticipants);
  };

  const removeParticipant = (index: number) => {
    const newParticipants = participants.filter((_, i) => i !== index);
    setParticipants(newParticipants);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Create New Account
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Account Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setAccountType('individual')}
                        className={`flex-1 py-2 px-4 rounded-lg ${
                          accountType === 'individual'
                            ? 'bg-teal-500 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType('group')}
                        className={`flex-1 py-2 px-4 rounded-lg ${
                          accountType === 'group'
                            ? 'bg-teal-500 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Group
                      </button>
                    </div>
                  </div>

                  {/* Token Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token
                    </label>
                    <select
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    >
                      {SUPPORTED_TOKENS.map((t) => (
                        <option key={t.address} value={t.address}>
                          {t.symbol}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Amount {accountType === 'individual' && '(Optional)'}
                    </label>
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder={`Enter amount in ${
                        SUPPORTED_TOKENS.find((t) => t.address === token)?.symbol
                      }`}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      required={accountType === 'group'}
                    />
                  </div>

                  {/* Lock Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lock Duration (months)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max={accountType === 'individual' ? '12' : '24'}
                      value={lockDuration}
                      onChange={(e) => setLockDuration(e.target.value)}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-gray-600">
                      {lockDuration} month{parseInt(lockDuration) !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Group-specific fields */}
                  {accountType === 'group' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Group Name
                        </label>
                        <input
                          type="text"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          placeholder="Enter group name"
                          maxLength={32}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Participants
                        </label>
                        {participants.map((participant, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={participant}
                              onChange={(e) => updateParticipant(index, e.target.value)}
                              placeholder="Enter wallet address"
                              className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                              required
                            />
                            {participants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeParticipant(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addParticipant}
                          className="text-teal-500 hover:text-teal-700 text-sm"
                        >
                          + Add Participant
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Required Approvals
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={participants.length}
                          value={requiredApprovals}
                          onChange={(e) => setRequiredApprovals(e.target.value)}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isIndividualLoading || isGroupLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isIndividualLoading || isGroupLoading ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 