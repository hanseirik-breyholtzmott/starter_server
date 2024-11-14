import { Request, Response } from "express";

//Models
import CompanyModel from "../../models/company.model";
import SharesModel from "../../models/share.model";

//Services
import companyService from "../../service/company.admin.service";

//getShareholderCount
//getSharesCount
//getNumberOfShareClasses
//getPricePerShare

//getShareTransactionInChart
//getmostRecentTransactions
//get5LargestShareholders

const getShareholderCount = async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const shareholderCount = await CompanyModel.countDocuments({ companyId });
    return res.status(200).json({ shareholderCount });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getSharesCount = async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const sharesCount = await CompanyModel.countDocuments({ companyId });
    return res.status(200).json({ sharesCount });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getNumberOfShareClasses = async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const numberOfShareClasses = await CompanyModel.countDocuments({
      companyId,
    });
    return res.status(200).json({ numberOfShareClasses });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getPricePerShare = async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const pricePerShare = await CompanyModel.countDocuments({ companyId });
    return res.status(200).json({ pricePerShare });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getShareTransactionInChart = async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const shareTransactionInChart = await CompanyModel.countDocuments({
      companyId,
    });
    return res.status(200).json({ shareTransactionInChart });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getMostRecentTransactions = async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const mostRecentTransactions = await CompanyModel.countDocuments({
      companyId,
    });
    return res.status(200).json({ mostRecentTransactions });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const get5LargestShareholders = async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const fiveLargestShareholders = await CompanyModel.countDocuments({
      companyId,
    });
    return res.status(200).json({ fiveLargestShareholders });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* Cap Table */

export default {
  getShareholderCount,
  getSharesCount,
  getNumberOfShareClasses,
  getPricePerShare,
  getShareTransactionInChart,
  getMostRecentTransactions,
  get5LargestShareholders,
};
