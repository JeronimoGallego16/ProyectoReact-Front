export function validateRequiredText(value: unknown, errorMessage: string): string | null {
    if (value === undefined || value === null || String(value).trim() === "") {
        return errorMessage;
    }

    return null;
}

export function validatePositiveNumber(value: unknown, errorMessage: string): string | null {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return errorMessage;
    }

    if (Number(value) <= 0) {
        return errorMessage;
    }

    return null;
}