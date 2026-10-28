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
 * Starts from published posts only, then splits into 4 branches.
 */
export const StatsRepository = {
  async getPublicStats(): Promise<StatsResult> {
    const result = await Post.aggregate([
      // Only published posts feed into every facet branch
      { $match: { status: "published" } },
      {
        $facet: {
          // a) total number of published posts
          totalPublished: [{ $count: "count" }],

          // b) top 10 tags ($unwind + $group)
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

          // c) top 5 authors by published posts ($lookup on users)
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
                from: "users", // MongoDB collection name for the User model
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

          // d) top 5 most-commented posts (title + commentCount)
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
  },
};
