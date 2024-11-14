import { Types } from "mongoose";

//Models
import CompanyModel, { ICompanyModel, ICompany } from "../models/company.model";
import { IUserModel } from "../models/users.model";

//Services

async function createCompany(companyData: ICompany): Promise<ICompanyModel> {
  try {
    const company = await CompanyModel.create(companyData);
    return await company.save();
  } catch (error) {
    console.error("Error creating company:", error);
    throw new Error("Failed to create company");
  }
}

async function getCompanyById(
  companyId: string
): Promise<ICompanyModel | null> {
  try {
    return await CompanyModel.findById(companyId);
  } catch (error) {
    console.error("Error fetching company by ID:", error);
    throw new Error("Failed to fetch company by ID");
  }
}

async function updateCompany(
  companyId: string,
  companyData: ICompany
): Promise<ICompanyModel | null> {
  try {
    return await CompanyModel.findByIdAndUpdate(companyId, companyData, {
      new: true,
    });
  } catch (error) {
    console.error("Error updating company:", error);
    throw new Error("Failed to update company");
  }
}

async function getAllCompanies(): Promise<ICompanyModel[]> {
  try {
    return await CompanyModel.find();
  } catch (error) {
    console.error("Error fetching all companies:", error);
    throw new Error("Failed to fetch all companies");
  }
}

async function addShareClass(
  companyId: string,
  shareClass: ICompany["shareClasses"][0]
): Promise<ICompanyModel | null> {
  try {
    return await CompanyModel.findByIdAndUpdate(
      companyId,
      { $push: { shareClasses: shareClass } },
      { new: true }
    );
  } catch (error) {
    console.error("Error adding share class:", error);
    throw new Error("Failed to add share class");
  }
}

async function getShareClassById(
  companyId: string,
  shareClassId: string
): Promise<any | null> {
  try {
    const company = await CompanyModel.findOne(
      { _id: companyId, "shareClasses._id": shareClassId },
      { "shareClasses.$": 1 } // Only return the matching share class
    );

    if (
      !company ||
      !company.shareClasses ||
      company.shareClasses.length === 0
    ) {
      return null;
    }

    return company.shareClasses[0]; // Since we're returning an array, the first element will be the match
  } catch (error) {
    console.error("Error fetching share class by ID:", error);
    throw new Error("Failed to fetch share class by ID");
  }
}

async function updateShareClass(
  companyId: string,
  shareClassId: string,
  updateData: Partial<ICompany["shareClasses"][0]>
): Promise<ICompanyModel | null> {
  try {
    return await CompanyModel.findOneAndUpdate(
      { _id: companyId, "shareClasses._id": shareClassId },
      { $set: { "shareClasses.$": updateData } },
      { new: true }
    );
  } catch (error) {
    console.error("Error updating share class:", error);
    throw new Error("Failed to update share class");
  }
}

async function removeShareClass(
  companyId: string,
  shareClassId: string
): Promise<ICompanyModel | null> {
  try {
    return await CompanyModel.findByIdAndUpdate(
      companyId,
      { $pull: { shareClasses: { _id: shareClassId } } },
      { new: true }
    );
  } catch (error) {
    console.error("Error removing share class:", error);
    throw new Error("Failed to remove share class");
  }
}

async function addDocument(
  companyId: string,
  document: ICompany["documents"][0]
): Promise<ICompanyModel | null> {
  try {
    return await CompanyModel.findByIdAndUpdate(
      companyId,
      { $push: { documents: document } },
      { new: true }
    );
  } catch (error) {
    console.error("Error adding document:", error);
    throw new Error("Failed to add document");
  }
}

async function removeDocument(
  companyId: string,
  documentId: string
): Promise<ICompanyModel | null> {
  try {
    return await CompanyModel.findByIdAndUpdate(
      companyId,
      { $pull: { documents: { _id: documentId } } },
      { new: true }
    );
  } catch (error) {
    console.error("Error removing document:", error);
    throw new Error("Failed to remove document");
  }
}

async function addStakeholder(
  companyId: string,
  stakeholderId: string
): Promise<ICompanyModel | null> {
  try {
    return await CompanyModel.findByIdAndUpdate(
      companyId,
      { $addToSet: { stakeholders: stakeholderId } },
      { new: true }
    );
  } catch (error) {
    console.error("Error adding stakeholder:", error);
    throw new Error("Failed to add stakeholder");
  }
}

async function removeStakeholder(
  companyId: string,
  stakeholderId: string
): Promise<ICompanyModel | null> {
  try {
    return await CompanyModel.findByIdAndUpdate(
      companyId,
      { $pull: { stakeholders: stakeholderId } },
      { new: true }
    );
  } catch (error) {
    console.error("Error removing stakeholder:", error);
    throw new Error("Failed to remove stakeholder");
  }
}

interface ShareholderEntity {
  identifierType: string;
  identifierValue: string;
  shares: number;
  averagePurchasePrice: number;
}

interface Shareholder {
  user: IUserModel;
  entity: ShareholderEntity[];
}
/*
async function getShareholdersByDate(
  date: Date,
  companyId: string
): Promise<Shareholder[]> {
  try {
    const companyObjectId = new Types.ObjectId(companyId);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const shares = await ShareModel.find({
      companyId: companyObjectId,
      purchaseDate: { $lte: endOfDay },
      shareStatus: { $in: ["active", "locked"] },
    }).populate("userId");

    const shareholderMap = new Map<string, Shareholder>();

    for (const share of shares) {
      const userId = typeof share.userId === 'string' ? share.userId : share.userId._id.toString();
      const user = share.userId as IUserModel;

      if (!shareholderMap.has(userId)) {
        shareholderMap.set(userId, {
          user: user,
          entity: [],
        });
      }

      const shareholder = shareholderMap.get(userId)!;
      const existingEntity = shareholder.entity.find(
        (entry) =>
          entry.identifierType === share.identifier.type &&
          entry.identifierValue === share.identifier.value
      );

      if (existingEntity) {
        const totalValue =
          existingEntity.averagePurchasePrice * existingEntity.shares;
        const newTotalShares = existingEntity.shares + share.numberOfShares;
        const newTotalValue =
          totalValue + share.purchasePrice * share.numberOfShares;
        existingEntity.shares = newTotalShares;
        existingEntity.averagePurchasePrice = newTotalValue / newTotalShares;
      } else {
        shareholder.entity.push({
          identifierType: share.identifier.type,
          identifierValue: share.identifier.value,
          shares: share.numberOfShares,
          averagePurchasePrice: share.purchasePrice,
        });
      }
    }

    return Array.from(shareholderMap.values());
  } catch (error) {
    console.error("Error in getShareholdersByDateAndCompany:", error);
    throw error;
  }
}*/

export default {
  createCompany,
  getCompanyById,
  updateCompany,
  getAllCompanies,
  addShareClass,
  getShareClassById,
  updateShareClass,
  removeShareClass,
  addDocument,
  removeDocument,
  addStakeholder,
  removeStakeholder,
  //getShareholdersByDate,
};
