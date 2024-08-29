import sharesModel from "../models/shares.model";

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

export default {
  countTotalSharesIn2024,
  countPurcahsesAfter2023,
  countSharesByUserId,
};
