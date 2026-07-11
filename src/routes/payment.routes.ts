import { Router } from "express";
import {
  createPayment,
  confirmPayment,
  getMyPayments,
  getPaymentById,
} from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { createPaymentSchema, confirmPaymentSchema } from "../validations/payment.validation";

const router = Router();

router.use(authenticate, authorize("TENANT"));

router.post("/create", validate(createPaymentSchema), createPayment);
router.post("/confirm", validate(confirmPaymentSchema), confirmPayment);
router.get("/", getMyPayments);
router.get("/:id", getPaymentById);

export default router;
