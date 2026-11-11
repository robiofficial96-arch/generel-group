import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SLOT_AMOUNTS = [
  10_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
  10_000_000,
];

// Rank 1 is leg-volume based (qualificationAmount, per leg).
// Rank 2+ ("2x <previous rank>") is leg-count based: requiredRankCountPerLeg holders
// of the previous rank in EACH leg (default assumption: 1 per leg = 2 total —
// client needs to confirm whether it's 1 or 2 per leg; see project_roadmap.md).
const RANKS = [
  { order: 1, name: "Sr. Executive Officer", qualificationAmount: 1_000_000, requiredRankCountPerLeg: null, salaryAmount: null, salaryMonths: null, isLifetimeSalary: false, physicalReward: "10,000 Tk Cash Reward" },
  { order: 2, name: "Asst. Manager", qualificationAmount: null, requiredRankCountPerLeg: 1, salaryAmount: 5_000, salaryMonths: 6, isLifetimeSalary: false, physicalReward: null },
  { order: 3, name: "Manager", qualificationAmount: null, requiredRankCountPerLeg: 1, salaryAmount: 15_000, salaryMonths: 6, isLifetimeSalary: false, physicalReward: "Laptop / PC" },
  { order: 4, name: "Asst. General Manager", qualificationAmount: null, requiredRankCountPerLeg: 1, salaryAmount: 50_000, salaryMonths: 6, isLifetimeSalary: false, physicalReward: "Family Tour (Cox's Bazar)" },
  { order: 5, name: "Deputy General Manager", qualificationAmount: null, requiredRankCountPerLeg: 1, salaryAmount: 100_000, salaryMonths: 6, isLifetimeSalary: false, physicalReward: "Car" },
  { order: 6, name: "General Manager", qualificationAmount: null, requiredRankCountPerLeg: 1, salaryAmount: 300_000, salaryMonths: 6, isLifetimeSalary: false, physicalReward: "Flat, 3 Country Tour" },
  { order: 7, name: "Asst. Director", qualificationAmount: null, requiredRankCountPerLeg: 1, salaryAmount: 1_000_000, salaryMonths: 0, isLifetimeSalary: true, physicalReward: "Car (1cr), Duplex Villa (10 Katha), Full Family Europe Tour" },
];

async function main() {
  for (const amount of SLOT_AMOUNTS) {
    await prisma.investmentSlot.upsert({
      where: { amount },
      update: {},
      create: { amount },
    });
  }

  for (const rank of RANKS) {
    await prisma.rank.upsert({
      where: { order: rank.order },
      update: rank,
      create: rank,
    });
  }

  const adminMobile = "01700000000";
  const existingAdmin = await prisma.user.findUnique({
    where: { mobile: adminMobile },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin1234", 10);
    await prisma.user.create({
      data: {
        name: "Super Admin",
        mobile: adminMobile,
        passwordHash,
        role: "ADMIN",
        wallet: { create: {} },
        matchingLedger: { create: {} },
      },
    });
    console.log(`Admin created -> mobile: ${adminMobile}, password: admin1234`);
  } else {
    console.log("Admin already exists, skipping.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
