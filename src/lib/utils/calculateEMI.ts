import type { EMICalculation } from '@/types'

export function calculateEMI(
  principal: number,
  ratePercent: number,
  tenureMonths: number,
): EMICalculation {
  if (principal <= 0 || ratePercent <= 0 || tenureMonths <= 0) {
    return {
      emi: 0,
      total_payment: 0,
      total_interest: 0,
    }
  }

  const monthlyRate = ratePercent / 12 / 100
  const factor = (1 + monthlyRate) ** tenureMonths
  const emi = (principal * monthlyRate * factor) / (factor - 1)
  const totalPayment = emi * tenureMonths

  return {
    emi: Number(emi.toFixed(2)),
    total_payment: Number(totalPayment.toFixed(2)),
    total_interest: Number((totalPayment - principal).toFixed(2)),
  }
}
