function parseNumber(input) {
  if (!input) return NaN;

  input = input.toString().toLowerCase().replace(/,/g, '');

  const multipliers = {
    k: 1e3,
    m: 1e6,
    b: 1e9,
    t: 1e12,
    q: 1e15
  };

  const match = input.match(/^([0-9]*\.?[0-9]+)([kmbtq]?)$/);

  if (!match) return NaN;

  const number = parseFloat(match[1]);
  const suffix = match[2];

  return number * (multipliers[suffix] || 1);
}

module.exports = parseNumber;
