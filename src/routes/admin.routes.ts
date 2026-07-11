import { Router } from "express";
import {
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  getAllRentals,
} from "../controllers/admin.controller";
import { createCategory } from "../controllers/category.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { updateUserStatusSchema, createCategorySchema } from "../validations/admin.validation";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/users", getAllUsers);
router.patch("/users/:id", validate(updateUserStatusSchema), updateUserStatus);
router.get("/properties", getAllProperties);
router.get("/rentals", getAllRentals);
router.post("/categories", validate(createCategorySchema), createCategory);

export default router;
