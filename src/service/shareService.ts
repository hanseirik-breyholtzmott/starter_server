import sharesModel, { IShare, IShareModel } from "../models/shares.model";

const createShare = async (shareData: IShare): Promise<IShareModel> => {
  try {
    const newShare = new sharesModel(shareData);
    await newShare.save();
    return newShare;
  } catch (error) {
    console.error("Error creating share:", error);
    throw error;
  }
};

const countTotalSharesIn2024 = async (): Promise<number> => {
  try {
    const response = await sharesModel.aggregate([
      {
        $match: {
          purchaseDate: {
            $gte: new Date("2024-01-01T00:00:00.000Z"),
            $lt: new Date("2025-01-01T00:00:00.000Z"),
          },
        },
      },
      {
        // Group stage to sum up the number of shares
        $group: {
          _id: null,
          totalShares: { $sum: "$numberOfShares" },
        },
      },
    ]);

    // If result is found, return the totalShares, otherwise return 0
    return response.length > 0 ? response[0].totalShares : 0;
  } catch (error) {
    console.error("Error counting total shares in 2024:", error);
    throw error;
  }
};

const sumActiveNonReferralSharesAfterDate = async (): Promise<number> => {
  try {
    const result = await sharesModel.aggregate([
      {
        $match: {
          shareStatus: { $ne: "locked" },
          referralBonus: { $ne: true },
          purchaseDate: { $gte: new Date("2024-01-01T00:00:00.000Z") },
        },
      },
      {
        $group: {
          _id: null,
          totalShares: { $sum: "$numberOfShares" },
        },
      },
    ]);

    // If no documents match the criteria, return 0
    if (result.length === 0) {
      return 0;
    }

    // Return the sum of shares
    return result[0].totalShares;
  } catch (error) {
    console.error(
      "Error summing active non-referral shares after date:",
      error
    );
    throw error;
  }
};

const countPurcahsesAfter2023 = async (): Promise<number> => {
  try {
    const count = await sharesModel.countDocuments({
      purchaseDate: { $gt: new Date("2023-12-31T23:59:59.999Z") },
    });

    return count;
  } catch (error) {
    console.error("Error counting shares after 2023:", error);
    throw error;
  }
};

const countSharesAfterDateExcludingReferrals = async (
  date: Date
): Promise<number> => {
  try {
    const count = await sharesModel.countDocuments({
      $and: [
        { referralBonus: { $ne: true } },
        { shareStatus: { $ne: "locked" } },
        { purchaseDate: { $gte: date } },
      ],
    });

    return count;
  } catch (error) {
    console.error(
      "Error counting shares after date excluding referrals:",
      error
    );
    throw error;
  }
};

const countSharesByUserId = async (userId: string): Promise<number> => {
  try {
    const shares = await sharesModel.find({ userid: userId });

    let totalShares = 0;
    let totalInvested = 0;

    shares.forEach((share) => {
      totalShares += share.numberOfShares;
      totalInvested += share.numberOfShares * share.purchasePrice;
    });
    return totalShares;
  } catch (error) {
    console.error("Error counting shares after 2023:", error);
    throw error;
  }
};

const getSharesWithUserDetails = async () => {
  try {
    const shares = await sharesModel.aggregate([
      // 1. Lookup stage: Join the 'shares' collection with the 'users' collection
      {
        $lookup: {
          from: "users", // Collection to join with
          localField: "userId", // Field in 'shares' collection
          foreignField: "user_id", // Field in 'users' collection
          as: "userDetails", // Name of the new field where the joined data will be placed
        },
      },
      // 2. Unwind stage: Flatten the 'userDetails' array into individual documents
      {
        $unwind: "$userDetails",
      },
      // 3. Group stage: Group documents by userId and calculate totalShares
      {
        $group: {
          _id: "$userId", // Group by userId
          totalShares: { $sum: "$numberOfShares" }, // Sum the number of shares for each user
          userDetails: { $first: "$userDetails" }, // Get the first occurrence of userDetails (there should only be one)
        },
      },
      // 4. Project stage: Shape the output to include the desired fields
      {
        $project: {
          _id: 0, // Exclude the default MongoDB _id field
          userId: "$userDetails.user_id", // Include the userId from userDetails
          totalShares: 1, // Include the totalShares field (1 means include it)
          name: {
            $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"], // Combine firstName and lastName into fullName
          },
          email: "$userDetails.primaryEmailAddress", // Include the primary email address from userDetails
        },
      },
      // 5. Sort stage: Sort the results by totalShares in descending order
      {
        $sort: { totalShares: -1 }, // Sort by totalShares, largest to smallest
      },
    ]);

    return shares; // Return the final aggregated result
  } catch (error) {
    console.error("Error fetching shares with user details:", error);
    throw error; // Rethrow the error if something goes wrong
  }
};

const countLockedShares = async (): Promise<number> => {
  try {
    const count = await sharesModel.countDocuments({
      shareStatus: "locked",
    });

    return count;
  } catch (error) {
    console.error("Error counting locked shares:", error);
    throw error;
  }
};

const countReferralBonusShares = async (): Promise<number> => {
  try {
    const count = await sharesModel.countDocuments({
      referralBonus: true,
    });

    return count;
  } catch (error) {
    console.error("Error counting referral bonus shares:", error);
    throw error;
  }
};

const countTotalSharesByUserId = async (userId: string): Promise<number> => {
  try {
    const result = await sharesModel.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $group: {
          _id: null,
          totalShares: { $sum: "$numberOfShares" },
        },
      },
    ]);

    // If the user has no shares, the result will be an empty array
    if (result.length === 0) {
      return 0;
    }

    return result[0].totalShares;
  } catch (error) {
    console.error(`Error counting total shares for user ${userId}:`, error);
    throw error;
  }
};

const sumLockedSharesByUserId = async (userId: string): Promise<number> => {
  try {
    const result = await sharesModel.aggregate([
      {
        $match: { userId: userId, shareStatus: "locked" },
      },
      {
        $group: {
          _id: null,
          totalLockedShares: { $sum: "$numberOfShares" },
        },
      },
    ]);

    // If there are no locked shares, the result will be an empty array
    if (result.length === 0) {
      return 0;
    }

    return result[0].totalLockedShares;
  } catch (error) {
    console.error("Error summing locked shares:", error);
    throw error;
  }
};

const sumReferralBonusSharesByUserId = async (
  userId: string
): Promise<number> => {
  try {
    const result = await sharesModel.aggregate([
      {
        $match: { referralBonus: true, userId: userId },
      },
      {
        $group: {
          _id: null,
          totalReferralBonusShares: { $sum: "$numberOfShares" },
        },
      },
    ]);

    // If there are no referral bonus shares, the result will be an empty array
    if (result.length === 0) {
      return 0;
    }

    return result[0].totalReferralBonusShares;
  } catch (error) {
    console.error("Error summing referral bonus shares:", error);
    throw error;
  }
};

const sumActiveNonReferralSharesByUserId = async (
  userId: string
): Promise<number> => {
  try {
    const result = await sharesModel.aggregate([
      {
        $match: {
          userId: userId,
          shareStatus: { $ne: "locked" },
          referralBonus: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          totalActiveNonReferralShares: { $sum: "$numberOfShares" },
        },
      },
    ]);

    // If the user has no active non-referral shares, the result will be an empty array
    if (result.length === 0) {
      return 0;
    }

    return result[0].totalActiveNonReferralShares;
  } catch (error) {
    console.error(
      `Error summing active non-referral shares for user ${userId}:`,
      error
    );
    throw error;
  }
};

export default {
  createShare,
  countTotalSharesIn2024,
  countPurcahsesAfter2023,
  countSharesByUserId,
  getSharesWithUserDetails,
  countTotalSharesByUserId,
  countSharesAfterDateExcludingReferrals,
  countLockedShares,
  countReferralBonusShares,
  sumActiveNonReferralSharesAfterDate,
  sumActiveNonReferralSharesByUserId,
  sumLockedSharesByUserId,
  sumReferralBonusSharesByUserId,
};
