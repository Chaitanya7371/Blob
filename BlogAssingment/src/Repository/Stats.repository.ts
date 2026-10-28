import Post from "../model/Post.model";

export type StatsResult = {
  totalPublishedPosts: number;
  topTags: Array<{ tag: string; count: number }>;
  topAuthors: Array<{ authorId: unknown; name: string; postCount: number }>;
  topCommentedPosts: Array<{
    _id: unknown;
    title: string;
    commentCount: number;
  }>;
};

/**
 * All stats in ONE aggregation using $facet.
 */
export class StatsRepository {
  async getPublicStats(): Promise<StatsResult> {
    const result = await Post.aggregate([
      { $match: { status: "published" } },
      {
        $facet: {
          totalPublished: [{ $count: "count" }],

          topTags: [
            { $unwind: "$tags" },
            {
              $group: {
                _id: "$tags",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                tag: "$_id",
                count: 1,
              },
            },
          ],

          topAuthors: [
            {
              $group: {
                _id: "$author",
                postCount: { $sum: 1 },
              },
            },
            { $sort: { postCount: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                authorId: "$_id",
                name: { $ifNull: ["$user.name", "Unknown"] },
                postCount: 1,
              },
            },
          ],

          topCommentedPosts: [
            { $sort: { commentCount: -1, createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                title: 1,
                commentCount: 1,
              },
            },
          ],
        },
      },
    ]);

    const facet = result[0] as {
      totalPublished: Array<{ count: number }>;
      topTags: StatsResult["topTags"];
      topAuthors: StatsResult["topAuthors"];
      topCommentedPosts: StatsResult["topCommentedPosts"];
    };

    return {
      totalPublishedPosts: facet.totalPublished[0]?.count ?? 0,
      topTags: facet.topTags ?? [],
      topAuthors: facet.topAuthors ?? [],
      topCommentedPosts: facet.topCommentedPosts ?? [],
    };
  }
}

export const statsRepository = new StatsRepository();
