
import type { Currency, ProjectStatus } from "./types";

export const CURRENCIES: Currency[] = ['BRL', 'USD', 'EUR'];
export const PROJECT_STATUSES: ProjectStatus[] = ['Pendente', 'Em Andamento', 'Concluído', 'Atrasado'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
};
