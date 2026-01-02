import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Candidate, UserProfile, Voter, VoteRecord } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Candidate Queries
export function useGetAllCandidates() {
  const { actor, isFetching } = useActor();

  return useQuery<Candidate[]>({
    queryKey: ['candidates'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCandidates();
    },
    enabled: !!actor && !isFetching,
  });
}

// OTP and Registration Mutations
export function useGenerateOtp() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (aadhaar: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateOtp(aadhaar);
    },
  });
}

export function useValidateOtp() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ aadhaar, otp }: { aadhaar: string; otp: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.validateOtp(aadhaar, otp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voterStatus'] });
    },
  });
}

// Voting Queries
export function useCanVote() {
  const { actor, isFetching } = useActor();

  return useMutation({
    mutationFn: async (aadhaar: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.canVote(aadhaar);
    },
  });
}

export function useVote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ aadhaar, candidateId }: { aadhaar: string; candidateId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.vote(aadhaar, candidateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voteCounts'] });
      queryClient.invalidateQueries({ queryKey: ['voterStatus'] });
    },
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVoteCounts() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[bigint, bigint]>>({
    queryKey: ['voteCounts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVoteCounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllVotes() {
  const { actor, isFetching } = useActor();

  return useQuery<VoteRecord[]>({
    queryKey: ['allVotes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllVoters() {
  const { actor, isFetching } = useActor();

  return useQuery<Voter[]>({
    queryKey: ['allVoters'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVoters();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useResetAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetAdmin();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
