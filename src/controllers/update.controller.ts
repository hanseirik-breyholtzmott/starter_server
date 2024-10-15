import { Request, Response } from "express";
import { startSession, Types } from "mongoose";

//Models
import ShareModel from "../models/share.model";
import CompanyModel from "../models/company.model";
import UserModel from "../models/users.model";
import CampaignModel, { ICampaignModel } from "../models/campaign.model";
import TransactionModel from "../models/transaction.model";

//Services
import companyService from "../service/company.service";
import shareTransactionService from "../service/shareTransaction.service";
import userService from "../service/user.service";

async function updateSystems(req: Request, res: Response) {
  const session = await startSession();

  session.startTransaction();

  //Update shares model
  const shares = await ShareModel.find({});

  for (const share of shares) {
    //Update the userId
    if (!share.userId) {
      console.warn(`Share has no userId: ${share._id}`);
      continue; // Skip this iteration if userId is not defined
    }
    const user = await UserModel.findOne({ user_id: share.userId });

    //console.log("this user is being updated: ", user.user_id);

    if (!user) {
      console.warn(`User not found for userId: ${share.userId}`);
      continue; // Skip this iteration if user is not found
    }

    var updatedFields = {
      companyId: new Types.ObjectId("670e671ecbcbc440be62fa88"),
      userId: user._id as Types.ObjectId,
      shareClassId: new Types.ObjectId("670e671ecbcbc440be62fa8a"),
      identifier: share.ssn
        ? share.ssn.length === 11
          ? {
              type: "ssn",
              value: share.ssn,
            }
          : {
              type: "registrationNumber",
              value: share.ssn,
            }
        : {
            type: "unknown",
            value: "N/A",
          },
      shareStatus: "active",
      isLocked: false,
      initialShares: share.numberOfShares,
      remainingShares: share.numberOfShares,
      transactions: [] as Types.ObjectId[],
      $unset: { ssn: "" },
    };

    //Create share transaction
    /*
    const newShareTransaction = {
      shareId: share._id as Types.ObjectId,
      transactionId: new Types.ObjectId(share.transactionId),
      userId: user._id as Types.ObjectId,
      companyId: new Types.ObjectId("670d8241a00c8f50ffc5f208"),
      shareClassId: new Types.ObjectId("670d8241a00c8f50ffc5f20a"),
      transactionType: "buy",
      quantity: share.numberOfShares || 1,
      pricePerShare: 0,
      totalAmount: 0,
      transactionDate: new Date(),
      status: "completed",
    };

    const shareTransaction =
      await shareTransactionService.createShareTransaction(newShareTransaction);
      */

    //updatedFields.transactions = [shareTransaction._id as Types.ObjectId];
    //updatedFields.$unset = { ssn: "", transactionId: "" };

    //Update the document with the new structure
    const updatedShare = await ShareModel.updateOne(
      { _id: share._id },
      { $set: updatedFields }
    );
    console.log("updated share: ", share._id);
  }

  //After updating the shares, update the user model
  /*const users = await UserModel.find({});
  for (const user of users) {
    const updatedFields = {
      userId: new Types.ObjectId(user.user_id),
      $unset: { user_id: "" },
    };

    await UserModel.updateOne({ _id: user._id }, { $set: updatedFields });
  }*/

  //Update transactions

  // Commit the transaction
  await session.commitTransaction();
  session.endSession();

  return res.status(200).json({
    message: "Systems updated",
  });
}

async function checkShareUser(req: Request, res: Response) {
  const shares = await ShareModel.findById("66e1694f800d818680a59344");
  var count = 0;

  const user = await UserModel.findOne({ user_id: shares?.userId });

  return res.status(200).json({
    message: `All shares have a userId: 1`,
    shares: shares,
    ssn: (shares?.ssn as string).length,
    userId: shares?.userId,
    user: user,
  });
}

async function createCompany(req: Request, res: Response) {
  const company = await CompanyModel.create({
    name: "Folkekraft AS",
    establishedDate: new Date("2022-09-27"),
    registrationNumber: "830068112",
    active: true,
  });

  //Create share class

  const shareClassInvestor = {
    name: "Investor",
    votingRights: true,
    dividendRights: true,
  };

  const shareClassKunde = {
    name: "Kunde",
    votingRights: true,
    dividendRights: true,
  };

  const shareClassVerving = {
    name: "Verving",
    votingRights: true,
    dividendRights: true,
  };

  const newShareClassInvestor = await companyService.addShareClass(
    company._id as string,
    shareClassInvestor
  );

  const newShareClassKunde = await companyService.addShareClass(
    company._id as string,
    shareClassKunde
  );

  const newShareClassVerving = await companyService.addShareClass(
    company._id as string,
    shareClassVerving
  );

  return res.status(200).json({
    message: `Company created`,
    company: company,
    shareClassInvestor: newShareClassInvestor,
    shareClassKunde: newShareClassKunde,
    shareClassVerving: newShareClassVerving,
  });
}

async function createCampaign(req: Request, res: Response) {
  const company = await CompanyModel.findById("670edea8e7287630bb8a389a");
  //Create campaign

  const newCampaign = {
    companyId: company._id as Types.ObjectId,
    campaignInfo: {
      name: "Folkekraft AS",
      description:
        "Folkekraft AS er et strømselskap der all kunder er medeier i selskapet.",
      tags: ["medeierskap", "b2c", "fintech", "emisjon", "energi"],
    },
    investmentDetails: {
      minimumInvestment: 2400,
      maximumInvestment: 1000000,
      shareClassId: new Types.ObjectId("670edea9e7287630bb8a389d"),
      sharePrice: 8,
      startDate: new Date("2024-09-01"),
      closingDate: new Date("2024-10-18"),
      status: "active",
      startAmount: 4206840,
      targetAmount: 8000000,
      availableShares: 1000000,
    },
    perks: [
      {
        title: "Bli kunde",
        actionText: "Få 1.000 kr i aksjeverdi i Folkekraft",
        description:
          "Du får en av Norges billigste strømavtaler og støtter selskapet du er med å eie.",
        button: {
          text: "Bli kunde",
          link: "/bestill",
        },
      },
      {
        title: "Verve 1: 1.000 kr per verving",
        actionText: "Få 1.000 kr i aksjer per verving",
        description:
          "Vi øker vervepremien fra 300 kr til 1.000 kr for alle medeiere i kampanjeperioden.",
        button: {
          text: "Hente verve lenke",
          link: "/folkekraft/portfolio",
        },
      },
      {
        title: "Verve 5: Få strøm til kostpris",
        actionText: "Få strøm til vår innkjøpspris i ett år",
        description:
          "Du får 5.000 kr i aksjeverdi og strøm til vår innkjøpspris i ett år.",
        button: {
          text: "Hente verve lenke",
          link: "/folkekraft/portfolio",
        },
      },
      {
        title: "Verve 10: Vinn 100.000 kr i aksjer",
        actionText: "Bli med i trekningen av 100.000 kr i aksjeverdi!",
        description:
          "Alle som verver 10 får 10.000 kr i vervepremie og er med i trekning av 100.000 kr i aksjer.",
        button: {
          text: "Hente verve lenke",
          link: "/folkekraft/portfolio",
        },
      },
    ],
    documents: [
      {
        title: "Folkekraft Emisjon 2024",
        description: "Folkekraft emisjonspresentasjon",
        fileName: "folkekraft_emisjonpresentasjon.pdf",
        url: "https://utfs.io/f/13ccf2e2-4eb3-44c0-bc0d-93de7e633b5d-oymfrz.pdf",
      },
      {
        title: "Financial model Folkekraft",
        description: "Finansiell prognosemodell",
        fileName: "folkekraft_finansmodell.pdf",
        url: "https://utfs.io/f/e76d4dbf-b22f-4e26-88aa-a70df1fe5c56-ry0du0.pdf",
      },
      {
        title: "Verdsettelsesmodell",
        description: "Fremtidig verdsettelsesmodell",
        fileName: "verdsettelse.pdf",
        url: "https://utfs.io/f/4a34c5b0-da63-4db8-9bab-f34c69466acd-n1l38s.pdf",
      },
      {
        title: "Folkekraft AS Årsrapport",
        description: "Folkekraft AS Årsrapport 2023",
        fileName: "folkekraft_as_årsrapport_2023.pdf",
        url: "https://utfs.io/f/19ee23c6-c325-4b78-ad47-f8c45945f640-991f3d.pdf",
      },
      {
        title: "Notat disput med Props",
        description: "Notat om disput med IT-leverandør",
        fileName: "notat_disput_med_props.pdf",
        url: "https://utfs.io/f/b049b0f0-9886-4eb9-8a93-db4a93bc7c78-m39y0.pdf",
      },
      {
        title: "Reklamasjon Havskraft",
        description: "Reklamasjon Havskraft",
        fileName: "reklamasjon_havskraft.pdf",
        url: "https://utfs.io/f/7b70d7ae-2b3b-4edc-bd53-cb262ad5d0d2-zc0vpm.pdf",
      },
    ],
  };

  const campaign = await CampaignModel.create(newCampaign);

  return res.status(200).json({
    message: `Campaign created`,
    campaign: campaign,
  });
}

async function updateShareTransactions(req: Request, res: Response) {
  //Update shares model
  const shares = await ShareModel.find({});

  for (const share of shares) {
    //Update the userId
    if (!share.userId) {
      console.warn(`Share has no userId: ${share._id}`);
      continue; // Skip this iteration if userId is not defined
    }

    const user = await userService.getUserById(share.userId.toString());
    console.log("this user is being updated: ", user.user_id);

    if (!user) {
      console.warn(`User not found for userId: ${share.userId}`);
      continue; // Skip this iteration if user is not found
    }

    //Create share transaction

    const newShareTransaction = {
      shareId: share._id as Types.ObjectId,
      transactionId: new Types.ObjectId(share.transactionId),
      userId: user._id as Types.ObjectId,
      companyId: new Types.ObjectId("670e671ecbcbc440be62fa88"),
      shareClassId: new Types.ObjectId("670e671ecbcbc440be62fa8a"),
      transactionType: "buy",
      quantity: share.numberOfShares || 1,
      pricePerShare: new Date(share.purchaseDate).getFullYear() < 2024 ? 12 : 8,
      totalAmount:
        share.numberOfShares *
        (new Date(share.purchaseDate).getFullYear() < 2024 ? 12 : 8),
      transactionDate: new Date(share.purchaseDate),
      status: "completed",
    };

    const shareTransaction =
      await shareTransactionService.createShareTransaction(newShareTransaction);

    //Update the document with the new structure
  }

  //After updating the shares, update the user model
  /*const users = await UserModel.find({});
  for (const user of users) {
    const updatedFields = {
      userId: new Types.ObjectId(user.user_id),
      $unset: { user_id: "" },
    };

    await UserModel.updateOne({ _id: user._id }, { $set: updatedFields });
  }*/

  //Update transactions

  // Commit the transaction

  return res.status(200).json({
    message: `All shares have a userId: 1`,
  });
}

export default {
  updateSystems,
  checkShareUser,
  createCompany,
  createCampaign,
  updateShareTransactions,
};
