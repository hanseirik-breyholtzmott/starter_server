import { Request, Response } from "express";

//Services
import shareService from "../service/shareService";

//Logger
import { campaignLogger } from "../logger";

class CampaignController {
  async getCampaign(req: Request, res: Response) {
    const campaignId = req.params.campaignId;

    const convertedLoanAmount = 4206840;
    const convertedLoanShares = 0;
    const convertedLoanPurchase = 0;

    try {
      const totalShares = await shareService.countTotalSharesIn2024();

      const caplist = await shareService.getSharesWithUserDetails();

      return res.status(200).json({
        campaign: {
          companyInfo: {
            name: "Folkekraft AS",
            description:
              "Folkekraft AS is a company that invests in renewable energy projects.",
            tags: ["medeierskap", "b2c", "fintech", "emisjon", "energi"],
          },
          investmentDetails: {
            totalInvestors: 410,
            totalInvestedAmount: 100,
            minimumInvestment: 2400,
            sharesPurchasedInPercent: 16,
            status: "active",
            closingDate: null,
          },
          perks: [
            {
              title: "Bli Folkekraft kunde",
              actionText: "Du vil få i aksjer ",
              boldText: "1 000kr",
              description:
                "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Dolore voluptas vitae incidunt.",
              button: {
                text: "Bli kunde",
                link: "https://www.folkekraft.no",
              },
            },
            {
              title: "Verv Folkekraft",
              actionText: "Du vil få i aksjer ",
              boldText: "300kr",
              description:
                "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Dolore voluptas vitae incidunt.",
              button: {
                text: "Verve lenke",
                link: "https://www.folkekraft.no",
              },
            },
            {
              title: "Investor tilbud",
              actionText: "Du vil få i aksjer ",
              boldText: "300kr",
              description:
                "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Dolore voluptas vitae incidunt.",
              button: {
                text: "Verve lenke",
                link: "https://www.folkekraft.no",
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
        },
        caplist: {
          investors: caplist,
        },
      });
    } catch (error) {
      campaignLogger.error(`Error fetching campaign data: ${campaignId}`, {
        error: error,
      });
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default new CampaignController();
