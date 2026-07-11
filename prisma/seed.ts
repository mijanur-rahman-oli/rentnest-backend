import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: process.env.ADMIN_NAME || "RentNest Admin",
      email: adminEmail,
      password: hashedAdminPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`Admin ready: ${admin.email} / ${adminPassword}`);

  const categoryNames = ["Apartment", "House", "Studio", "Room", "Villa", "Office"];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { slug: name.toLowerCase() },
      update: {},
      create: { name, slug: name.toLowerCase() },
    });
    categories.push(category);
  }
  console.log(`${categories.length} categories ready`);

  // ---- Sample landlord ----
  const landlordPassword = await bcrypt.hash("landlord123", 10);
  const landlord = await prisma.user.upsert({
    where: { email: "landlord@rentnest.com" },
    update: {},
    create: {
      name: "Karim Rahman",
      email: "landlord@rentnest.com",
      password: landlordPassword,
      phone: "+8801700000000",
      role: "LANDLORD",
      status: "ACTIVE",
    },
  });
  console.log(`Sample landlord ready: ${landlord.email} / landlord123`);

  const tenantPassword = await bcrypt.hash("tenant123", 10);
  const tenant = await prisma.user.upsert({
    where: { email: "tenant@rentnest.com" },
    update: {},
    create: {
      name: "Ayesha Islam",
      email: "tenant@rentnest.com",
      password: tenantPassword,
      phone: "+8801800000000",
      role: "TENANT",
      status: "ACTIVE",
    },
  });
  console.log(`Sample tenant ready: ${tenant.email} / tenant123`);

  const existingProperties = await prisma.property.count({ where: { landlordId: landlord.id } });
  if (existingProperties === 0) {
    await prisma.property.createMany({
      data: [
        {
          title: "Cozy 2-Bed Apartment in Gulshan",
          description: "A modern, well-lit 2-bedroom apartment close to Gulshan Circle 2.",
          type: "APARTMENT",
          price: 45000,
          bedrooms: 2,
          bathrooms: 2,
          areaSqft: 1100,
          address: "Road 11, Gulshan 2",
          city: "Dhaka",
          region: "Dhaka Division",
          amenities: ["Wifi", "Elevator", "Parking", "Generator"],
          images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"],
          landlordId: landlord.id,
          categoryId: categories[0].id,
        },
        {
          title: "Spacious Family House in Sylhet",
          description: "4-bedroom house with a garden, ideal for families.",
          type: "HOUSE",
          price: 60000,
          bedrooms: 4,
          bathrooms: 3,
          areaSqft: 2200,
          address: "Ambarkhana",
          city: "Sylhet",
          region: "Sylhet Division",
          amenities: ["Garden", "Parking", "Security"],
          images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994"],
          landlordId: landlord.id,
          categoryId: categories[1].id,
        },
        {
          title: "Compact Studio near Dhaka University",
          description: "Perfect for students, fully furnished studio unit.",
          type: "STUDIO",
          price: 15000,
          bedrooms: 1,
          bathrooms: 1,
          areaSqft: 450,
          address: "Nilkhet Road",
          city: "Dhaka",
          region: "Dhaka Division",
          amenities: ["Wifi", "Furnished"],
          images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
          landlordId: landlord.id,
          categoryId: categories[2].id,
        },
      ],
    });
    console.log("3 sample properties created");
  }

  console.log("Seeding complete");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
