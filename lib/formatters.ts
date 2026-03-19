const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const quantityFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium"
});

export function formatCurrency(value: number | string) {
  return currencyFormatter.format(Number(value));
}

export function formatCurrencyInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  return currencyFormatter.format(Number(digitsOnly) / 100);
}

export function formatQuantity(value: number | string) {
  return quantityFormatter.format(Number(value));
}

export function formatDate(value: Date | string) {
  return dateFormatter.format(new Date(value));
}

export function parseCurrencyInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return 0;
  }

  return Number(digitsOnly) / 100;
}
