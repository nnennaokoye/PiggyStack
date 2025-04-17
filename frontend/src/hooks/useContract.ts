import { useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import {
  FACTORY_ADDRESS,
  FACTORY_ABI,
  PIGGY_BANK_ABI,
  GROUP_PIGGY_ABI,
} from '../lib/constants';

export function useCreatePiggy() {
  const {
    write: createIndividual,
    data: createIndividualData,
    isLoading: isCreatingIndividual,
  } = useContractWrite({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'createIndividualPiggy',
  });

  const {
    write: createGroup,
    data: createGroupData,
    isLoading: isCreatingGroup,
  } = useContractWrite({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'createGroupPiggy',
  });

  const { isLoading: isWaitingIndividual, isSuccess: isIndividualSuccess } =
    useWaitForTransaction({
      hash: createIndividualData?.hash,
    });

  const { isLoading: isWaitingGroup, isSuccess: isGroupSuccess } =
    useWaitForTransaction({
      hash: createGroupData?.hash,
    });

  return {
    createIndividual,
    createGroup,
    isLoading: isCreatingIndividual || isCreatingGroup || isWaitingIndividual || isWaitingGroup,
    isSuccess: isIndividualSuccess || isGroupSuccess,
  };
}

export function usePiggyBank(address: string, isGroup = false) {
  const abi = isGroup ? GROUP_PIGGY_ABI : PIGGY_BANK_ABI;

  const { data: progress } = useContractRead({
    address,
    abi,
    functionName: 'getProgress',
    watch: true,
  });

  const {
    write: deposit,
    data: depositData,
    isLoading: isDepositing,
  } = useContractWrite({
    address,
    abi,
    functionName: 'deposit',
  });

  const {
    write: withdraw,
    data: withdrawData,
    isLoading: isWithdrawing,
  } = useContractWrite({
    address,
    abi,
    functionName: 'withdraw',
  });

  const {
    write: emergencyWithdraw,
    data: emergencyData,
    isLoading: isEmergencyWithdrawing,
  } = useContractWrite({
    address,
    abi,
    functionName: 'emergencyWithdraw',
  });

  const { isLoading: isWaitingDeposit } = useWaitForTransaction({
    hash: depositData?.hash,
  });

  const { isLoading: isWaitingWithdraw } = useWaitForTransaction({
    hash: withdrawData?.hash,
  });

  const { isLoading: isWaitingEmergency } = useWaitForTransaction({
    hash: emergencyData?.hash,
  });

  return {
    progress: Number(progress || 0),
    deposit,
    withdraw,
    emergencyWithdraw,
    isLoading:
      isDepositing ||
      isWithdrawing ||
      isEmergencyWithdrawing ||
      isWaitingDeposit ||
      isWaitingWithdraw ||
      isWaitingEmergency,
  };
}

export function useGroupPiggy(address: string) {
  const piggy = usePiggyBank(address, true);

  const { data: participants } = useContractRead({
    address,
    abi: GROUP_PIGGY_ABI,
    functionName: 'getParticipants',
    watch: true,
  });

  const {
    write: proposeWithdrawal,
    data: proposeData,
    isLoading: isProposing,
  } = useContractWrite({
    address,
    abi: GROUP_PIGGY_ABI,
    functionName: 'proposeWithdrawal',
  });

  const {
    write: approveProposal,
    data: approveData,
    isLoading: isApproving,
  } = useContractWrite({
    address,
    abi: GROUP_PIGGY_ABI,
    functionName: 'approveProposal',
  });

  const { isLoading: isWaitingPropose } = useWaitForTransaction({
    hash: proposeData?.hash,
  });

  const { isLoading: isWaitingApprove } = useWaitForTransaction({
    hash: approveData?.hash,
  });

  return {
    ...piggy,
    participants,
    proposeWithdrawal,
    approveProposal,
    isLoading:
      piggy.isLoading ||
      isProposing ||
      isApproving ||
      isWaitingPropose ||
      isWaitingApprove,
  };
} 