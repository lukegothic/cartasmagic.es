const DIA_MS = 86400000;

const iso = (fecha) => fecha.toISOString().slice(0, 10);

module.exports = { DIA_MS, iso };
