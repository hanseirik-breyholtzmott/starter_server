import { Request, Response, NextFunction, response } from "express";

//Services
import userService from "../service/userService";
import notificationService from "../service/notificationService";
import emailService from "../service/emailService";
import errorService from "../service/errorService";
import shareService from "../service/shareService";
import transactionService from "../service/transactionService";

//Models
import UsersModel from "../models/users.model";
import SharesModel from "../models/shares.model";
import TransactionModel, { ITransaction } from "../models/transaction.model";
//Types
import { JwtPayload } from "../types/authTypes";

const purchaseShares = async (req: Request, res: Response) => {
  const { userId, numberOfShares, purchasePrice, ssn, stripePaymentId } =
    req.body;
  console.log(req.body);

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
      `You have bought ${numberOfShares} shares for ${purchasePrice} kr.`,
      "info"
    );

    //Create a transaction
    const transactionData: ITransaction = {
      userId: user.user_id,
      stripePaymentId: `Emisjon_${ssn.slice(-5)}`, // You might want to generate a unique ID
      paymentMethod: "bank_transfer", // Adjust as needed
      transactionType: "shares",
      amount: purchasePrice,
      currency: "NOK", // Adjust if needed
      status: "pending", // Set initial status as pending
      taxAmount: 0, // Adjust if applicable
      taxRate: 0, // Adjust if applicable
      discount: 0, // Adjust if applicable
      metadata: new Map([["sharesPurchased", numberOfShares.toString()]]),
      transactionDate: new Date(),
    };

    const newTransaction = await transactionService.createTransaction(
      transactionData
    );

    if (!newTransaction) {
      return res.status(500).json({
        success: false,
        message: "Error creating transaction",
      });
    }

    // Send email with stock puchase
    const email = await emailService.sendEmail(
      "Folkekraft emisjon <folkekraft@resend.dev>",
      [user.primaryEmailAddress],
      "Kvittering på tegning av Folkekraft aksjer",
      `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <!--$-->
  </head>

  <body
    style="
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #ffffff;
    "
  >
    <table
      align="center"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="
        max-width: 100%;
        margin: 0 auto;
        padding: 20px 0 48px;
        width: 660px;
      "
    >
      <tbody>
        <tr style="width: 100%">
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                    >
                      <tbody style="width: 100%">
                        <tr style="width: 100%">
                          <td data-id="__react-email-column"></td>
                          <td
                            align="right"
                            data-id="__react-email-column"
                            style="display: table-cell"
                          >
                            <p
                              style="
                                font-size: 32px;
                                line-height: 24px;
                                margin: 16px 0;
                                font-weight: 300;
                                color: #888888;
                              "
                            >
                              Kvittering
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
            >
              <tbody>
                <tr>
                  <td>
                    <p
                      style="
                        font-size: 14px;
                        line-height: 24px;
                        margin: 36px 0 40px 0;
                        text-align: center;
                        font-weight: 500;
                        color: #111111;
                      "
                    >
                      <strong>Betaling</strong><br />
                      Takk for at kjøper aksjer i Folkekraft! Du har nå mottatt
                      en kjøpskvittering på epost med betalingsinformasjon. Husk
                      at bankoverføring til Folkekraft er nødvendig for å
                      ferdigstille kjøpsprosessen.
                    </p>
                    
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="
                border-collapse: collapse;
                border-spacing: 0px;
                color: rgb(51, 51, 51);
                background-color: rgb(250, 250, 250);
                border-radius: 3px;
                font-size: 12px;
              "
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="height: 46px"
                    >
                      <tbody style="width: 100%">
                        <tr style="width: 100%">
                          <td colspan="2" data-id="__react-email-column">
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                            >
                              <tbody>
                                <tr>
                                  <td>
                                    <table
                                      align="center"
                                      width="100%"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                    >
                                      <tbody style="width: 100%">
                                        <tr style="width: 100%">
                                          <td
                                            data-id="__react-email-column"
                                            style="
                                              padding-left: 20px;
                                              border-style: solid;
                                              border-color: white;
                                              border-width: 0px 1px 1px 0px;
                                              height: 44px;
                                            "
                                          >
                                            <p
                                              style="
                                                font-size: 10px;
                                                line-height: 1.4;
                                                margin: 0;
                                                padding: 0;
                                                color: rgb(102, 102, 102);
                                              "
                                            >
                                              EPOST
                                            </p>
                                            <a
                                              style="
                                                color: #15c;
                                                text-decoration: underline;
                                                font-size: 12px;
                                                margin: 0;
                                                padding: 0;
                                                line-height: 1.4;
                                              "
                                              target="_blank"
                                              >${user.primaryEmailAddress}</a
                                            >
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table
                                      align="center"
                                      width="100%"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                    >
                                      <tbody style="width: 100%">
                                        <tr style="width: 100%">
                                          <td
                                            data-id="__react-email-column"
                                            style="
                                              padding-left: 20px;
                                              border-style: solid;
                                              border-color: white;
                                              border-width: 0px 1px 1px 0px;
                                              height: 44px;
                                            "
                                          >
                                            <p
                                              style="
                                                font-size: 10px;
                                                line-height: 1.4;
                                                margin: 0;
                                                padding: 0;
                                                color: rgb(102, 102, 102);
                                              "
                                            >
                                              TEGNINGSDATO
                                            </p>
                                            <p
                                              style="
                                                font-size: 12px;
                                                line-height: 1.4;
                                                margin: 0;
                                                padding: 0;
                                              "
                                            >
                                              ${Date.now()}
                                            </p>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table
                                      align="center"
                                      width="100%"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                    >
                                      <tbody style="width: 100%">
                                        <tr style="width: 100%">
                                          <td
                                            data-id="__react-email-column"
                                            style="
                                              padding-left: 20px;
                                              border-style: solid;
                                              border-color: white;
                                              border-width: 0px 1px 1px 0px;
                                              height: 44px;
                                            "
                                          >
                                            <p
                                              style="
                                                font-size: 10px;
                                                line-height: 1.4;
                                                margin: 0;
                                                padding: 0;
                                                color: rgb(102, 102, 102);
                                              "
                                            >
                                              MELDING
                                            </p>
                                            <p
                                              style="
                                                font-size: 12px;
                                                line-height: 1.4;
                                                margin: 0;
                                                padding: 0;
                                              "
                                            >
                                              Emisjon ${ssn.slice(-5)}
                                            </p>
                                          </td>
                                          <td
                                            data-id="__react-email-column"
                                            style="
                                              padding-left: 20px;
                                              border-style: solid;
                                              border-color: white;
                                              border-width: 0px 1px 1px 0px;
                                              height: 44px;
                                            "
                                          >
                                            <p
                                              style="
                                                font-size: 10px;
                                                line-height: 1.4;
                                                margin: 0;
                                                padding: 0;
                                                color: rgb(102, 102, 102);
                                              "
                                            >
                                              BANKKONTO
                                            </p>
                                            <p
                                              style="
                                                font-size: 12px;
                                                line-height: 1.4;
                                                margin: 0;
                                                padding: 0;
                                              "
                                            >
                                              3208 27 99299
                                            </p>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                          <td
                            colspan="2"
                            data-id="__react-email-column"
                            style="
                              padding-left: 20px;
                              border-style: solid;
                              border-color: white;
                              border-width: 0px 1px 1px 0px;
                              height: 44px;
                            "
                          >
                            <p
                              style="
                                font-size: 10px;
                                line-height: 1.4;
                                margin: 0;
                                padding: 0;
                                color: rgb(102, 102, 102);
                              "
                            >
                              TEGNET AV
                            </p>

                            <p
                              style="
                                font-size: 12px;
                                line-height: 1.4;
                                margin: 0;
                                padding: 0;
                              "
                            >
                              ${user.firstName + user.lastName}
                            </p>
                            <p
                              style="
                                font-size: 12px;
                                line-height: 1.4;
                                margin: 0;
                                padding: 0;
                              "
                            >
                              ${ssn}
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="
                border-collapse: collapse;
                border-spacing: 0px;
                color: rgb(51, 51, 51);
                background-color: rgb(250, 250, 250);
                border-radius: 3px;
                font-size: 12px;
                margin: 30px 0 15px 0;
                height: 24px;
              "
            >
              <tbody>
                <tr>
                  <td>
                    <p
                      style="
                        font-size: 14px;
                        line-height: 24px;
                        margin: 0;
                        background: #fafafa;
                        padding-left: 10px;
                        font-weight: 500;
                      "
                    >
                      Folkekraft emisjon
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                    >
                      <tbody style="width: 100%">
                        <tr style="width: 100%">
                          <td
                            data-id="__react-email-column"
                            style="width: 64px"
                          >
                            <img
                              alt="Folkekraft"
                              height="64"
                              src="https://play-lh.googleusercontent.com/imVxwK62k8Fe_XOyWB81MPSPm5Km-Q5V1av2i_jTYjtaoUEG4Xw_UyXkPMIL8uKPp0Q=w240-h480-rw"
                              style="
                                display: block;
                                outline: none;
                                border: 1px solid rgba(128, 128, 128, 0.2);
                                text-decoration: none;
                                margin: 0 0 0 20px;
                                border-radius: 14px;
                              "
                              width="64"
                            />
                          </td>
                          <td
                            data-id="__react-email-column"
                            style="padding-left: 22px"
                          >
                            <p
                              style="
                                font-size: 12px;
                                line-height: 1.4;
                                margin: 0;
                                font-weight: 600;
                                padding: 0;
                              "
                            >
                              Folkekraft emisjon 2024
                            </p>
                            <p
                              style="
                                font-size: 12px;
                                line-height: 1.4;
                                margin: 0;
                                color: rgb(102, 102, 102);
                                padding: 0;
                              "
                            >
                              Folkekraft kurs pr aksje: 8,0 kr
                            </p>
                            <p
                              style="
                                font-size: 12px;
                                line-height: 1.4;
                                margin: 0;
                                color: rgb(102, 102, 102);
                                padding: 0;
                              "
                            >
                              Antall aksjer kjøpt: ${numberOfShares}
                            </p>
                          </td>
                          <td
                            align="right"
                            data-id="__react-email-column"
                            style="
                              display: table-cell;
                              padding: 0px 20px 0px 0px;
                              width: 100px;
                              vertical-align: top;
                            "
                          >
                            <p
                              style="
                                font-size: 12px;
                                line-height: 24px;
                                margin: 0;
                                font-weight: 600;
                              "
                            >
                              ${numberOfShares * 8} kr
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <hr
              style="
                width: 100%;
                border: none;
                border-top: 1px solid #eaeaea;
                margin: 30px 0 0 0;
              "
            />
            <table
              align="right"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                    >
                      <tbody style="width: 100%">
                        <tr style="width: 100%">
                          <td
                            align="right"
                            data-id="__react-email-column"
                            style="display: table-cell"
                          >
                            <p
                              style="
                                font-size: 10px;
                                line-height: 24px;
                                margin: 0;
                                color: rgb(102, 102, 102);
                                font-weight: 600;
                                padding: 0px 30px 0px 0px;
                                text-align: right;
                              "
                            >
                              TOTAL
                            </p>
                          </td>
                          <td
                            data-id="__react-email-column"
                            style="
                              height: 48px;
                              border-left: 1px solid;
                              border-color: rgb(238, 238, 238);
                            "
                          ></td>
                          <td
                            data-id="__react-email-column"
                            style="display: table-cell; width: 90px"
                          >
                            <p
                              style="
                                font-size: 16px;
                                line-height: 24px;
                                margin: 0px 20px 0px 0px;
                                font-weight: 600;
                                white-space: nowrap;
                                text-align: right;
                              "
                            >
                              ${numberOfShares * 8} kr
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <hr
              style="
                width: 100%;
                border: none;
                border-top: 1px solid #eaeaea;
                margin: 0 0 75px 0;
              "
            />

            <p
              style="
                font-size: 12px;
                line-height: auto;
                margin: 0;
                color: rgb(102, 102, 102);
                margin-bottom: 16px;
              "
            >
              Enhver investering i aksjer er beheftet med betydelig risiko. En
              investor bør ikke investere i aksjer dersom vedkommende ikke har
              råd til å tape hele investeringen.
            </p>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>
`
    );

    //New shares
    var newShares = new SharesModel({
      userId: user.user_id,
      transactionId: newTransaction._id,
      numberOfShares: numberOfShares,
      purchasePrice: purchasePrice,
      ssn: ssn,
    });

    const savedPurchase = await newShares.save();

    if (!savedPurchase) {
      return res.status(200).json({
        success: false,
        message: "Error when saving the purchase",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Du har tegnet deg ${numberOfShares} aksjer i Folkekraft AS.`,
    });
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

    const convertedLoanAmount = 4206840;
    const convertedLoanShares = 0;
    const convertedLoanPurchase = 0;

    const totalShares = await shareService.countTotalSharesIn2024();

    const totalSharesByUser = await shareService.countSharesByUserId(userId);

    const countPurchases = await shareService.countPurcahsesAfter2023();

    return res.status(200).json({
      user: {
        totalShares: totalSharesByUser,
        recommendedPurchase: user.recommendedShares,
        purchaseRight: user.purchaseRight,
      },
      data: {
        totalShares: totalShares + convertedLoanShares,
        totalAmount: totalShares * 8 + convertedLoanAmount,
        totalPurchases: countPurchases,
        closingDate: null,
        sharesAvailable:
          (8000000 - (totalShares * 8 + convertedLoanAmount)) / 8,
        goal: ((totalShares * 8 + convertedLoanAmount) / 8000000).toFixed(2),
      },
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

const getCapTable = async (req: Request, res: Response) => {
  try {
    const capTable = await shareService.getSharesWithUserDetails();

    const totalShares = capTable.reduce(
      (sum, entry) => sum + entry.totalShares,
      0
    );

    const capTableWithPercentage = capTable.map((entry) => ({
      ...entry,
      ownershipPercentage:
        ((entry.totalShares / totalShares) * 100).toFixed(2) + "%",
    }));

    return res.status(200).json({
      success: true,
      message: "Cap table retrieved successfully",
      capTable: capTableWithPercentage,
      totalShares,
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

const getPurchaseRight = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    const user = await UsersModel.findById(userId);

    if (!user) {
      return errorService.handleClientError(res, 400, "User not found");
    }

    return res.status(200).json({
      success: true,
      message: "Purchase right retrieved successfully",
      recommendedPurchase: user.recommendedShares,
      purchaseRight: user.purchaseRight,
    });
  } catch (error) {
    console.log(error);
  }
};

export default {
  purchaseShares,
  totalSharesByUserId,
  campaginInfo,
  getCapTable,
  getPurchaseRight,
};
