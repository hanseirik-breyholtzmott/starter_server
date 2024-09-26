//Models
import ElectricityContractModel, {
  IElectricityContractModel,
} from "../models/electricityContract.model";
import UserModel from "../models/users.model";

//Service
import shareService from "./shareService";
import transactionService from "./transactionService";

const electricityContractService = {
  async createElectricityContract(
    userId: string,
    address: object
  ): Promise<IElectricityContractModel | null> {
    const user = await UserModel.findOne({ user_id: userId });
    if (!user) {
      throw new Error("User not found");
    }

    //Create a new electricity contract
    const newElectricityContract = new ElectricityContractModel({
      userId: user.user_id,
      address,
      contractName: "Spotpris + Aksjer",
      contractStartDate: new Date(),
    });

    return await newElectricityContract.save();
  },
};

export default electricityContractService;

/*

userId: { type: Schema.Types.ObjectId, ref: "User" },
    address: { type: Schema.Types.String, required: true },
    contractName: { type: Schema.Types.String, required: true },
    contractStartDate: { type: Schema.Types.Date, required: true },*/

/*

    userId: { type: Schema.Types.ObjectId, ref: "User" },
    address: { type: AddressSchema, default: null },
    contractName: { type: Schema.Types.String, required: true },
    contractStartDate: { type: Schema.Types.Date, required: true },

*/
