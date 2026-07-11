import { Router } from "express";
import { createReview } from "../controllers/review.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { createReviewSchema } from "../validations/review.validation";

const router = Router();

router.post("/", authenticate, authorize("TENANT"), validate(createReviewSchema), createReview);

export default router;
