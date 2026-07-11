import { Router } from "express";
import { getProperties, getPropertyById } from "../controllers/property.controller";
import { validate } from "../middleware/validate.middleware";
import { propertyQuerySchema, propertyIdParamSchema } from "../validations/property.validation";

const router = Router();

router.get("/", validate(propertyQuerySchema), getProperties);
router.get("/:id", validate(propertyIdParamSchema), getPropertyById);

export default router;
