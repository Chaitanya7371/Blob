import {
  statsRepository,
  StatsResult,
} from "../../Repository/Stats.repository";
import { CacheHelper, CacheStatus } from "../../utils/cache";
import { RedisKeys, RedisTtl } from "../../constants/redis";

export type StatsCachedResult = {
  data: StatsResult;
  cache: CacheStatus;
};

/**
 * Stats with Redis cache — aggregation runs at most once every 5 minutes.
 * Body is identical for HIT and MISS.
 */
export class StatsService {
  async getPublicStats(): Promise<StatsCachedResult> {
    const cacheKey = RedisKeys.stats();
    const cached = await CacheHelper.getJSON<StatsResult>(cacheKey);

    if (cached) {
      return { data: cached, cache: "HIT" };
    }

    const stats = await statsRepository.getPublicStats();
    await CacheHelper.setJSON(cacheKey, stats, RedisTtl.STATS_SECONDS);
    return { data: stats, cache: "MISS" };
  }
}

export const statsService = new StatsService();
