import { validateSchema } from "./validateSchema";
import { loginSchema, registerSchema } from "./schema/authSchema";

const authValidation = {
  login: validateSchema(loginSchema),
  register: validateSchema(registerSchema),
};

export default authValidation;
