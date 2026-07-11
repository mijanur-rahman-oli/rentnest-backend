import { Router } from "express";
import authRoutes from "./auth.routes";
import propertyRoutes from "./property.routes";
import categoryRoutes from "./category.routes";
import landlordRoutes from "./landlord.routes";
import rentalRoutes from "./rental.routes";
import paymentRoutes from "./payment.routes";
import reviewRoutes from "./review.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/properties", propertyRoutes);
router.use("/categories", categoryRoutes);
router.use("/landlord", landlordRoutes);
router.use("/rentals", rentalRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);

export default router;
