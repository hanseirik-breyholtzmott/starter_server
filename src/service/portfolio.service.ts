import { Types } from "mongoose";

//Models
import ShareModel, { IShareModel } from "../models/share.model";
import CompanyModel, { ICompanyModel } from "../models/company.model";
import TransactionModel, {
  ITransactionModel,
} from "../models/transaction.model";
import ShareTransactionModel, {
  IShareTransactionModel,
} from "../models/shareTransaction.model";
import UserModel, { IUserModel } from "../models/users.model";
import moment from "moment";
//Logger
//import { portfolioLogger } from "../logger";

interface ShareGroup {
  shareClass: string;
  totalShares: number;
  totalInvestment: number;
}

interface IdentifierGroup {
  identifierType: string;
  identifierValue: string;
  shares: ShareGroup[];
}

interface CompanyInvestment {
  company: ICompanyModel;
  identifiers: IdentifierGroup[];
  identifierType: string;
  identifierValue: string;
  totalShares: number;
  totalInvestment: number;
}

export interface UserPortfolio {
  totalShares: number;
  totalInvestment: number;
  companies: CompanyInvestment[];
}

async function getUserPortfolio(userId: string): Promise<UserPortfolio> {
  try {
    const user = await UserModel.findOne({
      $or: [{ _id: userId }, { userId: userId }, { user_id: userId }],
    });
    console.log("This is the user", user);
    if (!user) {
      throw new Error("User not found");
    }

    const userObjectId = user._id;

    const sharesByCompany = await ShareModel.aggregate([
      {
        $match: {
          userId: userObjectId,
          shareStatus: {
            $in: ["active", "locked", "partially_sold"],
          },
          remainingShares: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: {
            companyId: "$companyId",
            identifierType: "$identifier.type",
            identifierValue: "$identifier.value",
            shareClass: "$shareClassId",
          },
          totalShares: { $sum: "$remainingShares" },
          totalInvestment: {
            $sum: { $multiply: ["$remainingShares", "$purchasePrice"] },
          },
          shareStatuses: { $addToSet: "$shareStatus" },
        },
      },
      {
        $group: {
          _id: {
            companyId: "$_id.companyId",
            identifierType: "$_id.identifierType",
            identifierValue: "$_id.identifierValue",
          },
          shares: {
            $push: {
              shareClass: "$_id.shareClass",
              totalShares: "$totalShares",
              totalInvestment: "$totalInvestment",
              shareStatuses: "$shareStatuses",
            },
          },
          identifierTotalShares: { $sum: "$totalShares" },
          identifierTotalInvestment: { $sum: "$totalInvestment" },
        },
      },
      {
        $group: {
          _id: "$_id.companyId",
          identifiers: {
            $push: {
              identifierType: "$_id.identifierType",
              identifierValue: "$_id.identifierValue",
              shares: "$shares",
              totalShares: "$identifierTotalShares",
              totalInvestment: "$identifierTotalInvestment",
            },
          },
          companyTotalShares: { $sum: "$identifierTotalShares" },
          companyTotalInvestment: { $sum: "$identifierTotalInvestment" },
        },
      },
    ]);

    console.log("This is the sharesByCompany", sharesByCompany);

    const companyIds = sharesByCompany.map(
      (share) => new Types.ObjectId(share._id)
    );

    console.log("This is the companyIds", companyIds);

    const companies = await CompanyModel.find({ _id: { $in: companyIds } });

    console.log("This is the companies query", { _id: { $in: companyIds } });
    console.log("This is the companies", JSON.stringify(companies, null, 2));

    const portfolio: UserPortfolio = {
      totalShares: 0,
      totalInvestment: 0,
      companies: [],
    };

    for (const companyShare of sharesByCompany) {
      const company = companies.find(
        (c) => c._id.toString() === companyShare._id.toString()
      );
      if (company) {
        const companyInvestment: CompanyInvestment = {
          company: company,
          identifiers: companyShare.identifiers.map((id: any) => ({
            identifierType: id.identifierType,
            identifierValue: id.identifierValue,
            shares: id.shares.map((share: any) => ({
              shareClass: share.shareClass,
              totalShares: share.totalShares,
              totalInvestment: share.totalInvestment,
              shareStatuses: share.shareStatuses,
            })),
          })),
          identifierType: companyShare.identifiers[0]?.identifierType || "",
          identifierValue: companyShare.identifiers[0]?.identifierValue || "",
          totalShares: companyShare.companyTotalShares,
          totalInvestment: companyShare.companyTotalInvestment,
        };

        portfolio.companies.push(companyInvestment);
        portfolio.totalShares += companyShare.companyTotalShares;
        portfolio.totalInvestment += companyShare.companyTotalInvestment;
      }
    }

    return portfolio;
  } catch (error) {
    console.error("Error fetching user portfolio:", error);
    throw new Error("Failed to fetch user portfolio");
  }
}

async function getUserSharesInCompany(
  userId: string,
  companyId: string
): Promise<IShareModel[]> {
  try {
    return await ShareModel.find({
      userId: userId,
      companyId: companyId,
      shareStatus: "active",
      remainingShares: { $gt: 0 },
    });
  } catch (error) {
    console.error("Error fetching user shares in company:", error);
    throw new Error("Failed to fetch user shares in company");
  }
}

async function getTotalInvestment(userId: string): Promise<number> {
  try {
    const result = await ShareModel.aggregate([
      {
        $match: {
          userId: userId,
          shareStatus: "active",
          remainingShares: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalInvestment: {
            $sum: { $multiply: ["$remainingShares", "$purchasePrice"] },
          },
        },
      },
    ]);
    return result.length > 0 ? result[0].totalInvestment : 0;
  } catch (error) {
    console.error("Error fetching total investment:", error);
    throw new Error("Failed to fetch total investment");
  }
}

interface ChartDataPoint {
  date: Date;
  totalValue: number;
  companies: {
    companyId: string;
    companyName: string;
    shareValue: number;
  }[];
}

interface PortfolioChartData {
  allTime: {
    data: ChartDataPoint[];
    returnPercent: number;
  };
  pastYear: {
    data: ChartDataPoint[];
    returnPercent: number;
  };
  pastThreeYears: {
    data: ChartDataPoint[];
    returnPercent: number;
  };
}

async function getPortfolioChartData(
  userId: string
): Promise<PortfolioChartData> {
  try {
    const shares = await ShareModel.find({
      userId,
      remainingShares: { $gt: 0 },
    }).lean();
    if (shares.length === 0) {
      throw new Error("No shares found for this user");
    }

    const shareTransactions = await ShareTransactionModel.find({
      userId,
    }).lean();
    const companyIds = Array.from(
      new Set(shares.map((share) => share.companyId.toString()))
    );
    const companies = await CompanyModel.find({
      _id: { $in: companyIds },
    }).lean();

    const now = moment();
    const oneYearAgo = moment().subtract(1, "year");
    const threeYearsAgo = moment().subtract(3, "years");

    let allTimeData: ChartDataPoint[] = [];
    let totalInvestment = 0;
    let currentValue = 0;

    for (const company of companies) {
      const companyShares = shares.filter(
        (share) => share.companyId.toString() === company._id.toString()
      );
      const sortedValuations = company.valuations.sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      for (const share of companyShares) {
        const purchaseDate = moment(share.purchaseDate);
        const shareClass = company.shareClasses.find(
          (sc: any) => sc._id.toString() === share.shareClassId.toString()
        );

        if (!shareClass) {
          console.warn(`ShareClass not found for share ${share._id}`);
          continue;
        }

        const purchaseTransaction = shareTransactions.find(
          (t) =>
            t.shareId.toString() === share._id.toString() &&
            t.transactionType === "buy"
        );
        if (!purchaseTransaction) {
          console.warn(`Purchase transaction not found for share ${share._id}`);
          continue;
        }

        const shareValue = purchaseTransaction.totalAmount;

        // Add purchase data point
        addDataPoint(
          allTimeData,
          purchaseDate.toDate(),
          shareValue,
          company,
          share.initialShares
        );

        totalInvestment += shareValue;

        // Handle partial sales
        const saleTransactions = shareTransactions.filter(
          (t) =>
            t.shareId.toString() === share._id.toString() &&
            t.transactionType === "sell"
        );

        for (const saleTransaction of saleTransactions) {
          const saleDate = moment(saleTransaction.transactionDate);
          const soldShares = saleTransaction.quantity;
          const saleValue = saleTransaction.totalAmount;

          // Add sale data point
          addDataPoint(
            allTimeData,
            saleDate.toDate(),
            -saleValue,
            company,
            -soldShares
          );

          currentValue -= saleValue;
        }

        // Calculate current value for remaining shares
        if (share.remainingShares > 0) {
          const latestValuation = sortedValuations[sortedValuations.length - 1];
          const latestSharePrice =
            latestValuation.sharePrices.find(
              (sp: any) =>
                sp.shareClassId.toString() === shareClass._id.toString()
            )?.price || 0;
          const remainingValue = latestSharePrice * share.remainingShares;
          currentValue += remainingValue;
        }
      }
    }

    // Sort and process the data
    allTimeData.sort((a, b) => a.date.getTime() - b.date.getTime());
    const allDates = getAllDatesBetween(allTimeData[0].date, now.toDate());
    const filledData = fillDataGaps(allDates, allTimeData);

    const pastYearData = filledData.filter((d) =>
      moment(d.date).isAfter(oneYearAgo)
    );
    const pastThreeYearsData = filledData.filter((d) =>
      moment(d.date).isAfter(threeYearsAgo)
    );

    const allTimeReturnPercent = calculateReturnPercent(
      filledData[0].totalValue,
      filledData[filledData.length - 1].totalValue
    );
    const pastYearReturnPercent = calculateReturnPercent(
      pastYearData[0].totalValue,
      pastYearData[pastYearData.length - 1].totalValue
    );
    const pastThreeYearsReturnPercent = calculateReturnPercent(
      pastThreeYearsData[0].totalValue,
      pastThreeYearsData[pastThreeYearsData.length - 1].totalValue
    );

    return {
      allTime: { data: filledData, returnPercent: allTimeReturnPercent },
      pastYear: { data: pastYearData, returnPercent: pastYearReturnPercent },
      pastThreeYears: {
        data: pastThreeYearsData,
        returnPercent: pastThreeYearsReturnPercent,
      },
    };
  } catch (error) {
    console.error("Error fetching portfolio chart data:", error);
    throw new Error("Failed to fetch portfolio chart data");
  }
}

function addDataPoint(
  allTimeData: ChartDataPoint[],
  date: Date,
  value: number,
  company: ICompanyModel,
  shareCount: number
) {
  const existingDataPoint = allTimeData.find((d) =>
    moment(d.date).isSame(date, "day")
  );
  if (existingDataPoint) {
    existingDataPoint.totalValue += value;
    const existingCompany = existingDataPoint.companies.find(
      (c) => c.companyId === company._id.toString()
    );
    if (existingCompany) {
      existingCompany.shareValue += value;
    } else {
      existingDataPoint.companies.push({
        companyId: company._id.toString(),
        companyName: company.name,
        shareValue: value,
      });
    }
  } else {
    allTimeData.push({
      date,
      totalValue: value,
      companies: [
        {
          companyId: company._id.toString(),
          companyName: company.name,
          shareValue: value,
        },
      ],
    });
  }
}

function findClosestValuation(
  valuations: ICompanyModel["valuations"],
  date: Date
): ICompanyModel["valuations"][0] | null {
  return valuations.reduce((prev, curr) => {
    return Math.abs(curr.date.getTime() - date.getTime()) <
      Math.abs(prev.date.getTime() - date.getTime())
      ? curr
      : prev;
  });
}

function getAllDatesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = moment(start);
  const endDate = moment(end);

  while (currentDate.isSameOrBefore(endDate)) {
    dates.push(currentDate.toDate());
    currentDate.add(1, "day");
  }

  return dates;
}

function fillDataGaps(
  allDates: Date[],
  data: ChartDataPoint[]
): ChartDataPoint[] {
  let lastKnownData: ChartDataPoint | null = null;

  return allDates.map((date) => {
    const existingData = data.find((d) => moment(d.date).isSame(date, "day"));
    if (existingData) {
      lastKnownData = existingData;
      return existingData;
    }

    return lastKnownData
      ? { ...lastKnownData, date }
      : { date, totalValue: 0, companies: [] };
  });
}

function calculateReturnPercent(
  initialValue: number,
  finalValue: number
): number {
  return ((finalValue - initialValue) / initialValue) * 100;
}

export default {
  getUserPortfolio,
  getUserSharesInCompany,
  getTotalInvestment,
  getPortfolioChartData,
};
