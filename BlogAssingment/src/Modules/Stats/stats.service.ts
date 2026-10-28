import { StatsRepository, StatsResult } from "../../Repository/Stats.repository";

/**
 * Stats business logic — thin layer over the aggregation repository.
 */
export const StatsService = {
  async getPublicStats(): Promise<StatsResult> {
    return StatsRepository.getPublicStats();
  },
};
