export const _toPascalCase = (str: string): string => {
    return str
        .split(/[\s_]+/) // Split by spaces or underscores
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
        .join(''); // Join back together
};
