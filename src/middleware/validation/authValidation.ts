import { validateSchema } from "./validateSchema";
import { loginSchema, registerSchema, emailSchema } from "./schema/authSchema";

const authValidation = {
  login: validateSchema(loginSchema),
  register: validateSchema(registerSchema),
  email: validateSchema(emailSchema),
};

export default authValidation;
