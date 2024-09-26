import { Request, Response } from "express";

//Services
import userService from "../service/userService";
import shareService from "../service/shareService";
import notificationService from "../service/notificationService";
import transactionService from "../service/transactionService";
import emailService from "../service/emailService";

//Models
import TransactionModel, { ITransaction } from "../models/transaction.model";
import SharesModel, { IShare, IShareModel } from "../models/shares.model";

//Logger
import { campaignLogger } from "../logger";

class CampaignController {
  async getCampaign(req: Request, res: Response) {
    const campaignId = req.params.campaignId;

    const convertedLoanAmount = 4206840;

    try {
      const totalInvestedShares =
        await shareService.sumActiveNonReferralSharesAfterDate();

      const totalLockedShares = await shareService.countLockedShares();

      const totalReferralBonusShares =
        await shareService.countReferralBonusShares();

      console.log("totalLockedShares", totalLockedShares);
      console.log("totalReferralBonusShares", totalReferralBonusShares);

      //Captable with user details
      const capTable = await shareService.getSharesWithUserDetails();

      const totalCompanyShares = 3000000;

      const capTableWithPercentage = capTable.map((entry) => ({
        ...entry,
        ownershipPercentage: parseFloat(
          ((entry.totalShares / totalCompanyShares) * 100).toFixed(2)
        ),
      }));

      const totalShares = capTable.reduce(
        (sum, entry) => sum + entry.totalShares,
        0
      );

      //affiliate code
      //const affiliate = await userService.getUserByUserId(req.params.affiliate);

      //TODO change the name and function make it dynamic and from a data
      //const countPurchases = await shareService.countPurcahsesAfter2023();
      //console.log("this is the count of purchases", countPurchases);

      const countPurchases =
        await shareService.countSharesAfterDateExcludingReferrals(
          new Date("2023-12-31T23:59:59.999Z")
        );

      return res.status(200).json({
        campaign: {
          companyInfo: {
            name: "Folkekraft AS",
            description:
              "Folkekraft AS er et strømselskap der all kunder er medeier i selskapet.",
            tags: ["medeierskap", "b2c", "fintech", "emisjon", "energi"],
          },
          investmentDetails: {
            totalInvestments: countPurchases,
            totalInvestedAmount: totalInvestedShares * 8 + convertedLoanAmount,
            minimumInvestment: 2400,
            sharesPurchasedInPercent: (
              ((totalInvestedShares * 8 + convertedLoanAmount) / 8000000) *
              100
            ).toFixed(0),
            status: "active",
            closingDate: new Date("2024-10-31T23:59:59.999Z"),
          },
          perks: [
            {
              title: "Bli Folkekraft kunde",
              actionText: "Du vil få i aksjer ",
              boldText: "1 000kr",
              description:
                "Alle kunder får 1 000kr for kundefoldet, vi oppforder aller invester til å bli kunde hos oss.",
              button: {
                text: "Bli kunde",
                link: process.env.CLIENT_BASE_URL + "/bestill",
              },
            },
            {
              title: "Verv Folkekraft",
              actionText: "Du vil få i aksjer ",
              boldText: "300kr",
              description:
                "Her får du en unik mulighet til å få 300kr i verv for hver person du referer til Folkekraft.",
              button: {
                text: "Verve lenke",
                link: process.env.CLIENT_BASE_URL + "/folkekraft/portfolio",
              },
            },
            {
              title: "Investor tilbud",
              actionText: "Du vil få i aksjer ",
              boldText: "10 000kr",
              description:
                "Investerer du 10 000kr eller mer i Folkekraft får du vår strøm til 0kr månedsbeløp og 0kr i påslag.",
              button: {
                text: "Investor tilbud",
                link: process.env.CLIENT_BASE_URL + "/folkekraft/invest",
              },
            },
          ],
          displayImages: [
            {
              image: "https://via.placeholder.com/600x400",
              alt: "Folkekraft AS",
            },
            {
              image: "https://via.placeholder.com/600x400",
              alt: "Folkekraft AS",
            },
            {
              image: "https://via.placeholder.com/600x400",
              alt: "Folkekraft AS",
            },
            {
              image: "https://via.placeholder.com/600x400",
              alt: "Folkekraft AS",
            },
            {
              image: "https://via.placeholder.com/600x400",
              alt: "Folkekraft AS",
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
        },
        caplist: {
          investors: capTableWithPercentage,
          totalShares,
        },
      });
    } catch (error) {
      campaignLogger.error(`Error fetching campaign data: ${campaignId}`, {
        error: error,
      });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getInvestmentDetails(req: Request, res: Response) {
    const campaignId = req.params.campaignId;

    return res.status(200).json({
      title: "Investering i Folkekraft AS",
      icon: "https://via.placeholder.com/150",
      description:
        "Invest in Folkekraft to get access to our platform and start investing in the stock market.",
      investmentDetails: {
        investmentMinimum: 300,
        investmentMaximum: 10000,
        investmentRecommendation: 1000,
        investmentPurchaseRight: 1000,
      },
      perks: [
        {
          title: "Få 1 000kr",
          value: 0,
          description:
            "Når du blir kunde får du 1000kr for kundefoldet, vi oppforder aller invester til å bli kunde hos oss.",
        },
        {
          title: "6 800 kr",
          value: 850,
          description:
            "Dette er det vi ønsker alle våre invester kommer inn med i Folkekraft.",
        },
        {
          title: "10 000 kr",
          value: 1250,
          description:
            "Investerer du 10 000kr eller mer i Folkekraft får du vår strøm til 0kr månedsbeløp og 0kr i påslag.",
        },
      ],
      terms: [
        {
          id: 1,
          text: "I understand that I can cancel my investment up until 10/30/24 (48 hours prior to the deal deadline)",
          link: null,
          url: null,
        },
        {
          id: 2,
          text: "I understand that Republic will receive a cash and securities commission as further detailed in the offering documents",
          link: "receive a cash",
          url: null,
        },
        {
          id: 3,
          text: "I understand that investing this amount into several deals would better diversify my risk",
          link: null,
          url: null,
        },
        {
          id: 4,
          text: "I understand that there is no guarantee of a relationship between Republic and Groundfloor post-offering",
          link: null,
          url: null,
        },
      ],
    });
  }

  async purchaseShares(req: Request, res: Response) {
    const campaignId = req.params.campaignId;

    const { userId, ssn, shareNumber, termsAccepted } = req.body;

    console.log(req.body);

    //TODO: create a campaign controller for companies

    //try {
    const user = await userService.getUserByUserId(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    // Create a new transaction
    const newTransaction = await transactionService.createTransaction({
      userId: user.user_id,
      stripePaymentId: `Emisjon_${ssn}`,
      paymentMethod: "bank_transfer",
      transactionType: "shares",
      amount: shareNumber * 8,
      currency: "NOK",
      status: "pending",
      taxAmount: 0,
      taxRate: 0,
      discount: 0,
      metadata: new Map([
        ["campaignId", campaignId],
        ["shareNumber", shareNumber.toString()],
        ["ssn", ssn],
      ]),
      transactionDate: new Date(),
    });

    if (!newTransaction) {
      return res.status(500).json({
        success: false,
        message: "Failed to create transaction.",
      });
    }

    if (!newTransaction) {
      return res.status(500).json({
        success: false,
        message: "Failed to create transaction.",
      });
    }

    // Create a new share entry
    const newShare = await shareService.createShare({
      userId: user.user_id,
      transactionId: newTransaction._id.toString(),
      numberOfShares: shareNumber,
      purchaseDate: new Date(),
      purchasePrice: 8,
      ssn: ssn,
      shareStatus: "active",
      isLocked: false,
    });

    // Create a notification
    await notificationService.createNotification(
      user.user_id,
      `Du har kjøpt ${shareNumber} aksjer.`,
      `Du har kjøpt ${shareNumber} akjser for ${shareNumber * 8} kr.`,
      "info"
    );

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
                                                Emisjon ${ssn}
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
                                Antall aksjer kjpt: ${shareNumber}
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
                                ${shareNumber * 8} kr
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
                                ${shareNumber * 8} kr
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

    return res.status(200).json({
      success: true,
      message: `Du har tegnet deg ${shareNumber} aksjer i Folkekraft AS.`,
    });
    /*} catch (error) {
      campaignLogger.error(`Error fetching campaign data: ${campaignId}`, {
        error: error,
      });
      return res.status(500).json({ message: "Internal server error" });
    }*/
  }
}

export default new CampaignController();
