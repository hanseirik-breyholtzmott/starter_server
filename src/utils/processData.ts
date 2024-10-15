import { UserPortfolio } from "../service/portfolio.service";
import { IShareClass } from "../models/company.model";

interface ProcessedUserPortfolioData {
  companyId: string;
  companyName: string;
  identifierType: string;
  identifierValue: string;
  shareClassId: string;
  shareClassName: string;
  totalShares: number;
  totalInvestment: number;
}

const processUserPortfolio = (
  portfolio: UserPortfolio
): ProcessedUserPortfolioData[] => {
  const processedData: ProcessedUserPortfolioData[] = [];

  portfolio.companies.forEach((companyData) => {
    const { company, identifiers } = companyData;

    identifiers.forEach((id) => {
      id.shares.forEach((share) => {
        // Find the share class name from the company's shareClasses array
        const shareClass = company.shareClasses.find(
          (sc: IShareClass) => sc._id.toString() === share.shareClass.toString()
        );

        // Add identifierType and identifierValue in the object
        processedData.push({
          companyId: company._id.toString(),
          companyName: company.name,
          identifierType: id.identifierType, // Adding identifierType
          identifierValue: id.identifierValue, // Adding identifierValue
          shareClassId: share.shareClass.toString(),
          shareClassName: shareClass ? shareClass.name : "Common", // Share class name
          totalShares: share.totalShares,
          totalInvestment: share.totalInvestment,
        });
      });
    });
  });

  return processedData;
};

export default {
  processUserPortfolio,
};
