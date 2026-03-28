import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const TOUR_PENDING_KEY = 'afritrust-tour-pending';

type ProductTourState = {
  /** Users who completed or skipped the guided tour (per browser). */
  dismissedUserIds: Record<string, boolean>;
  markTourFinishedForUser: (userId: string) => void;
  isTourCompleteForUser: (userId: string) => boolean;
  /** Increment from Help panel to reopen the tour at step 1 (works even after dismiss). */
  tourReplayNonce: number;
  requestProductTourReplay: () => void;
};

export const useProductTourStore = create<ProductTourState>()(
  persist(
    (set, get) => ({
      dismissedUserIds: {},
      tourReplayNonce: 0,
      markTourFinishedForUser: userId =>
        set(s => ({ dismissedUserIds: { ...s.dismissedUserIds, [userId]: true } })),
      isTourCompleteForUser: userId => !!get().dismissedUserIds[userId],
      requestProductTourReplay: () => set(s => ({ tourReplayNonce: s.tourReplayNonce + 1 })),
    }),
    {
      name: 'afritrust-product-tour',
      partialize: s => ({ dismissedUserIds: s.dismissedUserIds }),
    }
  )
);

/** Call after a successful sign-in / registration when the user should see the tour once. */
export function scheduleProductTourIfNeeded(userId: string) {
  if (!useProductTourStore.getState().isTourCompleteForUser(userId)) {
    try {
      sessionStorage.setItem(TOUR_PENDING_KEY, userId);
    } catch {
      /* private mode */
    }
  }
}

export { TOUR_PENDING_KEY };
