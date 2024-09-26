import { Router } from "express";

//Controllers
import electricityContractController from "../controllers/electricityContractController";

const router = Router();

router.post(
  "/newContract",
  electricityContractController.createElectricityContract
);

router.post("/testCreateContract", async (req, res) => {
  console.log("testCreateContract");
  console.log(req.body);
  try {
    const testData = {
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      phone: "1234567890",
      address: "123 Test St",
      city: "Test City",
      postalCode: "12345",
      ssn: "123456789",
    };

    // If the controller doesn't send a response, we'll send one here

    res.status(200).json(testData);
  } catch (error) {
    console.error("Error in test API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

export default router;
