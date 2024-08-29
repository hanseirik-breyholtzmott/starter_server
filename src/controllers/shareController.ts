import { Request, Response, NextFunction, response } from "express";

//Services
import userService from "../service/userService";
import notificationService from "../service/notificationService";
import emailService from "../service/emailService";
import errorService from "../service/errorService";
import shareService from "../service/shareService";

//Models
import UsersModel from "../models/users.model";
import SharesModel from "../models/shares.model";

//Types
import { JwtPayload } from "../types/authTypes";

const purchaseShares = async (req: Request, res: Response) => {
  const { userId, numberOfShares, purchasePrice } = req.body;

  try {
    //Check if the user exists
    const user = await userService.getUserByUserId(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    //Create a notification
    const notification = await notificationService.createNotification(
      user.user_id,
      `You have bought ${numberOfShares} shares.`,
      `You have bought ${numberOfShares} shares for ${
        numberOfShares * purchasePrice
      } kr.`,
      "info"
    );

    // Send email with stock puchase
    const email = await emailService.sendEmail(
      "Get rich quick <lasseisgay@resend.dev>",
      [user.primaryEmailAddress],
      "You have purchased stocks.",
      `<strong>Thank you for purchasing ${numberOfShares} of Folkekraft.</strong> `
    );

    //New shares
    var newShares = new SharesModel({
      userid: user.user_id,
      numberOfShares: numberOfShares,
      purchasePrice: purchasePrice,
    });

    const savedPurchase = await newShares.save();

    if (!savedPurchase) {
      return res.status(200).json({
        success: false,
        message: "Error when saving the purchase",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "You have bought stocks" });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

const totalSharesByUserId = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    //Find user based on ID
    const user = await userService.getUserByUserId(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    const shares = await SharesModel.find({ userid: userId });

    let totalShares = 0;
    let totalInvested = 0;

    shares.forEach((share) => {
      totalShares += share.numberOfShares;
      totalInvested += share.numberOfShares * share.purchasePrice;
    });

    return res.status(200).json({
      success: true,
      message: "Found all the shares.",
      totalShares: totalShares,
      totalInvested: totalInvested,
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

const campaginInfo = async (req: Request, res: Response) => {
  /*const { userId } = req.body;

  const user = await userService.getUserByUserId(userId);

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not found.",
    });
  }*/

  const userId = req.params.userId;

  try {
    //Find user based on ID
    const user = await userService.getUserByUserId(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    const convertedLoanAmount = 2344625.2;
    const convertedLoanShares = 0;
    const convertedLoanPurchase = 0;

    const totalShares = await shareService.countTotalSharesIn2024();

    const totalSharesByUser = await shareService.countSharesByUserId(userId);

    const countPurchases = await shareService.countPurcahsesAfter2023();

    return res.status(200).json({
      user: {
        totalShares: totalSharesByUser,
      },
      data: {
        totalShares: totalShares + convertedLoanShares,
        totalAmount: totalShares * 8 + convertedLoanAmount,
        totalPurchases: countPurchases,
        closingDate: null,
        goal: ((totalShares * 8 + convertedLoanAmount) / 8000000).toFixed(2),
      },
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

export default { purchaseShares, totalSharesByUserId, campaginInfo };
