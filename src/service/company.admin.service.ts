//getShareholderCount
//getSharesCount
//getNumberOfShareClasses
//getPricePerShare

//getShareTransactionInChart
//getmostRecentTransactions
//get5LargestShareholders

import { Types } from "mongoose";
import { PipelineStage } from "mongoose";

//Models
import CompanyModel, { ICompanyModel, ICompany } from "../models/company.model";
import ShareModel, { IShareModel } from "../models/share.model";

//Services
import companyService from "./company.service";

//Get all shareholders in a company
async function getAllShareholders(companyId: string): Promise<IShareModel[]> {
  const shareholders = await ShareModel.find({
    companyId: new Types.ObjectId(companyId),
  }).exec();
  return shareholders;
}

interface ShareEntry {
  userId: string;
  name: string;
  totalShares: number;
  shareClass: string;
  shares: number;
  isHoldingCompany: boolean;
  holdingCompanyName: string | null;
}

const getCapTable = async (companyId: string): Promise<ShareEntry[]> => {
  console.log(`Starting getCapTable for companyId: ${companyId}`);

  const company = await companyService.getCompanyById(companyId);
  if (!company) {
    console.log(`Company not found for id: ${companyId}`);
    throw new Error("Company not found");
  }

  console.log(`Found company: ${company.name}`);

  const pipeline: PipelineStage[] = [
    {
      $match: {
        companyId: new Types.ObjectId(companyId),
        shareStatus: { $in: ["active", "locked", "partially_sold"] },
      },
    },
    // ... (keep the existing lookup stages) ...
    {
      $group: {
        _id: {
          userId: "$userId",
          shareClassId: "$shareClassId",
          holdingCompanyId: "$holdingCompanyId",
        },
        name: {
          $first: { $ifNull: ["$userDetails.fullName", "Unknown User"] },
        },
        shareClassName: { $first: "$shareClassDetails.shareClassName" },
        shares: { $sum: "$remainingShares" },
        holdingCompanyName: { $first: "$holdingCompanyDetails.name" },
      },
    },
    {
      $group: {
        _id: "$_id.userId",
        name: { $first: "$name" },
        totalShares: { $sum: "$shares" },
        shareEntries: {
          $push: {
            shareClass: "$shareClassName",
            shares: "$shares",
            isHoldingCompany: { $ne: ["$_id.holdingCompanyId", null] },
            holdingCompanyName: "$holdingCompanyName",
          },
        },
      },
    },
    {
      $unwind: "$shareEntries",
    },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        name: 1,
        totalShares: 1,
        shareClass: "$shareEntries.shareClass",
        shares: "$shareEntries.shares",
        isHoldingCompany: "$shareEntries.isHoldingCompany",
        holdingCompanyName: "$shareEntries.holdingCompanyName",
      },
    },
    {
      $sort: { totalShares: -1, userId: 1, shareClass: 1 },
    },
  ];

  console.log("Executing aggregation pipeline...");
  const shareEntries = await ShareModel.aggregate(pipeline);
  console.log(`Aggregation complete. Found ${shareEntries.length} entries`);

  if (shareEntries.length === 0) {
    console.warn("No shareholders found. Returning empty cap table.");
    return [];
  }

  console.log("getCapTable function completed.");
  return shareEntries;
};

async function getTotalSharesCount(companyId: string): Promise<number> {
  console.log(`Getting total shares count for companyId: ${companyId}`);

  try {
    const result = await ShareModel.aggregate([
      {
        $match: {
          companyId: new Types.ObjectId(companyId),
          sharesStatus: { $in: ["active", "locked", "partially_sold"] },
        },
      },
      {
        $group: {
          _id: null,
          totalShares: { $sum: "$remainingShares" },
        },
      },
    ]);
    const totalShares = result.length > 0 ? result[0].totalShares : 0;
    console.log(`Total shares count: ${totalShares}`);
    return totalShares;
  } catch (error) {
    console.error(`Error getting total shares count: ${error.message}`);
    throw error;
  }
}

async function getShareholderCount(companyId: string): Promise<number> {
  console.log(`Getting shareholder count for companyId: ${companyId}`);

  try {
    const result = await ShareModel.aggregate([
      {
        $match: {
          companyId: new Types.ObjectId(companyId),
          shareStatus: { $in: ["active", "locked", "partially_sold"] },
          remainingShares: { $gt: 0 }, // Only consider shares with a positive remaining count
        },
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            isHoldingCompany: { $ne: ["$holdingCompanyId", null] },
          },
          shares: { $sum: "$remainingShares" },
        },
      },
      {
        $group: {
          _id: "$_id.userId",
          holdingCompanyShares: {
            $sum: {
              $cond: [{ $eq: ["$_id.isHoldingCompany", true] }, "$shares", 0],
            },
          },
          directShares: {
            $sum: {
              $cond: [{ $eq: ["$_id.isHoldingCompany", false] }, "$shares", 0],
            },
          },
        },
      },
      {
        $project: {
          shareholderCount: {
            $cond: [
              {
                $or: [
                  { $gt: ["$holdingCompanyShares", 0] },
                  { $gt: ["$directShares", 0] },
                ],
              },
              {
                $cond: [
                  {
                    $and: [
                      { $gt: ["$holdingCompanyShares", 0] },
                      { $gt: ["$directShares", 0] },
                    ],
                  },
                  2, // Count as 2 if both direct and holding company shares exist
                  1, // Count as 1 if either direct or holding company shares exist
                ],
              },
              0, // Count as 0 if neither direct nor holding company shares exist
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalShareholderCount: { $sum: "$shareholderCount" },
        },
      },
    ]);

    const shareholderCount =
      result.length > 0 ? result[0].totalShareholderCount : 0;
    console.log(
      `Total shareholders for companyId ${companyId}: ${shareholderCount}`
    );
    return shareholderCount;
  } catch (error) {
    console.error(`Error getting shareholder count: ${error.message}`);
    throw error;
  }
}

async function getShareClassCount(companyId: string): Promise<number> {
  console.log(`Getting share class count for companyId: ${companyId}`);

  try {
    const company = await CompanyModel.findById(companyId)
      .select("shareClasses")
      .exec();

    if (!company) {
      console.log(`Company not found for id: ${companyId}`);
      throw new Error("Company not found");
    }

    const shareClassCount = company.shareClasses?.length ?? 0;
    console.log(
      `Found ${shareClassCount} share classes for companyId ${companyId}`
    );
    return shareClassCount;
  } catch (error) {
    console.error(`Error getting share class count: ${error.message}`);
    throw error;
  }
}

async function getFiveLargestShareholders(
  companyId: string
): Promise<ShareEntry[]> {
  console.log(`Getting 5 largest shareholders for companyId: ${companyId}`);

  try {
    const capTable = await getCapTable(companyId);

    const largestShareholders = capTable
      .sort((a, b) => b.totalShares - a.totalShares)
      .slice(0, 5);

    console.log(`Found ${largestShareholders.length} largest shareholders`);
    return largestShareholders;
  } catch (error) {
    console.error(`Error getting largest shareholders: ${error.message}`);
    throw error;
  }
}

export default {
  getCapTable,
  getTotalSharesCount,
  getShareholderCount,
  getShareClassCount,
  getFiveLargestShareholders,
};
