import { Prisma } from "@/generated/prisma/client";

type TxClient = Prisma.TransactionClient;

const ROI_MONTHS = 18;

/**
 * 11.111% (= 100/9 %) of the principal per month for 18 months => 200% total.
 * 100000 * (100/9)/100 = 11111.11... -> rounds to 11111/month for months 1-17;
 * month 18 absorbs the rounding remainder so the 18-month total is exactly 2x.
 */
export async function generateRoiSchedule(
  tx: TxClient,
  investmentId: string,
  amount: Prisma.Decimal
) {
  const monthlyBase = amount.div(9).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  const total = amount.mul(2);
  const lastMonthAmount = total.sub(monthlyBase.mul(ROI_MONTHS - 1));

  const rows = Array.from({ length: ROI_MONTHS - 1 }, (_, i) => ({
    investmentId,
    monthNo: i + 1,
    amount: monthlyBase,
  }));
  rows.push({ investmentId, monthNo: ROI_MONTHS, amount: lastMonthAmount });

  await tx.roiSchedule.createMany({ data: rows });
}
