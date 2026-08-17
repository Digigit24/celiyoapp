import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  answerQuestion,
  getLocationMetrics,
  getLocationScore,
  listConnections,
  listLocations,
  listQuestions,
  listReviews,
  type QuestionListParams,
  type ReviewListParams,
} from "../../lib/api/reputation";
import { useAuth } from "../../store/AuthContext";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export function useReputationConnections() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ["reputation", "connections"],
    queryFn: listConnections,
    enabled,
  });
}

export function useReputationLocations(enabled = true) {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: ["reputation", "locations"],
    queryFn: listLocations,
    enabled: signedIn && enabled,
  });
}

export function useLocationMetrics(locationId: number | null | undefined, days = 7) {
  const enabled = useSignedIn() && Boolean(locationId);
  return useQuery({
    queryKey: ["reputation", "metrics", locationId ?? 0, days],
    queryFn: () => getLocationMetrics(locationId as number, days),
    enabled,
  });
}

export function useLocationScore(locationId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(locationId);
  return useQuery({
    queryKey: ["reputation", "score", locationId ?? 0],
    queryFn: () => getLocationScore(locationId as number),
    enabled,
  });
}

export function useQuestions(params: QuestionListParams | undefined, enabled = true) {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: ["reputation", "questions", params ?? {}],
    queryFn: () => listQuestions(params),
    enabled: signedIn && enabled,
  });
}

export function useAnswerQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => answerQuestion(id, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reputation", "questions"] }),
  });
}

export function useReviews(params: ReviewListParams | undefined, enabled = true) {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: ["reputation", "reviews", params ?? {}],
    queryFn: () => listReviews(params),
    enabled: signedIn && enabled,
  });
}
