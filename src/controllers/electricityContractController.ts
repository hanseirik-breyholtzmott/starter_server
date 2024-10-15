import { Request, Response } from "express";
import bcrypt from "bcrypt";

//Services

import electricityContractService from "../service/electricityContractService";

//Models
import { IUser } from "../models/users.model";
import { IShare } from "../models/share.model";
import { ITransaction } from "../models/transaction.model";
/*
class ElectricityContractController {
  async createElectricityContract(req: Request, res: Response) {
    console.log("createElectricityContract");
    console.log(req.body);
    const {
      email,
      firstName,
      lastName,
      phone,
      address,
      city,
      postalCode,
      ssn,
      referralUserName,
      referralUserId,
    } = req.body;

    // Check if user with the given email already exists
    const existingUser = await userService.getUserByEmail(email);

    let user: IUser;

    if (existingUser) {
      user = existingUser as IUser;
    } else {
      // Generate a random password
      const password = userService.generateRandomPassword();

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const newUser = await userService.createUser({
        ssn,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        address: {
          street: address,
          city,
          postalCode,
        },
        primaryEmailAddress: email,
        emailAddresses: [email],
        primaryPhoneNumber: phone,
        phoneNumbers: [phone],
        hasVerifiedPhoneNumber: false,
        passwordEnabled: false,
        password: hashedPassword,
        roles: [
          {
            name: "user",
            permissions: ["view_personal_data", "use_core_features"],
          },
        ],
      });

      if (!newUser) {
        return res.status(400).json({ message: "Failed to create user" });
      }

      user = newUser as IUser;
    }

    var newAddress = {
      street: address,
      city: city,
      postalCode: postalCode,
    };

    // Create new electricity contract
    const newElectricityContract =
      await electricityContractService.createElectricityContract(
        user.user_id as string,
        newAddress
      );

    //Create transaction
    const transactionData: ITransaction = {
      userId: user.user_id as string,
      transactionType: "shares",
      paymentMethod: "other",
      amount: 0,
      currency: "NOK",
      status: "paid",
      taxAmount: 0,
      taxRate: 0,
      discount: 0,
      transactionDate: new Date(),
    };

    const newTransaction = await transactionService.createTransaction(
      transactionData
    );

    if (!newTransaction) {
      return res.status(400).json({ message: "Failed to create transaction" });
    }

    // Create shares (locked)
    /*const shareData: IShare = {
      userId: user.user_id as string,
      transactionId: newTransaction._id as string,
      numberOfShares: 84,
      purchaseDate: new Date(),
      purchasePrice: 0,
      ssn: ssn,
      shareStatus: "locked",
      isLocked: true,
      unlockDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), //unlock after 2 years
    };

    const newShares = await shareService.createShare(shareData);

    if (!newShares) {
      return res.status(400).json({ message: "Failed to create share" });
    }

    // Check if referralUserId is not null
    if (referralUserId) {
      // Create transaction for referral user

      const referralUser = await userService.getUserByUserId(referralUserId);

      const referralTransactionData: ITransaction = {
        userId: referralUser.user_id as string,
        transactionType: "referral_bonus",
        paymentMethod: "other",
        amount: 0, // You might want to set a bonus amount
        currency: "NOK",
        status: "paid",
        taxAmount: 0,
        taxRate: 0,
        discount: 0,
        transactionDate: new Date(),
      };

      const referralTransaction = await transactionService.createTransaction(
        referralTransactionData
      );

      if (!referralTransaction) {
        console.error("Failed to create referral transaction");
        // You might want to handle this error, but we'll continue the process
      }

      console.log("referralTransaction", referralTransaction);

      console.log("referralUser", referralUser);

      // Create shares for referral user (unlocked)
      /*const referralShareData: IShare = {
        userId: referralUserId,
        transactionId: referralTransaction._id as string,
        numberOfShares: 25,
        purchaseDate: new Date(),
        purchasePrice: 0,
        ssn: referralUser.ssn, // You might need to fetch this or handle it differently
        shareStatus: "active",
        isLocked: false,
        referralBonus: true,
      };

      const referralShares = await shareService.createShare(referralShareData);

      if (!referralShares) {
        console.error("Failed to create referral shares");
        // You might want to handle this error, but we'll continue the process
      }
    }

      //Send email to hei@folkekraft.no
      await emailService.sendEmail(
        "Folkekraft Nye kunde <folkekraft@folkekraft.no>",
        ["hei@folkekraft.no"],
        "Ny kunde",
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Electricity contract created successfully",
      });
    }
  }
}

//export default new ElectricityContractController();*/
