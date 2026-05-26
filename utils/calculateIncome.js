module.exports = function calculateIncome(
  gasps,
  price,
  cashBoost = 0
) {
  return gasps * price * (1 + cashBoost / 100);
};
