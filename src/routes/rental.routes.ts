import { Router } from "express";
import {
  createRentalRequest,
  getMyRentalRequests,
  getRentalRequestById,
} from "../controllers/rental.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createRentalRequestSchema,
  rentalRequestIdParamSchema,
} from "../validations/rental.validation";

const router = Router();

router.use(authenticate);

router.post("/", authorize("TENANT"), validate(createRentalRequestSchema), createRentalRequest);
router.get("/", authorize("TENANT"), getMyRentalRequests);
router.get("/:id", authorize("TENANT"), validate(rentalRequestIdParamSchema), getRentalRequestById);

export default router;
