import { Router } from "express";
import {
  createProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
  getLandlordRequests,
  updateRequestStatus,
} from "../controllers/landlord.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createPropertySchema,
  updatePropertySchema,
  propertyIdParamSchema,
} from "../validations/property.validation";
import {
  updateRentalRequestStatusSchema,
} from "../validations/rental.validation";

const router = Router();

router.use(authenticate, authorize("LANDLORD"));

router.post("/properties", validate(createPropertySchema), createProperty);
router.get("/properties", getMyProperties);
router.put("/properties/:id", validate(updatePropertySchema), updateProperty);
router.delete("/properties/:id", validate(propertyIdParamSchema), deleteProperty);

router.get("/requests", getLandlordRequests);
router.patch("/requests/:id", validate(updateRentalRequestStatusSchema), updateRequestStatus);

export default router;
